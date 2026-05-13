import express from 'express';
import { signup, verifyOTP, resendOTP, login } from '../controllers/authController.js';

const router = express.Router();

// Auth routes
router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);

export default router;
