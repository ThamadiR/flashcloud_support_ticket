import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as contactController from '../controllers/contactController';

const router = Router();

// Configure Multer for profile image uploads
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'contact-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Routes
router.get('/', contactController.list);
router.post('/', upload.single('profileImage'), contactController.create);
router.get('/:id', contactController.list); // Controller doesn't have a single get, but list handles it or use another
router.put('/:id', upload.single('profileImage'), contactController.edit);
router.delete('/:id', contactController.remove);

export default router;
