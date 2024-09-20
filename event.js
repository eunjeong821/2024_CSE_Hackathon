
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

exports.handler = async () => {
    const { data, error } = await supabase
        .from('events')
        .delete()
        .lt('end_date', new Date().toISOString().split('T')[0]);
    
    if (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Expired events deleted successfully' }),
    };
};

async function deleteExpiredEvents() {
    const { data, error } = await supabase.rpc('delete_expired_events');
    
    if (error) {
        console.error('Error deleting expired events:', error);
    } else {
        console.log('Expired events deleted successfully:', data);
    }
}

// 함수 호출
deleteExpiredEvents();