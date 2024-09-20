import supabase from './shopRegister.js'; // 경로가 올바른지 확인

document.addEventListener('DOMContentLoaded', function () {
    // 지도 생성
    var mapContainer = document.getElementById('map');
    var mapOption = {
        center: new kakao.maps.LatLng(37.5665, 126.978), // 기본 위치 (서울)
        level: 1 // 초기 확대 수준
    };

    var map = new kakao.maps.Map(mapContainer, mapOption);
    var userMarker; // 사용자 마커
    var storeMarkers = []; // 가게 마커를 저장할 배열
    var infoWindow = new kakao.maps.InfoWindow({ zIndex: 1 }); // 인포윈도우 생성

    // 현재 위치 가져오기 및 마커 표시
    function getCurrentLocation() {
        navigator.geolocation.getCurrentPosition(function (position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            var locPosition = new kakao.maps.LatLng(lat, lon);

            // 현재 위치 마커 생성
            userMarker = new kakao.maps.Marker({
                position: locPosition,
                draggable: true // 드래그 가능하도록 설정
            });
            userMarker.setMap(map);

            // 지도 중심을 현재 위치로 이동
            map.setCenter(locPosition);
        }, function (error) {
            console.error('위치 정보를 가져오는 데 실패했습니다.', error);
        });
    }

    // 주변 가게 정보 가져오기
    async function fetchNearbyStores(lat, lon) {
        const { data, error } = await supabase
            .from('store') // 테이블 이름
            .select('*');

        if (error) {
            console.error('가게 정보를 가져오는 중 오류 발생:', error);
            return;
        }

        // 사용자가 설정한 반경 (콤보 박스에서 선택한 값)
        const selectedRange = parseInt(document.getElementById('rangeSelect').value);

        // 체크된 카테고리 가져오기
        const selectedCategories = Array.from(document.querySelectorAll('.categoryCheckbox:checked')).map(checkbox => checkbox.value);

        // 기존 마커 제거
        storeMarkers.forEach(marker => marker.setMap(null));
        storeMarkers = []; // 마커 배열 초기화

        data.forEach(store => {
            const storeLat = store.position.lat;
            const storeLon = store.position.lon;
            const distance = calculateDistance(lat, lon, storeLat, storeLon);

            // 선택된 카테고리에 해당하는 가게만 표시
            if (distance <= selectedRange && (selectedCategories.length === 0 || selectedCategories.includes(store.category))) {
                const storePosition = new kakao.maps.LatLng(storeLat, storeLon);
                const storeMarker = new kakao.maps.Marker({
                    position: storePosition,
                    map: map,
                    clickable: true,
                    className: 'store-marker' // 마커에 클래스 이름 추가
                });

                // 마커 클릭 시 인포윈도우에 가게 이름과 소개글 표시
                kakao.maps.event.addListener(storeMarker, 'click', async function () {
                    const phoneNumber = store.phone_number; // 전화번호 가져오기
                    const eventInfo = await fetchEventByPhoneNumber(phoneNumber); // 전화번호로 행사 정보 가져오기

                    // 행사 정보 표시
                    displayEventInfo(eventInfo);

                    // 인포윈도우 내용 설정
                    const content = `
                        <div style="position: relative; padding: 10px;">
                            <strong>${store.store_name}</strong><br>
                            <p>${store.introduction}</p>
                            <button id="closeInfoWindow" style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; border-radius: 5px; cursor: pointer;">X</button> <!-- 닫기 버튼 스타일링 -->
                        </div>
                    `;

                    infoWindow.setContent(content); // 인포윈도우에 내용 설정
                    infoWindow.setPosition(storePosition); // 인포윈도우 위치 설정
                    infoWindow.setMap(map); // 인포윈도우 맵에 추가

                    // 닫기 버튼 클릭 이벤트 리스너 추가
                    document.getElementById('closeInfoWindow').addEventListener('click', function () {
                        infoWindow.setMap(null); // 인포윈도우 닫기
                    });
                });

                // 마커를 배열에 추가
                storeMarkers.push(storeMarker);
            }
        });

        // 사용자 위치 마커를 기준으로 지도 중심 이동
        map.setCenter(userMarker.getPosition());
    }

    // 두 지점 간의 거리 계산 (단위: km)
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const toRad = (value) => (value * Math.PI) / 180;
        const R = 6371; // 지구 반지름 (km)
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // 거리 반환
    }

    // 전화번호로 행사 정보를 가져오는 함수
    async function fetchEventByPhoneNumber(phoneNumber) {
        const { data, error } = await supabase
            .from('events') // 'events' 테이블에서 조회
            .select('*')
            .eq('phone_number', phoneNumber) // 전화번호로 조회
            .single();

        if (error) {
            console.error('행사 정보를 가져오는 중 오류 발생:', error);
            return null;
        }

        return data; // 행사 정보 반환
    }

    // 행사 정보를 div에 표시하는 함수
    function displayEventInfo(eventInfo) {
        const eventInfoDiv = document.getElementById('eventInfo'); // 행사 정보 표시할 div
        if (eventInfo) {
            eventInfoDiv.innerHTML = `
                <strong>행사 이름:</strong> ${eventInfo.name}<br>
                <strong>시작일:</strong> ${eventInfo.start_date}<br>
                <strong>종료일:</strong> ${eventInfo.end_date}<br>
                <strong>내용:</strong> ${eventInfo.description}
            `;
        } else {
            eventInfoDiv.innerHTML = '행사 정보가 없습니다.';
        }
    }


    // 주변 가게 찾기 버튼 클릭 이벤트
    document.getElementById('findStoresButton').addEventListener('click', function () {
        const locPosition = userMarker.getPosition(); // 사용자 위치 가져오기
        const lat = locPosition.getLat();
        const lon = locPosition.getLng();
        fetchNearbyStores(lat, lon); // 주변 가게 가져오기

        // 지도 레벨을 4로 조정
        map.setLevel(3);
    });

    // 현재


    // 현재 위치 가져오기
    getCurrentLocation();
});
    