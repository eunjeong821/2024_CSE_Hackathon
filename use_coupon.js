// 쿠폰 사용 함수
async function useCoupon() {
  const couponCode = prompt("사용할 쿠폰 코드를 입력하세요:");

  if (!couponCode) {
      alert("쿠폰 코드가 입력되지 않았습니다.");
      return;
  }

  // 쿠폰 정보 불러오기
  const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode)
      .single();

  if (error) {
      alert('쿠폰 정보를 불러오는 데 실패했습니다: ' + error.message);
      return;
  }

  if (!data) {
      alert('유효하지 않은 쿠폰 코드입니다.');
      return;
  }

  // 이미 사용한 쿠폰인지 확인
  if (data.used) {
      alert('이미 사용한 쿠폰입니다.');
      return;
  }

  // 쿠폰 정보를 새로운 페이지로 표시
  const couponInfo = `
      <h2>쿠폰 정보</h2>
      <p>쿠폰 코드: ${data.code}</p>
      <p>할인율: ${data.discount}%</p>
      <p>유효기간: ${data.expiration_date}</p>
      <p>사용 조건: ${data.conditions}</p>
  `;

  const newWindow = window.open("", "_blank");
  newWindow.document.write(couponInfo);
  newWindow.document.close();

  // 쿠폰 사용 처리
  await supabase
      .from('coupons')
      .update({ used: true }) // 쿠폰을 사용된 상태로 업데이트
      .eq('code', couponCode);

  alert('쿠폰이 사용되었습니다.');
}