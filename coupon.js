// Supabase 클라이언트 설정
const supabaseUrl = 'https://jvntxuwgdzbwskswvigm.supabase.co'; // 자신의 Supabase URL로 변경
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bnR4dXdnZHpid3Nrc3d2aWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3MDg2NTcsImV4cCI6MjA0MjI4NDY1N30.MdhtzFkiIn1_pE9wUBEMHrS_3tOQ_Rh7qpB0ZFjj2Xk'; // 실제 키로 변경

// Supabase 클라이언트 생성
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey); 


// 사용자 전화번호 가져오기
const getUserPhoneNumber = async () => {
    const user = 1; // 사용자 정보를 가져오는 함수로 대체
    if (user) {
        const { data, error } = await supabase
            .from('users') // 'users' 테이블에서 조회
            .select('phone_number') // 전화번호만 선택
            .eq('id', '8c505c10-a684-4de9-9b80-c4344612ab49') // 로그인한 사용자 ID로 조회
            .single();

        if (error) {
            console.error('사용자 전화번호 조회 실패:', error);
            return null;
        }
        return data.phone_number; // 전화번호 반환
    } else {
        console.error('사용자가 로그인하지 않았습니다.');
        return null;
    }
};

// 랜덤 쿠폰 코드 생성 함수
export const generateCouponCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const codeLength = 10;
    let couponCode = '';
  
    for (let i = 0; i < codeLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        couponCode += characters[randomIndex];
    }
  
    return couponCode;
};

// 쿠폰 폼 제출 시
document.getElementById('submitCouponBtn').addEventListener('click', async function() {

    event.preventDefault(); // 기본 폼 제출 방지

    const couponCode = generateCouponCode(); // 랜덤 쿠폰 코드 생성
    const name = document.getElementById('name').value;
    const discount = document.getElementById('discount').value;
    const expirationDate = document.getElementById('expirationDate').value;
    const conditions = document.getElementById('conditions').value;

    // 사용자 전화번호 가져오기
    const phoneNumber = await getUserPhoneNumber();

    // 쿠폰 등록
    const { data: couponData, error: couponError } = await supabase
        .from('coupons')
        .insert([
            { 
                code: couponCode, 
                name: name,
                discount: discount, 
                expiration_date: expirationDate, 
                conditions: conditions
            }
        ]);

    if (couponError) {
        alert('쿠폰 등록 실패: ' + couponError.message);
        return; // 쿠폰 등록 실패 시 종료
    }

    // 사용자 쿠폰 등록
    const { error: userCouponError } = await supabase
        .from('user_coupon')
        .insert([
            { 
                code: couponCode, 
                phone_number: phoneNumber,
                used: false // 기본적으로 사용되지 않음
            }
        ]);

    if (userCouponError) {
        alert('사용자 쿠폰 등록 실패: ' + userCouponError.message);
    } else {
        alert('쿠폰이 등록되었습니다! 쿠폰 코드: ' + couponCode); // 생성된 쿠폰 코드 표시
        // 입력 필드 초기화
        document.getElementById('name').value = '';
        document.getElementById('discount').value = '';
        document.getElementById('expirationDate').value = '';
        document.getElementById('conditions').value = '';
    }
});