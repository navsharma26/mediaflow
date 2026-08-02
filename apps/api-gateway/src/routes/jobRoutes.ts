import { Router } from 'express';
import { createJob, getJobs, getJobById } from '../controllers/jobController.js';
import { authenticateJWT } from '../middlewares/auth.js';

const router = Router();

router.use(authenticateJWT);
router.post('/', createJob);
router.get('/', getJobs);
router.get('/:id', getJobById);

export default router;
