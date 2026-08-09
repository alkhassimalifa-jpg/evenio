import { Router } from 'express';
import { register, login, getMe, sendPhoneOtp, verifyPhoneOtp } from '../controllers/auth.controller';
import { registerValidator, loginValidator } from '../validators/auth.validator';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/me', authenticate, getMe);
router.post('/phone/send-otp', authenticate, sendPhoneOtp);
router.post('/phone/verify-otp', authenticate, verifyPhoneOtp);

export default router;