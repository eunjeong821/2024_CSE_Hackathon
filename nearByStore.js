import supabase from './shopRegister.js'; // supabaseClient에서 import

document.addEventListener('DOMContentLoaded', function() {
    // 지도 생성
    var mapContainer = document.getElementById('map');
    var mapOption = {
        center: new kakao.maps.LatLng(37.5665, 126.978), // 기본 위치 (서울)
        level: 1 // 초기 확대 수준
    };

    var map = new kakao.maps.Map(mapContainer, mapOption);
    var userMarker; // 사용자 마커
    var infoWindow = new kakao.maps.InfoWindow({ zIndex: 1 }); // 정보 창
    var storeMarkers = []; // 가게 마커를 저장할 배열

    // 현재 위치 가져오기 및 마커 표시
    function getCurrentLocation() {
        navigator.geolocation.getCurrentPosition(function(position) {
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
        }, function(error) {
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

                // 마커 클릭 시 정보 창 표시
                kakao.maps.event.addListener(storeMarker, 'click', function() {
                    const content = `
                        <div style="padding:5px; width:150px; position: relative;">
                            <strong>${store.store_name}</strong><br>
                            ${store.introduction}<br>
                            <button id="closeButton" style="position: absolute; top: 5px; right: 5px; background: none; border: none; cursor: pointer; color: red;">X</button>
                        </div>
                    `;
                    infoWindow.setContent(content);
                    infoWindow.setPosition(storePosition);
                    infoWindow.setMap(map);

                    // 닫기 버튼 클릭 시 정보 창 닫기
                    document.getElementById('closeButton').onclick = function() {
                        infoWindow.setMap(null); // 정보 창 숨기기
                    };
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

    // 주변 가게 찾기 버튼 클릭 이벤트
    document.getElementById('findStoresButton').addEventListener('click', function() {
        const locPosition = userMarker.getPosition(); // 사용자 위치 가져오기
        const lat = locPosition.getLat();
        const lon = locPosition.getLng();
        fetchNearbyStores(lat, lon); // 주변 가게 가져오기

        // 지도 레벨을 4로 조정
        map.setLevel(3);
    });

    // 현재 위치 가져오기
    getCurrentLocation();
});
