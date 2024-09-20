import jwt from 'jsonwebtoken';
import { tokenBlacklist } from '../app.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // Bearer token

  if (!token) {
    return res.sendStatus(401);  // 토큰이 없으면 접근 불가
  }

  // 블랙리스트에 있는지 확인
  if (tokenBlacklist.includes(token)) {
    return res.sendStatus(403);  // 블랙리스트에 있으면 403 Forbidden 반환
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
        console.log("JWT 검증 실패:",err.message);
        return res.sendStatus(403);// 토큰이 유효하지 않으면 403 반환
    }  
    req.user = user;
    next();
  });
  
};
