import { supabase } from '../utils/supabaseClient.js';
import { sendMessage } from '../utils/coolSms.js';
import generate4DigitRandom from '../utils/random.js';
import bcrypt from 'bcrypt';

//OTP 발송
export const sendOtp = async (phoneNumber) => {
  const otp = generate4DigitRandom();
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000);  // 3분 후 만료(제거)

  try {
    const { error } = await supabase
      .from('otp_codes')
      .insert([{ phone_number: phoneNumber, code: otp, expires_at: expiresAt }]);

    if (error) {
      console.error('Supabase에 OTP 저장 중 오류 발생:', error);
      throw new Error('OTP 저장 중 오류 발생: ' + error.message);
    }

    await sendMessage(phoneNumber, `오하린 인증번호 [${otp}]`);
    return otp;
  } catch (error) {
    console.error('sendOtp 함수에서 오류 발생:', error);
    throw error;
  }
};

// OTP 검증
export const verifyOtp = async (phoneNumber, code) => {
  const { data, error } = await supabase
    .from('otp_codes')
    .select('code, expires_at')
    .eq('phone_number', phoneNumber)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw new Error('OTP 조회 중 오류 발생: ' + error.message);

  if (data.code !== code) {
    throw new Error('인증번호가 일치하지 않습니다.');
  }

  const now = new Date();
  if (new Date(data.expires_at) < now) {
    throw new Error('OTP가 만료되었습니다.');
  }

  console.log(data);

  // 인증 성공 시 OTP 삭제
  await supabase
    .from('otp_codes')
    .delete()
    .eq('phone_number', phoneNumber);

  return true;
};

// 전화번호 중복 확인 함수
export const checkPhoneNumber = async (phoneNumber) => {

  const { data, error } = await supabase
    .from('users')  // 사용자가 저장된 테이블
    .select('id')  // 필요한 필드만 선택
    .eq('phone_number', phoneNumber);

  if (error) {
    throw new Error('전화번호 확인 중 오류 발생: ' + error.message);
  }

  return data.length > 0;  // 사용자가 존재하는지 여부 반환
};

// 사용자 등록 함수
export const registerUser = async (phoneNumber, nickname, password, receiveNotifications) => {
  const hashedPassword = await bcrypt.hash(password, 10);  // 비밀번호 해싱

  const { error } = await supabase
    .from('users')  // 사용자 정보 저장 테이블
    .insert([{ phone_number: phoneNumber, nickname, password_hash: hashedPassword, receive_notifications: receiveNotifications}]);

  if (error) {
    throw new Error('사용자 등록 중 오류 발생: ' + error.message);
  }
};

// 전화번호로 사용자 찾기
export const getUserByPhoneNumber = async (phoneNumber) => {
  try {
    const { data, error } = await supabase
      .from('users')  // 'users' 테이블에서 조회
      .select('*')     // 모든 필드 선택
      .eq('phone_number', phoneNumber)  // 조건: phone_number가 일치하는 행 선택
      .single();       // 단일 결과 반환 (전화번호는 고유해야 함)

    if (error) {
      throw new Error(error.message);
    }

    return data;  // 조회된 사용자 데이터 반환
  } catch (error) {
    throw new Error("사용자 조회 실패: " + error.message);
  }
};

//비밀번호 비교하기
export const comparePassword = async (inputPassword, storedPasswordHash) => {
  try {
    return await bcrypt.compare(inputPassword, storedPasswordHash);
  } catch (error) {
    throw new Error("비밀번호 비교 실패: " + error.message);
  }
};

// 비밀번호 해싱
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// 유저 이름 업데이트
export const updateUserNickname = async (userId, newNickname) => {
  const { data, error } = await supabase
    .from('users')
    .update({ nickname: newNickname })
    .eq('id', userId);  // 사용자 ID에 해당하는 행 업데이트

  if (error) {
    throw new Error("비밀번호 업데이트 실패: " + error.message);
  }

  return data;
};

// 비밀번호 업데이트
export const updateUserPassword = async (userId, hashedPassword) => {
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: hashedPassword })
    .eq('id', userId);  // 사용자 ID에 해당하는 행 업데이트

  if (error) {
    throw new Error("비밀번호 업데이트 실패: " + error.message);
  }

  return data;
};

// 유저 정보 가져오기
export const getUserById = async (userId) => {
  try {
    // 데이터베이스에서 사용자 정보를 ID로 조회
    const { data, error } = await supabase
      .from('users')  // 'users' 테이블에서 조회
      .select('id, phone_number, nickname, receive_notifications')  // 필요한 필드 선택
      .eq('id', userId)  // 조건: id가 일치하는 사용자 선택
      .single();  // 단일 결과 반환

    if (error) {
      throw new Error(error.message);
    }

    console.log(data);  // 조회된 사용자 데이터 로그 출력
    return data;
  } catch (error) {
    throw new Error("사용자 정보 조회 중 오류 발생: " + error.message);
  }
};

// 유저 비밀번호 가져오기
export const getUserByPassword = async (userId) => {
  try {
    // 데이터베이스에서 사용자 정보를 ID로 조회
    const { data, error } = await supabase
      .from('users')  // 'users' 테이블에서 조회
      .select('password_hash')  // 필요한 필드 선택
      .eq('id', userId)  // 조건: id가 일치하는 사용자 선택
      .single();  // 단일 결과 반환

    if (error) {
      throw new Error(error.message);
    }

    console.log(data);  // 조회된 사용자 데이터 로그 출력
    return data;
  } catch (error) {
    throw new Error("사용자 비밀번호 조회 중 오류 발생: " + error.message);
  }
};

// 사용자 삭제 함수
export const deleteUserById = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);  // 사용자 ID에 해당하는 데이터 삭제

  if (error) {
    throw new Error("회원 삭제 실패: " + error.message);
  }

  return data;
};