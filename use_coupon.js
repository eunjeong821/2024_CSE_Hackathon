// Supabase 클라이언트 설정
const supabaseUrl = 'https://jvntxuwgdzbwskswvigm.supabase.co'; // 자신의 Supabase URL로 변경
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bnR4dXdnZHpid3Nrc3d2aWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3MDg2NTcsImV4cCI6MjA0MjI4NDY1N30.MdhtzFkiIn1_pE9wUBEMHrS_3tOQ_Rh7qpB0ZFjj2Xk'; // 실제 키로 변경
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 사용자 전화번호 가져오기
const getUserPhoneNumber = async () => {
    const user = 1; // 사용자 정보를 가져오는 함수로 대체
    if (user) {
        const { data, error } = await supabase
            .from('users') // 'users' 테이블에서 조회
            .select('phone_number') // 전화번호만 선택
            .eq('id', '4c639282-f168-4d06-89f6-b62539165ad3') // 로그인한 사용자 ID로 조회
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

// 쿠폰 목록 가져오기
const loadCoupons = async () => {
    const phoneNumber = await getUserPhoneNumber();
    if (!phoneNumber) return;

    const { data: userCoupons, error } = await supabase
        .from('user_coupon')
        .select('code, used')
        .eq('phone_number', phoneNumber);

    if (error) {
        console.error('쿠폰 조회 실패:', error);
        return;
    }

    // 쿠폰 정보를 쿠폰 테이블에서 가져오기
    const couponCodes = userCoupons.map(coupon => coupon.code);
    const { data: coupons, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .in('code', couponCodes);

    if (couponError) {
        console.error('쿠폰 정보 조회 실패:', couponError);
        return;
    }

    // 쿠폰 목록 표시
    const couponList = document.getElementById('couponList');
    couponList.innerHTML = ''; // 기존 내용 초기화

    coupons.forEach(coupon => {
        const userCoupon = userCoupons.find(uc => uc.code === coupon.code);
        const button = userCoupon.used 
            ? `<button disabled>이미 사용됨</button>` 
            : `<button onclick="useCoupon('${coupon.code}')">쿠폰 사용하기</button>`;
        
        couponList.innerHTML += `
            <div>
                <h2>${coupon.name}</h2>
                <p>할인율: ${coupon.discount}%</p>
                <p>유효기간: ${coupon.expiration_date}</p>
                <p>사용 조건: ${coupon.conditions}</p>
                ${button}
            </div>
            <hr>
        `;
    });
};
// 쿠폰 사용하기
window.useCoupon = async (code) => { // 전역으로 정의
    const confirmation = confirm("쿠폰은 단 한 번만 사용할 수 있으니 다시 한 번 확인하세요, 사용하시겠습니까?");
    if (!confirmation) return;

    // 쿠폰 정보를 가져오기
    const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .single();

    if (couponError) {
        alert('쿠폰 정보 조회 실패: ' + couponError.message);
        return;
    }

    // 새로운 창에 쿠폰 정보 표시
    const couponInfo = `
     <style>
        .marquee {
            width: 100%; /* 전체 너비 */
            overflow: hidden; /* 넘치는 내용 숨기기 */
            white-space: nowrap; /* 한 줄로 표시 */
            background-color: #f8d7da; /* 배경 색상 */
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); /* 그림자 효과 */
        }

        .marquee span {
            display: inline-block; /* 인라인 블록 요소 */
            padding: 10px 0; /* 상하 여백 */
            animation: marquee 10s linear infinite; /* 애니메이션 설정 */
        }

        @keyframes marquee {
            0% {
                transform: translateX(100%); /* 오른쪽에서 시작 */
            }
            100% {
                transform: translateX(-100%); /* 왼쪽으로 이동 */
            }
        }
    </style>
        <div class="marquee">
        <span>이 메세지가 움직여야 유효한 쿠폰입니다.</span>
        </div>
        <h1>${coupon.name}</h1>
        <p>할인율: ${coupon.discount}%</p>
        <p>유효기간: ${coupon.expiration_date}</p>
        <p>사용 조건: ${coupon.conditions}</p>
    `;
    const newWindow = window.open("", "_blank");
    newWindow.document.write(couponInfo);
    newWindow.document.close();

    // 쿠폰 사용 처리 및 삭제
    const { error } = await supabase
        .from('user_coupon')
        .delete()
        .eq('code', code)
        .eq('phone_number', await getUserPhoneNumber());

    if (error) {
        alert('쿠폰 사용 실패: ' + error.message);
    } else {
        alert('쿠폰이 사용되었습니다!');
        loadCoupons(); // 쿠폰 목록 새로 고침
    }
};
// 페이지 로드 시 쿠폰 목록 가져오기
document.addEventListener('DOMContentLoaded', loadCoupons);
