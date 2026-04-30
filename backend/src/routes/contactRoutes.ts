import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as contactController from '../controllers/contactController';

const router = Router();

// Configure Multer for profile image uploads (using memory storage for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.get('/', contactController.list);
router.post('/', upload.single('profileImage'), contactController.create);
router.get('/:id', contactController.list); // Controller doesn't have a single get, but list handles it or use another
router.put('/:id', upload.single('profileImage'), contactController.edit);
router.delete('/:id', contactController.remove);

export default router;
