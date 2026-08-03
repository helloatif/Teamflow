import { Router } from 'express';
import { successResponse } from '../utils/apiResponse.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json(
    successResponse('TeamFlow API is running', {
      service: 'backend',
      status: 'healthy',
    })
  );
});

export default router;
