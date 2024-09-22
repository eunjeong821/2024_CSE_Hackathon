// Supabase 클라이언트 설정
const supabaseUrl = 'https://jvntxuwgdzbwskswvigm.supabase.co'; // 자신의 Supabase URL로 변경
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bnR4dXdnZHpid3Nrc3d2aWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3MDg2NTcsImV4cCI6MjA0MjI4NDY1N30.MdhtzFkiIn1_pE9wUBEMHrS_3tOQ_Rh7qpB0ZFjj2Xk'; // 실제 키로 변경

// Supabase 클라이언트 생성
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey); 

document.getElementById('submitEventBtn').addEventListener('click', async function(event) {
    event.preventDefault(); // 기본 폼 제출 방지
    const eventName = document.getElementById('eventName').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const eventDescription = document.getElementById('eventDescription').value;

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

    // 가게 정보 조회
    const { data: storeData, error: storeFetchError } = await supabase
        .from('store')
        .select('*')
        .eq('phone_number', phoneNumber);

    if (storeFetchError) {
        alert('가게 정보 조회 실패: ' + storeFetchError.message);
        return;
    }

    // 가게 정보가 없으면 메시지 표시
    if (storeData.length === 0) {
        alert('가게를 먼저 등록해주세요.');
        return;
    }

    // 기존 이벤트 조회
    const { data: existingEvents, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('phone_number', phoneNumber);

    if (fetchError) {
        alert('이벤트 조회 실패: ' + fetchError.message);
        return;
    }

    // 기존 이벤트가 있으면 삭제
    if (existingEvents.length > 0) {
        const { error: deleteError } = await supabase
            .from('events')
            .delete()
            .eq('phone_number', phoneNumber); // 전화번호에 해당하는 이벤트 삭제

        if (deleteError) {
            alert('기존 이벤트 삭제 실패: ' + deleteError.message);
            return;
        }
    }

    // 새로운 할인 행사 등록
    const { data, error } = await supabase
        .from('events') // 'events' 테이블에 등록한다고 가정
        .insert([{ 
            name: eventName, 
            start_date: startDate, 
            end_date: endDate,
            description: eventDescription,
            phone_number: phoneNumber // 행사 소개글 추가
        }]);

    if (error) {
        alert('행사 등록 실패: ' + error.message);
    } else {
        alert('행사가 등록되었습니다!');
        document.getElementById('eventForm').reset();
    }
});
