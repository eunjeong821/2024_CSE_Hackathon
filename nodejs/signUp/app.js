import express from 'express';
import authRouter from './routes/auth.routes.js';
import smsRouter from './routes/sms.routes.js';
import 'dotenv/config';
import cors from 'cors'; // CORS 문제를 해결

const app = express();

// 토큰 블랙리스트 관리
export let tokenBlacklist = [];

// 블랙리스트에 추가된 토큰의 만료 시간을 확인하고 만료된 토큰 제거
function cleanExpiredTokens() {
  const now = Math.floor(Date.now() / 1000); // 현재 시간을 초 단위로
  tokenBlacklist = tokenBlacklist.filter(token => {
    try {
      const decoded = jwt.decode(token);
      return decoded.exp > now; // 만료되지 않은 토큰만 남김
    } catch (err) {
      return false; // 디코딩에 실패한 토큰은 제거
    }
  });
}

// 주기적으로 만료된 토큰 정리 (예: 1시간마다 실행)
setInterval(cleanExpiredTokens, 3600000); // 3600000ms = 1시간

// CORS 허용
app.use(cors());

// JSON 형식의 데이터를 파싱하기 위한 미들웨어 설정
app.use(express.json());

// otp라우터 설정
app.use('/api/sms', smsRouter);

// 주요 서비스 라우터 연결
app.use('/api', authRouter);

// 서버가 포트 3000에서 실행되도록 설정
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
