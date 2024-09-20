import axios from 'axios';
import crypto from 'crypto';
import 'dotenv/config';

const apiKey = process.env.COOLSMS_API_KEY;
const apiSecret = process.env.COOLSMS_API_SECRET;
const senderPhone = process.env.COOLSMS_SENDER_PHONE;

export const sendMessage = async (to, content) => {
  const url = 'https://api.coolsms.co.kr/messages/v4/send';

  // ISO 8601 형식의 현재 날짜
  const isoDate = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2);
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(isoDate + salt)
    .digest('hex');

  const data = {
    message: {
      to: to,
      from: senderPhone,
      text: content,
    }
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${isoDate}, salt=${salt}, signature=${signature}`,
  };

  // 데이터 체크
  //console.log('전송할 데이터:', data);

  try {
    const response = await axios.post(url, data, { headers });
    console.log('SMS 발송 성공:', response.data);
  } catch (error) {
    console.error('SMS 발송 실패:', error.response ? error.response.data : error.message);
    throw new Error('SMS 발송 실패');
  }
};
