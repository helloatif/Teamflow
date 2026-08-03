import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js';
import { successResponse } from '../utils/apiResponse.js';

const router = Router();

router.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  res.json(
    successResponse('Authenticated user profile', {
      user: req.user,
    })
  );
});

export default router;
