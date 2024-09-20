import * as authService from '../services/auth.service.js';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status-codes';
import { tokenBlacklist } from '../app.js';

// 보호된 경로에서 실행될 컨트롤러 함수
export const protectedRout = (req, res) => {
  res.status(200).json({
    message: '인증된 사용자만 접근 가능합니다',
    user: req.user  // JWT 토큰에서 추출한 사용자 정보
  });
};

// 사용자 정보 호출
export const getUserData = async (req, res) => {
  const userId = req.user.id;  // JWT 토큰에서 가져온 사용자 ID
  try {
    console.log(userId);
    const userData = await authService.getUserById(userId);  // 서비스 호출
    console.log(userData);
    return res.status(200).json(userData);
  } catch (error) {
    return res.status(500).json({ message: "사용자 정보 조회 실패" });
  }
};

// 비밀번호 재설정 함수
export const updatePassword = async (req, res) => {
  const { newPassword } = req.body;  // 요청으로부터 새로운 비밀번호를 가져옴
  const userId = req.user.id;  // JWT로부터 사용자 ID를 가져옴

  try {
    // 비밀번호 해싱
    const hashedPassword = await authService.hashPassword(newPassword);

    // 데이터베이스에서 사용자 비밀번호 업데이트
    await authService.updateUserPassword(userId, hashedPassword);

    // 성공적으로 업데이트되면 응답
    return res.status(200).json({ success: true, message: "비밀번호 재설정 완료" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "비밀번호 재설정 실패: " + error.message });
  }
};

// 현재 비밀번호 확인
export const verifyCurrentPassword = async (req, res) => {
  const { currentPassword } = req.body;
  const userId = req.user.id;  // JWT로부터 사용자 ID를 가져옴

  try {
    // 사용자 ID로 사용자 정보 가져오기
    const user = await authService.getUserByPassword(userId);
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 현재 비밀번호 검증
    const isPasswordValid = await authService.comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: '현재 비밀번호가 틀렸습니다.' });
    }

    // 비밀번호가 맞으면 성공 응답
    return res.status(httpStatus.OK).json({ success: true, message: '비밀번호 확인 성공' });
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: '비밀번호 확인 실패: ' + error.message });
  }
};

// 전화번호 중복 확인 및 OTP 발송
export const postOtp = async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    // 전화번호 중복 확인
    const isPhoneExists = await authService.checkPhoneNumber(phoneNumber);
    if (isPhoneExists) {
      return res.status(httpStatus.CONFLICT).json("이미 존재하는 전화번호입니다.");
    }

    // OTP 발송
    await authService.sendOtp(phoneNumber);
    return res.status(httpStatus.OK).json("OTP 발송 성공");
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json("OTP 발송 실패:" + error.message);
  }
};

// OTP 검증 함수
export const otpVerification = async (req, res) => {
  const { phoneNumber, code } = req.body;
  try {
    const otpVerified = await authService.verifyOtp(phoneNumber, code);
    if (!otpVerified) {
      return res.status(httpStatus.FORBIDDEN).json("OTP 검증 실패");
    }
    return res.status(httpStatus.OK).json("OTP 검증 성공");
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json("OTP 검증 실패:" + error.message);
  }
};

// 이름, 폰번호, 비밀번호 및 수신 동의 여부 입력 후 회원가입
export const signUp = async (req, res) => {
  const { phoneNumber, nickname, password, receiveNotifications } = req.body;
  try {
    // 사용자 데이터 저장
    await authService.registerUser(phoneNumber, nickname, password, receiveNotifications);
    return res.status(httpStatus.CREATED).json("회원가입 성공");
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json("회원가입 실패:" + error.message);
  }
};

// 로그인 함수
export const login = async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    // 전화번호로 사용자 찾기
    const user = await authService.getUserByPhoneNumber(phoneNumber);
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 비밀번호 검증
    const isPasswordValid = await authService.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // JWT 토큰 생성 (비밀 키를 환경 변수에서 가져옴)
    const token = jwt.sign(
      { id: user.id, phoneNumber: user.phone_number },
      process.env.JWT_SECRET,  // 이 부분에서 비밀 키 사용
    );

    // 사용자에게 토큰 반환
    return res.status(httpStatus.OK).json({ token });
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "로그인 실패: " + error.message });
  }
};

// 회원 삭제 함수
export const deleteUser = async (req, res) => {
  const userId = req.user.id;  // JWT로부터 사용자 ID를 가져옴

  try {
    // 데이터베이스에서 사용자 삭제
    await authService.deleteUserById(userId);

    // 성공적으로 삭제되면 응답
    return res.status(200).json({ success: true, message: "회원이 성공적으로 삭제되었습니다." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "회원 삭제 실패: " + error.message });
  }
};

// 로그아웃 처리
export const logout = (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];  // Authorization 헤더에서 JWT 토큰 추출

  // 블랙리스트에 토큰 추가
  tokenBlacklist.push(token);

  // 응답: 로그아웃 완료 메시지
  return res.status(200).json({ message: "로그아웃 완료" });
};

// 인증 미들웨어에서 블랙리스트에 있는 토큰 차단
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);  // 토큰이 없으면 401 Unauthorized 반환
  }

  // 토큰이 블랙리스트에 있는지 확인
  if (tokenBlacklist.includes(token)) {
    return res.sendStatus(403);  // 블랙리스트에 있는 토큰이면 403 Forbidden 반환
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);  // 토큰 검증 실패 시 403 반환
    req.user = user;  // 토큰 검증 성공 시 사용자 정보를 req.user에 저장
    next();
  });
};
