import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pool from './src/config/db';
import cloudinary from './cloudinary';
import { registerRoutes } from './src/routes/routes';

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
});

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

app.use(cors());
app.use(express.json());

app.post('/upload', upload.single('image'), async (req: any, res: any) => {
  try {
    const image = req.file;
    if (!image) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(image.mimetype)) {
      return res.status(400).json({ error: 'Unsupported image type' });
    }

    const dataUri = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder:        'user-management',
      resource_type: 'image',
    });

    return res.status(200).json({
      url:      result.secure_url,
      publicId: result.public_id,
    });

  } catch (error: unknown) {
    console.error('Cloudinary upload failed:', error);
    return res.status(500).json({ error: 'Image upload failed' });
  }
});

registerRoutes(app, pool, cloudinary, JWT_SECRET);

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error: unknown) {
    console.error('Failed to start server:', error);
    process.exitCode = 1;
  }
};

void startServer();