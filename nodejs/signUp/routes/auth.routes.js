import { Router } from 'express';
import { updateUserD, ghost_user, protectedRout, signUp, getUserData, login, verifyCurrentPassword, updatePassword, deleteUser, logout } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = Router();

// 회원가입 경로
router.post('/signUp', signUp);

// 회원정보 조회(마이페이지) 경로
router.get('/mypage', authenticateToken, getUserData);  // JWT 인증 미들웨어를 사용하여 보호된 API

// 로그인 경로
router.post('/login', login);

// 임의 토큰 발급 경로
router.post('/login_ghost', ghost_user);

// 현재 비밀번호 확인 경로
router.post('/reset-password/verify-current-password', authenticateToken, verifyCurrentPassword);

// 유저 정보 업데이트 경로
router.post('/reset-user/update', authenticateToken, updateUserD);

// 비밀번호 업데이트 경로
router.post('/reset-password/update', authenticateToken, updatePassword);

// 회원 삭제 경로 (JWT 인증 필요)
router.delete('/delete', authenticateToken, deleteUser);

// 로그아웃 경로
router.post('/logout', authenticateToken, logout);

// 보호된 경로 추가 (JWT 인증 필요)
router.get('/protected', authenticateToken, protectedRout);

export default router;
