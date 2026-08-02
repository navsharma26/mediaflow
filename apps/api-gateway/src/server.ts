import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import jobRoutes from './routes/jobRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;


// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files server for local uploads
const localUploadsDir = path.resolve(process.env.LOCAL_STORAGE_PATH || './uploads');
app.use('/uploads', express.static(localUploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/jobs', jobRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'MediaFlow API Gateway', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 [MediaFlow API Gateway] Server listening on http://localhost:${PORT}`);
});
