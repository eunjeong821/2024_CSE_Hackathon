// Supabase 클라이언트 설정
const supabaseUrl = 'https://jvntxuwgdzbwskswvigm.supabase.co'; // 자신의 Supabase URL로 변경
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bnR4dXdnZHpid3Nrc3d2aWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3MDg2NTcsImV4cCI6MjA0MjI4NDY1N30.MdhtzFkiIn1_pE9wUBEMHrS_3tOQ_Rh7qpB0ZFjj2Xk'; // 실제 키로 변경

// Supabase 클라이언트 생성
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey); 


document.getElementById('submitEventBtn').addEventListener('click', async function() {
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

    // 할인 행사 등록
    const { data, error } = await supabase
        .from('events') // 'events' 테이블에 등록한다고 가정
        .insert([{ 
            name: eventName, 
            start_date: startDate, 
            end_date: endDate,
            description: eventDescription,
            phone_number : phoneNumber // 행사 소개글 추가
        }]);

    if (error) {
        alert('행사 등록 실패: ' + error.message);
    } else {
        alert('행사가 등록되었습니다!');
        document.getElementById('eventForm').reset();
    }
});




