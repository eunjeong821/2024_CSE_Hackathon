
// 할인 행사 등록 함수
async function registerEvent() {
    const eventName = document.getElementById('eventName').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const eventDescription = document.getElementById('eventDescription').value; // 행사 소개글 추가

    // 할인 행사 등록
    const { data, error } = await supabase
        .from('events') // 'events' 테이블에 등록한다고 가정
        .insert([{ 
            name: eventName, 
            start_date: startDate, 
            end_date: endDate,
            description: eventDescription // 행사 소개글 추가
        }]);

    if (error) {
        alert('행사 등록 실패: ' + error.message);
    } else {
        alert('행사가 등록되었습니다!');
        document.getElementById('eventForm').reset();
    }
}