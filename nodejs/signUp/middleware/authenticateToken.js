import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // Bearer token

  if (!token) {
    return res.sendStatus(401);  // 토큰이 없으면 접근 불가
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
