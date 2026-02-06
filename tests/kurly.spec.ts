import { test, expect } from './kurlyTest';
import { kurlyConfig } from '../config/kurly.config';

test.describe('컬리 UI 테스트', () => {
  test.beforeEach(async ({ kurlyPage }) => {
    // 각 테스트 전에 홈페이지로 이동
    await kurlyPage.gotoHomePage();
  });

  test('메인 페이지 로드 확인', async ({ kurlyPage }) => {
    // 홈페이지 URL 확인
    const currentURL = await kurlyPage.getCurrentURL();
    expect(currentURL).toContain('kurly.com');
  });

  test('로그인 기능 테스트', async ({ kurlyPage }) => {
    console.log('=== 로그인 테스트 시작 ===');
    
    // 테스트 시작 전 URL
    const startURL = await kurlyPage.getCurrentURL();
    console.log('테스트 시작 URL:', startURL);
    
    await kurlyPage.login(
      kurlyConfig.testData.validId,
      kurlyConfig.testData.validPassword
    );
    
    // 로그인 성공 확인
    const isLoggedIn = await kurlyPage.isLoggedIn();
    console.log('로그인 상태:', isLoggedIn ? '성공 ✅' : '실패 ❌');
    
    // 최종 URL 확인
    const finalURL = await kurlyPage.getCurrentURL();
    console.log('최종 페이지 URL:', finalURL);
    
    expect(isLoggedIn).toBeTruthy();
    
    console.log('=== 로그인 테스트 완료 ===');
  });

  test('장바구니 결제 테스트', async ({ kurlyPage }) => {
    // 1. 로그인
    await kurlyPage.login(
      kurlyConfig.testData.validId,
      kurlyConfig.testData.validPassword
    );
    
    // // 2. 상품 검색
    // await kurlyPage.searchProduct('사과');
    
    // // 3. 첫 번째 상품 클릭
    // await kurlyPage.clickFirstProduct();
    
    // // 4. 장바구니 담기
    // await kurlyPage.addToCart();
    
    // // 5. 장바구니로 이동
    await kurlyPage.gotoCart();
    
    // 6. 주문하기 페이지로 이동
    await kurlyPage.proceedToCheckout();
    
    // 7. 결제 페이지 확인
    const isCheckoutPage = await kurlyPage.isOnCheckoutPage();
    expect(isCheckoutPage).toBeTruthy();

    // 8. 결제하기 (컬리페이 비밀번호 입력 포함)
    await kurlyPage.completePayment();
  
    // 9. 주문완료 확인 및 주문번호 받기 order_complate.html
    const orderNumber = await kurlyPage.verifyOrderComplete();
    console.log('주문번호:', orderNumber);

    // 10. 주문 상세 페이지 자동 랜더링 후 주문취소
    await kurlyPage.cancelOrderDetail(orderNumber);
    
    console.log('=== 전체 결제 프로세스 테스트 완료 ===');
  });

  test('주문 취소 테스트', async ({ kurlyPage }) => {
    await kurlyPage.login(
      kurlyConfig.testData.validId,
      kurlyConfig.testData.validPassword
    );

    await kurlyPage.cancelOrderList("2403516110117");
  });

});