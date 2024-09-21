import supabase from './shopRegister.js';


// 사용자 ID 가져오기
const getUserId = async () => {
    const token = localStorage.getItem('token'); // JWT 토큰 가져오기
    if (token) {
        const response = await fetch('http://localhost:3000/api/mypage', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // 유효한 JWT 토큰
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('사용자 ID 조회 실패:', errorText);
            return null;
        }

        const user = await response.json();
        return user.id; // 사용자 ID 반환
    } else {
        console.error('사용자가 로그인하지 않았습니다.');
        return null;
    }
};

(async () => {
    const userId = await getUserId(); // 사용자 ID 가져오기

    if (!userId) {
        console.error('사용자 ID를 가져오는 데 실패했습니다.');
        return; // 사용자 ID가 없으면 함수 종료
    }
  // 찜 취소 기능
  window.unlikeEvent = async function (eventId) {
    const { data, error } = await supabase
      .from('user_likes')
      .delete()
      .match({ user_id: userId, event_id: eventId });

    if (error) {
      console.error('Error unliking event:', error);
    } else {
      alert('행사의 찜이 취소되었습니다!');
      displayLikedEvents();
    }
  };

  // 찜 목록 가져오기
  async function fetchLikedEvents() {
    const { data, error } = await supabase
      .from('user_likes')
      .select('event_id, events(name, start_date, end_date, description)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching liked events:', error);
      return [];
    }
    return data;
  }

  // 찜한 행사 목록 표시
  async function displayLikedEvents() {
    const likedEvents = await fetchLikedEvents();
    const likedEventsContainer = document.getElementById(
      'likedEventsContainer'
    );
    likedEventsContainer.innerHTML = '';

    likedEvents.forEach((like) => {
      const eventElement = document.createElement('div');
      eventElement.className = 'event';
      eventElement.innerHTML = `
                <h3>${like.events.name}</h3>
                <p>${like.events.description}</p>
                <p>기간: ${like.events.start_date} ~ ${like.events.end_date}</p>
                <button onclick="unlikeEvent('${like.event_id}')">찜 취소</button>
            `;
      likedEventsContainer.appendChild(eventElement);
    });
  }
  // 행사 상세 정보 표시
  window.displayEventDetails = async function (eventId) {
    if (!eventId) {
      document.getElementById('eventDetailsContainer').innerHTML = '';
      return;
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event details:', error);
      return;
    }

    const eventDetailsContainer = document.getElementById(
      'eventDetailsContainer'
    );
    eventDetailsContainer.innerHTML = `
          <div class="details">
              <h3>${data.name}</h3>
              <p>${data.description}</p>
              <p>기간: ${data.start_date} ~ ${data.end_date}</p>
              <button onclick="unlikeEvent('${eventId}')">찜 취소</button>
          </div>
      `;
  };

  // 초기화 함수
  async function init() {
    await displayLikedEvents(); // 찜한 행사 목록만 표시
  }

  init();
})();
