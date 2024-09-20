import express from 'express';
import authRouter from './routes/auth.routes.js';
import smsRouter from './routes/sms.routes.js';
import 'dotenv/config';
import cors from 'cors'; // CORS 문제를 해결

const app = express();

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
