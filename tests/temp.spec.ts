import { test, expect, chromium } from '@playwright/test';

test('결제 수단 라디오 버튼 찾기', async () => {
  // 크롬 브라우저 실행
  const browser = await chromium.launch({
    headless: false, // 브라우저 UI 표시
    slowMo: 500, // 동작 느리게 (디버깅용)
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // 컬리 로그인 페이지로 이동 (필요시 URL 변경)
  await page.goto('https://www.kurly.com/member/login');
  await page.waitForLoadState('domcontentloaded');

  // 로그인 (환경변수 또는 직접 입력)
  const testId = process.env.TEST_ID || '';
  const testPassword = process.env.TEST_PASSWORD || '';

  if (testId && testPassword) {
    await page.getByPlaceholder('아이디를 입력해주세요').fill(testId);
    await page.getByPlaceholder('비밀번호를 입력해주세요').fill(testPassword);
    await page.getByRole('button', { name: '로그인' }).click();
    await page.waitForTimeout(3000);
  }

  // 장바구니 페이지로 이동
  await page.goto('https://www.kurly.com/cart');
  await page.waitForTimeout(2000);

  // 주문하기 버튼 클릭 (장바구니에 상품이 있는 경우)
  const orderButton = page.getByRole('button', { name: '주문하기' });
  if (await orderButton.isVisible()) {
    await orderButton.click();
    await page.waitForTimeout(3000);
  }

  // 결제 수단 라디오 버튼 찾기
  console.log('='.repeat(50));
  console.log('결제 수단 라디오 버튼 탐색 시작');
  console.log('='.repeat(50));

  // 방법 1: getByRole로 찾기
  const radioButtons = page.getByRole('radio');
  const count = await radioButtons.count();
  console.log(`\n[getByRole] 라디오 버튼 개수: ${count}개`);

  for (let i = 0; i < count; i++) {
    const radio = radioButtons.nth(i);
    const name = await radio.getAttribute('name');
    const value = await radio.getAttribute('value');
    const checked = await radio.isChecked();
    console.log(`  ${i + 1}. name="${name}", value="${value}", checked=${checked}`);
  }

  // 방법 2: name 속성으로 찾기
  const paymentRadios = page.locator('input[name="payment-method"]');
  const paymentCount = await paymentRadios.count();
  console.log(`\n[name="payment-method"] 라디오 버튼 개수: ${paymentCount}개`);

  for (let i = 0; i < paymentCount; i++) {
    const radio = paymentRadios.nth(i);
    const value = await radio.getAttribute('value');
    const className = await radio.getAttribute('class');
    const isVisible = await radio.isVisible();
    console.log(`  ${i + 1}. value="${value}", class="${className}", visible=${isVisible}`);
  }

  // 방법 3: 신용카드 라디오 버튼 직접 찾기
  console.log('\n[신용카드 라디오 버튼 찾기]');
  const creditCardRadio = page.locator('input[name="payment-method"][value="creditcard"]');
  const exists = await creditCardRadio.count() > 0;
  console.log(`  존재 여부: ${exists}`);

  if (exists) {
    const isVisible = await creditCardRadio.isVisible().catch(() => false);
    const isChecked = await creditCardRadio.isChecked().catch(() => false);
    console.log(`  visible: ${isVisible}, checked: ${isChecked}`);

    // 클릭 시도
    if (isVisible) {
      await creditCardRadio.click();
      console.log('  신용카드 라디오 버튼 클릭 완료');
    }
  }

  // 방법 4: getByLabel로 찾기 (라벨이 있는 경우)
  console.log('\n[getByLabel 시도]');
  const labelTexts = ['신용카드', '카드', '신용/체크카드'];
  for (const labelText of labelTexts) {
    const radio = page.getByLabel(labelText);
    const count = await radio.count();
    if (count > 0) {
      console.log(`  "${labelText}" 라벨로 찾음: ${count}개`);
    }
  }

  // 방법 5: 부모 요소에서 텍스트로 찾기
  console.log('\n[텍스트로 라벨/컨테이너 찾기]');
  const creditCardLabel = page.getByText('신용카드');
  const labelCount = await creditCardLabel.count();
  console.log(`  "신용카드" 텍스트 요소: ${labelCount}개`);

  console.log('\n' + '='.repeat(50));
  console.log('탐색 완료 - 브라우저를 닫으려면 아무 키나 누르세요');
  console.log('='.repeat(50));

  // 브라우저 유지 (디버깅용)
  await page.waitForTimeout(30000);

  await browser.close();
});
