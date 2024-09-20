import express from 'express';
import * as authController from '../controllers/auth.controller.js';

const smsRouter = express.Router();

// OTP 발송 경로
smsRouter.post('/auth/otp', authController.postOtp);

// OTP 검증 경로
smsRouter.post('/auth/otp/validation', authController.otpVerification);

export default smsRouter;
