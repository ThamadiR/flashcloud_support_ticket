import { Router } from 'express';
import * as ticketsController from '../controllers/ticketsController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Routes
router.get('/ticket', ticketsController.list);
router.get('/:id', ticketsController.show);
router.get('/:ticketId/emails', ticketsController.getEmailsByTicket);

router.put('/:id', ticketsController.updateTicket);
router.post('/emails/reply', upload.array('attachments'), ticketsController.replyEmail);
router.post('/emails/forward', upload.array('attachments'), ticketsController.forwardEmailController);

export default router;
