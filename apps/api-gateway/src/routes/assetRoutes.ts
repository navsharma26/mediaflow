import express, { Router } from 'express';
import { uploadIntent, uploadAsset, directUpload, getUserAssets } from '../controllers/assetController.js';
import { authenticateJWT } from '../middlewares/auth.js';
import { uploadMiddleware } from '../middlewares/upload.js';

const router = Router();

router.use(authenticateJWT);
router.post('/upload-intent', uploadIntent);
router.put('/direct-upload', express.raw({ type: '*/*', limit: '500mb' }), directUpload);
router.post('/upload', uploadMiddleware.single('file'), uploadAsset);
router.get('/', getUserAssets);

export default router;
