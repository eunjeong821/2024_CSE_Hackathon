// Supabase 클라이언트 설정
const supabaseUrl = 'https://jvntxuwgdzbwskswvigm.supabase.co'; // 자신의 Supabase URL로 변경
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bnR4dXdnZHpid3Nrc3d2aWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3MDg2NTcsImV4cCI6MjA0MjI4NDY1N30.MdhtzFkiIn1_pE9wUBEMHrS_3tOQ_Rh7qpB0ZFjj2Xk'; // 실제 키로 변경

// Supabase 클라이언트 생성
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey); 




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

    const token = localStorage.getItem('token'); // 여기서 JWT 토큰을 가져옵니다.
    const response = await fetch('http://localhost:3000/api/mypage', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}` // 유효한 JWT 토큰
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error:', errorText);
        alert('사용자 정보를 가져오는 데 실패했습니다.');
        throw new Error('사용자 정보를 가져오는 데 실패했습니다.');
    }

    const user = await response.json();
    const phoneNumber = user.phone_number; 
    
    // 쿠폰 등록
    const { data: couponData, error: couponError } = await supabase
        .from('coupons')
        .insert([
            { 
                code: couponCode, 
                name: name,
                discount: discount, 
                expiration_date: expirationDate, 
                conditions: conditions,
                phone_number: phoneNumber
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