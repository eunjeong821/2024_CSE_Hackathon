
// 할인 행사 등록 함수
export async function registerEvent() {
    const eventName = document.getElementById('eventName').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const eventDescription = document.getElementById('eventDescription').value;

    // 할인 행사 등록
    const { data, error } = await supabase
        .from('events') // 'events' 테이블에 등록한다고 가정
        .insert([{ 
            name: eventName, 
            start_date: startDate, 
            end_date: endDate,
            description: eventDescription, // 행사 소개글 추가
        }]);

    if (error) {
        alert('행사 등록 실패: ' + error.message);
    } else {
        alert('행사가 등록되었습니다!');
        document.getElementById('eventForm').reset();
    }
}

// 이벤트 핸들러 등록
document.getElementById('eventForm').onsubmit = async function(event) {
    event.preventDefault(); // 기본 폼 제출 방지
    await registerEvent(); // 행사 등록 함수 호출
};
