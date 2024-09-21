
import supabase from './shopRegister.js';
const  userId= '8c505c10-a684-4de9-9b80-c4344612ab49'; // 로그인한 사용자 ID로 대체

(async () => {
  // 행사 목록 가져오기
  async function fetchEvents() {
      const { data, error } = await supabase
          .from('events')
          .select('*');

      if (error) {
          console.error('Error fetching events:', error);
          return [];
      }
      return data;
  }

  // 찜하기 기능
  window.likeEvent = async function(eventId) {
      const { data, error } = await supabase
          .from('user_likes')
          .insert([{ user_id: userId, event_id: eventId }]);

      if (error) {
          console.error('Error liking event:', error);
      } else {
          alert('행사가 찜되었습니다!');
          displayLikedEvents();
      }
  };

// 찜 취소 기능
  window.unlikeEvent = async function(eventId) {
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

  // 행사 목록 표시
  async function displayEvents() {
      const events = await fetchEvents();
      const eventContainer = document.getElementById('eventContainer');
      eventContainer.innerHTML = '';

      events.forEach(event => {
          const eventElement = document.createElement('div');
          eventElement.className = 'event';
          eventElement.innerHTML = `
              <h3>${event.name}</h3>
              <p>${event.description}</p>
              <p>기간: ${event.start_date} ~ ${event.end_date}</p>
              <button onclick="likeEvent('${event.id}')">찜하기</button>
          `;
          eventContainer.appendChild(eventElement);
      });
  }
// 찜한 행사 목록 표시
async function displayLikedEvents() {
      const likedEvents = await fetchLikedEvents();
      const likedEventsContainer = document.getElementById('likedEventsContainer');
      likedEventsContainer.innerHTML = '';

      likedEvents.forEach(like => {
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
  window.displayEventDetails = async function(eventId) {
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

      const eventDetailsContainer = document.getElementById('eventDetailsContainer');
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
      await displayEvents();
      await displayLikedEvents();
  }

  init();
})();