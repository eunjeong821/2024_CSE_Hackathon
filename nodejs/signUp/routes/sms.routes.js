import express from 'express';
import * as authController from '../controllers/auth.controller.js';

const smsRouter = express.Router();

// 회원가입 OTP 발송 경로
smsRouter.post('/auth/otp', authController.postOtp);

// 비번 찾기 OTP 발송 경로
smsRouter.post('/auth/otp_find', authController.onlyPostOtp);

// OTP 검증 경로
smsRouter.post('/auth/otp/validation', authController.otpVerification);

export default smsRouter;
