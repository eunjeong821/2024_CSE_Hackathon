document.addEventListener('DOMContentLoaded', function () {
    // Supabase 클라이언트 초기화
    const supabaseUrl = 'https://jvntxuwgdzbwskswvigm.supabase.co'; // Supabase URL
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bnR4dXdnZHpid3Nrc3d2aWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3MDg2NTcsImV4cCI6MjA0MjI4NDY1N30.MdhtzFkiIn1_pE9wUBEMHrS_3tOQ_Rh7qpB0ZFjj2Xk'; // Supabase ANON 키
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // 지도 생성
    var mapContainer = document.getElementById('map');
    var mapOption = {
        center: new kakao.maps.LatLng(37.5665, 126.978), // 기본 위치 (서울)
        level: 1 // 확대 수준
    };

    var map = new kakao.maps.Map(mapContainer, mapOption);
    var marker; // 전역 변수로 마커 선언

    function getCurrentLocation() {
        navigator.geolocation.getCurrentPosition(function (position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            var locPosition = new kakao.maps.LatLng(lat, lon);

            // 현재 위치 마커 생성
            marker = new kakao.maps.Marker({
                position: locPosition,
                draggable: true // 드래그 가능하도록 설정
            });
            marker.setMap(map);

            // 지도 중심을 현재 위치로 이동
            map.setCenter(locPosition);
        }, function (error) {
            console.error('위치 정보를 가져오는 데 실패했습니다.', error);
        });
    }

    // 대구의 위도와 경도 범위 설정
    function isInDaegu(lat, lon) {
        const daeguLatRange = [35.8000, 36.0000]; // 대구 위도 범위
        const daeguLonRange = [128.5000, 128.8000]; // 대구 경도 범위

        return (lat >= daeguLatRange[0] && lat <= daeguLatRange[1] &&
            lon >= daeguLonRange[0] && lon <= daeguLonRange[1]);
    }

    // 장소 검색 기능
    document.getElementById('searchButton').addEventListener('click', function () {
        var keyword = document.getElementById('searchInput').value;
        searchPlaces(keyword);
    });

    function searchPlaces(keyword) {
        var ps = new kakao.maps.services.Places(); // 장소 검색 객체 생성

        ps.keywordSearch(keyword, function (data, status, pagination) {
            if (status === kakao.maps.services.Status.OK) {
                displaySearchResults(data);
            } else {
                alert('검색 결과가 없습니다.');
            }
        });
    }

    // 검색 결과 표시
    function displaySearchResults(places) {
        var resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = ''; // 기존 결과 초기화
        resultsDiv.style.display = 'block'; // 결과 목록 보이기

        places.forEach(function (place) {
            var item = document.createElement('div');
            item.className = 'result-item';
            item.innerText = place.place_name;
            item.onclick = function () {
                var locPosition = new kakao.maps.LatLng(place.y, place.x);
                marker.setPosition(locPosition); // 마커 위치 변경
                map.setCenter(locPosition); // 지도 중심 변경
                resultsDiv.style.display = 'none'; // 결과 목록 숨기기
            };
            resultsDiv.appendChild(item);
        });
    }

    // 마커 위치와 추가 정보를 DB에 저장
    async function saveMarkerPosition() {
        if (marker) {
            var position = marker.getPosition();
            var lat = position.getLat();
            var lon = position.getLng();
            var storeName = document.getElementById('storeName').value; // 가게 이름
            var introduction = document.getElementById('description').value; // 소개글
            var category = document.getElementById('category').value; // 카테고리

            // 현재 위치가 대구인지 확인
            if (isInDaegu(lat, lon)) {
                // JSON 형식으로 데이터 준비

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
                const { data, error } = await supabase
                    .from('store')
                    .insert([{
                        store_name: storeName,
                        introduction: introduction,
                        category: category,
                        position: {
                            lat: lat,
                            lon: lon
                        },
                        phone_number: user.phone_number // 전화번호 추가
                    }]);
                if (error) {
                    console.error('데이터 저장 실패:', error);
                } else {
                    alert('추가되었습니다.'); // 추가 성공 시 팝업 메시지
                }
            } else {
                alert('대구에 있는 가게를 등록해주세요.'); // 대구가 아닐 경우 팝업 메시지
            }
        }
    }

    // 현재 위치 가져오기
    getCurrentLocation();

    // 추가하기 버튼 클릭 이벤트 리스너 추가
    document.getElementById('addButton').addEventListener('click', saveMarkerPosition);
});
