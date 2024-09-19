// coupon.js
// Supabase 클라이언트 설정
const supabaseUrl = 'https://jvntxuwgdzbwskswvigm.supabase.co'; // 자신의 Supabase URL로 변경
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bnR4dXdnZHpid3Nrc3d2aWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3MDg2NTcsImV4cCI6MjA0MjI4NDY1N30.MdhtzFkiIn1_pE9wUBEMHrS_3tOQ_Rh7qpB0ZFjj2Xk'; // 실제 키로 변경

// Supabase 클라이언트 생성
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey); 

document.getElementById('couponForm').onsubmit = async function(event) {
    event.preventDefault(); // 기본 폼 제출 방지

    const couponCode = document.getElementById('couponCode').value;
    const discount = document.getElementById('discount').value;
    const expirationDate = document.getElementById('expirationDate').value;
    const conditions = document.getElementById('conditions').value;

    // 쿠폰 등록
    const { data, error } = await supabase
        .from('coupons')
        .insert([
            { 
                code: couponCode, 
                discount: discount, 
                expiration_date: expirationDate, 
                conditions: conditions,
                used: false // 기본적으로 사용되지 않음
            }
        ]);

    if (error) {
        alert('쿠폰 등록 실패: ' + error.message);
    } else {
        alert('쿠폰이 등록되었습니다!');
        // 입력 필드 초기화
        document.getElementById('couponCode').value = '';
        document.getElementById('discount').value = '';
        document.getElementById('expirationDate').value = '';
        document.getElementById('conditions').value = '';
    }
};