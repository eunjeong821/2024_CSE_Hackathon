import supabase from './shopRegister.js'; // 경로가 올바른지 확인
const  userId= '8c505c10-a684-4de9-9b80-c4344612ab49'; // 로그인한 사용자 ID로 대체


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

    // 행사 정보 표시할 div
    const eventInfoDiv = document.getElementById('eventInfo');
    const couponInfoDiv = document.getElementById('couponInfo'); // 쿠폰 정보 표시할 div

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
                    const coupons = await fetchCouponsByPhoneNumber(phoneNumber); // 쿠폰 정보 가져오기

                    const content = `
                        <div style="padding:10px;">
                            <strong>${store.store_name}</strong><br>
                            ${store.introduction}<br>
                            <button id="closeInfoWindow">닫기</button>
                        </div>
                    `;
                    infoWindow.setContent(content);
                    infoWindow.setPosition(storePosition);
                    infoWindow.setMap(map);

                    // 닫기 버튼 클릭 이벤트 리스너 추가
                    document.getElementById('closeInfoWindow').addEventListener('click', function () {
                        infoWindow.setMap(null); // 인포윈도우 닫기
                        eventInfoDiv.innerHTML = ''; // 행사 정보 초기화
                        couponInfoDiv.innerHTML = ''; // 쿠폰 정보 초기화
                    });

                    // 행사 정보 표시
                    displayEventInfo(eventInfo);

                    // 쿠폰 정보 표시
                    displayCouponInfo(coupons);
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

    // 전화번호로 쿠폰 정보를 가져오는 함수
    async function fetchCouponsByPhoneNumber(phoneNumber) {
        const { data, error } = await supabase
            .from('coupons') // 'coupons' 테이블에서 조회
            .select('*')
            .eq('phone_number', phoneNumber); // 전화번호로 조회

        if (error) {
            console.error('쿠폰 정보를 가져오는 중 오류 발생:', error);
            return [];
        }

        return data; // 쿠폰 정보 반환
    }

    // 사용자 전화번호 가져오기
    const getUserPhoneNumber = async () => {
        const { data, error } = await supabase
            .from('users') // 'users' 테이블에서 조회
            .select('phone_number') // 전화번호만 선택
            .eq('id', userId) // 사용자 ID로 조회
            .single();

        if (error) {
            console.error('사용자 전화번호 조회 실패:', error);
            return null;
        }
        return data.phone_number; // 전화번호 반환
    };

    // 행사 정보를 div에 표시하는 함수
    function displayEventInfo(eventInfo) {
        if (eventInfo) {
            eventInfoDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9;">
                    <div>
                        <strong>행사 이름:</strong> ${eventInfo.name}<br>
                        <strong>시작일:</strong> ${eventInfo.start_date}<br>
                        <strong>종료일:</strong> ${eventInfo.end_date}<br>
                        <strong>내용:</strong> ${eventInfo.description}
                    </div>
                    <button id="likeButton" style="margin-left: 10px;">찜하기</button>
                </div>
            `;

            document.getElementById('likeButton').addEventListener('click', async function() {
                const currentUserId = userId; // 현재 로그인한 사용자 ID로 변경 필요
                const eventId = eventInfo.id; // 행사 ID


                // 이미 찜한 행사인지 확인
                const { data: existingLikes, error: likeCheckError } = await supabase
                    .from('user_likes')
                    .select('*')
                    .eq('user_id', currentUserId)
                    .eq('event_id', eventId)
                    .single();

                if (likeCheckError) {
                    console.error('찜하기 확인 오류:', likeCheckError);
                    alert('찜하기에 실패했습니다. 다시 시도해주세요.');
                    return;
                }

                if (existingLikes) {
                    alert('이미 행사를 찜했습니다.');
                    return;
                }

                const { data, error } = await supabase
                    .from('user_likes')
                    .insert([{ user_id: currentUserId, event_id: eventId }]);

                if (error) {
                    console.error('찜하기 실패:', error);
                    alert('찜하기에 실패했습니다. 다시 시도해주세요.');
                } else {
                    alert(`${eventInfo.name}이(가) 찜되었습니다!`);
                }
            });
        } else {
            eventInfoDiv.innerHTML = `
                <div style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9;">
                    행사 정보가 없습니다.
                </div>
            `;
        }
    }

    // 쿠폰 정보를 div에 표시하는 함수
    function displayCouponInfo(coupons) {
        if (coupons.length > 0) {
            couponInfoDiv.innerHTML = `
                <div style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9;">
                    <strong>쿠폰 목록:</strong><br>
                    <ul>
                        ${coupons.map(coupon => `
                            <li style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${coupon.name}</strong><br>
                                    조건: ${coupon.conditions}<br>
                                    할인율: ${coupon.discount}%
                                </div>
                                <button class="issue-coupon" data-coupon-id="${coupon.id}" style="margin-left: 10px;">발급하기</button>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;

            // 쿠폰 발급 버튼 클릭 이벤트 리스너 추가
            document.querySelectorAll('.issue-coupon').forEach(button => {
                button.addEventListener('click', async function () {
                    const couponId = this.getAttribute('data-coupon-id');
                    const phoneNumber = await getUserPhoneNumber(); // 사용자 전화번호 가져오기

                     // 동일한 쿠폰이 이미 발급된 경우 확인
                        const { data: existingCoupon, error: couponCheckError } = await supabase
                        .from('user_coupon')
                        .select('*')
                        .eq('phone_number', phoneNumber)
                        .eq('code', couponId)
                        .single();

                        if (couponCheckError && couponCheckError.code !== 'PGRST116') {
                        console.error('쿠폰 발급 확인 오류:', couponCheckError);
                        alert('쿠폰 발급에 실패했습니다. 다시 시도해주세요.');
                        return;
                    }

                    if (existingCoupon) {
                        alert('이미 발급된 쿠폰입니다.');
                        return;
                    }


                    if (phoneNumber) {
                        const { error: userCouponError } = await supabase
                            .from('user_coupon')
                            .insert([
                                { 
                                    code: couponId,  // 쿠폰 ID를 코드로 사용
                                    phone_number: phoneNumber,
                                    used: false // 기본적으로 사용되지 않음
                                }
                            ]);

                        if (userCouponError) {
                            console.error('쿠폰 발급 실패:', userCouponError);
                            alert('쿠폰 발급에 실패했습니다. 다시 시도해주세요.');
                        } else {
                            alert('쿠폰이 발급되었습니다!');
                        }
                    } else {
                        alert('전화번호를 가져오는 데 실패했습니다.');
                    }
                });
            });
        } else {
            couponInfoDiv.innerHTML = `
                <div style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9;">
                    쿠폰 정보가 없습니다.
                </div>
            `;
        }
    }

    // 주변 가게 찾기 버튼 클릭 이벤트
    document.getElementById('findStoresButton').addEventListener('click', function () {
        const locPosition = userMarker.getPosition(); // 사용자 위치 가져오기
        const lat = locPosition.getLat();
        const lon = locPosition.getLng();
        fetchNearbyStores(lat, lon); // 주변 가게 가져오기

        // 선택된 범위에 따라 지도 레벨 설정
        const selectedRange = parseInt(document.getElementById('rangeSelect').value);
        let mapLevel;

        // 지도 레벨 설정
        if (selectedRange === 1) {
            mapLevel = 3;
        } else if (selectedRange === 5) {
            mapLevel = 5;
        } else if (selectedRange === 10) {
            mapLevel = 7;
        }

        map.setLevel(mapLevel); // 지도 레벨 설정
    });

    // 지도 클릭 시 인포윈도우 닫기     
    kakao.maps.event.addListener(map, 'click', function () {
        infoWindow.setMap(null); // 인포윈도우 닫기
        eventInfoDiv.innerHTML = ''; // 행사 정보 초기화
        couponInfoDiv.innerHTML = ''; // 쿠폰 정보 초기화
    });

    // 현재 위치 가져오기
    getCurrentLocation();
});
