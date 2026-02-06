import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { kurlyConfig } from '../config/kurly.config';
import { enterPinByOcrInFrame } from '../utils/enterPinByOcr';
import { clickDigitsOnKeyboard } from '../utils/ocr';

export enum PaymentMethod {
  KURLY_PAY_CASH = 'kurlypay-cash',
  KURLY_PAY = 'kurlypay',
  NAVER_PAY = 'naver-pay',
  CREDIT_CARD = 'creditcard',
}

export class OrderPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async isOnCheckoutPage(): Promise<boolean> {
    const currentURL = await this.getCurrentURL();
    const isCheckoutPage = currentURL.includes('/order') || currentURL.includes('/payment');
    console.log(`💳 결제 페이지 여부: ${isCheckoutPage}`);
    return isCheckoutPage;
  }

  async completePayment(kurlyPayPassword?: string): Promise<void> {
    try {
      console.log('💳 결제 프로세스 시작...결제수단 선택');
      // 결제수단 선택
      // await this.selectPaymentMethod(PaymentMethod.KURLY_PAY);
      await this.selectPaymentMethod(PaymentMethod.CREDIT_CARD);

      console.log('💳 [1단계] 주문 페이지 결제하기 버튼 클릭...');

      // 결제하기 버튼 찾기 (결제하기 > 결제 순으로 시도)
      let button = this.page.getByRole('button', { name: '결제하기' }).last();
      let isVisible = await button.isVisible().catch(() => false);

      if (!isVisible) {
        button = this.page.getByRole('button', { name: '결제' }).last();
        isVisible = await button.isVisible().catch(() => false);
      }

      if (isVisible) {
        await button.click();
        console.log('✅ [1단계] 결제하기 버튼 클릭 완료');
      } else {
        throw new Error('결제하기 버튼을 찾을 수 없습니다.');
      }

      await this.wait(2000);

      console.log('💳 [2단계] 샛별배송 알림 팝업 확인...');
      await this.handleFreshDeliveryPopup();

      await this.wait(2000);

      console.log('💳 [3단계] 컬리페이 비밀번호 확인...');
      const password = kurlyPayPassword || kurlyConfig.testData.kurlyPayPassword;
      // if (PaymentMethod.KURLY_PAY) {
      //   await this.enterKurlyPayPassword(password);
      // }
      
      // if (PaymentMethod.CREDIT_CARD) {
        console.log('💳 [3-1단계] 페이코 결제 진행...');
        await this.payPayco();
      // }

      console.log('✅ 결제 프로세스 완료');
    } catch (error) {
      console.error('❌ 결제 중 에러:', error);
      await this.page.screenshot({ path: 'screenshots/payment-error.png' });
      throw error;
    }
  }

  async handleFreshDeliveryPopup(): Promise<void> {
    try {
      console.log('🔍 샛별배송 알림 팝업 확인 중...');

      const freshDeliveryText = this.page.locator('#swal2-content').getByText('샛별배송');
      const hasPopup = await freshDeliveryText.isVisible().catch(() => false);

      if (!hasPopup) {
        console.log('ℹ️ 샛별배송 알림 팝업 없음');
        return;
      }

      console.log('✅ 샛별배송 알림 팝업 발견!');

      // 팝업 내 결제하기 버튼 클릭
      const confirmButton = this.page.getByRole('button', { name: '결제하기' }).first();
      await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
      await confirmButton.click();

      console.log('✅ 샛별배송 팝업 "결제하기" 버튼 클릭 완료');
      await this.wait(2000);
    } catch (error) {
      console.log('⚠️ 샛별배송 팝업 처리 중 에러:', error);
      await this.page.screenshot({
        path: 'screenshots/fresh-delivery-error.png',
        fullPage: true,
      });
    }
  }

  async selectPaymentMethod(method: PaymentMethod): Promise<void> {
    console.log(`💳 결제수단 선택: ${method}`);

    // 결제수단 라디오 버튼의 부모 label 클릭
    const radioLabel = this.page.locator(`input[name="payment-method"][value="${method}"]`).locator('..');
    await radioLabel.scrollIntoViewIfNeeded();
    await this.wait(1000);
    await radioLabel.click();

    if (method === PaymentMethod.KURLY_PAY) {
      // 컬리페이 선택 시 카드 선택
      await this.selectKurlyPayCard('삼성카드'); // 추후 다른 카드가 있는 경우 개선.
    }

    if (method === PaymentMethod.CREDIT_CARD) {
      // 컬리페이 선택 시 카드 선택
      await this.selectPayco('페이코'); // 추후 다른 카드가 있는 경우 개선.
    }

    console.log(`✅ 결제수단 선택 완료: ${method}`);
  }

  async selectKurlyPayCard(cardName: string): Promise<void> {
    console.log(`💳 컬리페이 카드 선택: ${cardName}`);

    // swiper-slide 내에서 카드 위치 찾기 (img alt 속성으로 검색)
    const slides = this.page.locator('.swiper-slide');
    const slideCount = await slides.count();
    console.log(`[Swiper] 총 ${slideCount}개 슬라이드 발견`);

    let cardIndex = -1;
    for (let i = 0; i < slideCount; i++) {
      const cardImg = slides.nth(i).locator(`img[alt="${cardName}"]`);
      const hasCard = await cardImg.count() > 0;
      if (hasCard) {
        cardIndex = i;
        console.log(`[Swiper] ${cardName} 발견: ${i}번째 슬라이드`);
        break;
      }
    }

    if (cardIndex === -1) {
      throw new Error(`${cardName}를 찾을 수 없습니다.`);
    }

    // cardIndex 만큼 next 버튼 클릭
    const clickCount = cardIndex;
    if (clickCount > 0) {
      const nextButton = this.page.locator('button[data-testid="next-arrow"]');

      for (let i = 0; i < clickCount; i++) {
        await nextButton.click();
        console.log(`[Swiper] next 버튼 클릭 (${i + 1}/${clickCount})`);
        await this.wait(500);
      }
    }

    console.log(`✅ ${cardName} 선택 완료`);
  }

  // 간편결제 > 페이코 선택
  async selectPayco(cardName: string): Promise<void> {
    console.log('💳 간편결제 - 페이코 선택');
    await this.page.getByRole('button', { name: '간편결제' }).click();
    await this.page.locator('label').filter({ hasText: '페이코' }).click();
  }

  // 페이코로 결제하기
  async payPayco(): Promise<void> {
    console.log('💳 페이코 결제 진행...');
    await this.wait(1000) // 페이지 로딩 대기
    await this.page.getByRole('textbox', { name: '이메일 또는 휴대폰 아이디' }).click();
    await this.page.getByRole('textbox', { name: '이메일 또는 휴대폰 아이디' }).fill('01088454481');
    await this.page.getByRole('textbox', { name: '비밀번호' }).click();
    await this.page.getByRole('button', { name: '로그인', exact: true }).click();
    await this.page.getByRole('textbox', { name: '비밀번호' }).fill('tjswn890iop!');
    await this.page.getByRole('button', { name: '로그인', exact: true }).click();
    await this.wait(1000) // 페이지 로딩 대기
    await this.page.getByRole('spinbutton', { name: '생년월일' }).click();
    await this.page.getByRole('spinbutton', { name: '생년월일' }).fill('19840603');
    await this.page.getByRole('button', { name: '확인' }).click();
    await this.page.getByRole('link', { name: '다음' }).click();
    await this.page.getByRole('link', { name: '다음' }).click();
    await this.page.getByRole('link', { name: '다음' }).click();
    await this.page.getByRole('link', { name: '다음' }).click();
    await this.page.getByRole('link', { name: '결제' }).click();
    // 페이코 키패드 iframe 로딩 대기
    await this.wait(2000);

    // 방법 1: clickDigitsOnKeyboard (버튼별 개별 OCR - 권장) ✅
    await clickDigitsOnKeyboard(
      this.page,
      kurlyConfig.testData.paycoPin,
      '.key_area a',
      'iframe#lazyModalDialogIframe'
    );

    // 방법 2: enterPinByOcrInFrame (전체 이미지 OCR + 좌표 클릭) - 인식률 낮음
    // await enterPinByOcrInFrame(
    //   this.page,
    //   'iframe#lazyModalDialogIframe',
    //   '.key_area',
    //   kurlyConfig.testData.paycoPin,
    //   { delay: 500, threshold: 150, retryCount: 5 }
    // );

    console.log('✅ 페이코 비밀번호 입력 완료');
  }

  async enterKurlyPayPassword(password: string): Promise<void> {
    try {
      console.log('🔐 컬리페이 비밀번호 입력 시작...');

      const frames = this.page.frames();
      console.log(`[Frame 탐색] 총 ${frames.length}개 frame 발견`);

      const targetFrame = frames.find((f) => f.url().includes('qpay-api.kcp.co.kr'));

      if (!targetFrame) {
        throw new Error('컬리페이 결제 프레임을 찾을 수 없습니다.');
      }

      console.log('[타겟 Frame] 발견:', targetFrame.url());

      const frameElement = await targetFrame.frameElement();
      if (frameElement) {
        await frameElement.click();
        console.log('[타겟 Frame] 프레임 클릭 완료');
        await this.wait(3000);
      }

      const kpdButtons = await targetFrame.$$('img.kpd-data');
      console.log(`[키패드 버튼 확인] img.kpd-data 버튼 ${kpdButtons.length}개 발견`);

      // 디버깅용 출력: 각 버튼의 aria-label과 가시성 상태
      for (let i = 0; i < Math.min(kpdButtons.length, 12); i++) {
        const ariaLabel = await kpdButtons[i].getAttribute('aria-label');
        const isVisible = await kpdButtons[i].isVisible();
        console.log(`  버튼 ${i}: aria-label="${ariaLabel}", 보임=${isVisible}`);
      }

      const kurlyPayPassword = password || kurlyConfig.testData.kurlyPayPassword;
      if (kurlyPayPassword) {
        console.log(`[비밀번호 입력] ${kurlyPayPassword.length}자리 비밀번호 입력 시작`);

        for (let i = 0; i < kurlyPayPassword.length; i++) {
          const digit = kurlyPayPassword[i];
          const button = await targetFrame.$(`img.kpd-data[aria-label="${digit}"]`);

          if (button) {
            await button.click();
            console.log(`  숫자 "${digit}" 클릭 완료`);
            
          } else {
            console.log(`  ⚠️ 숫자 "${digit}" 버튼을 찾을 수 없습니다.`);
          }
          await this.wait(500);
        }

        console.log('[비밀번호 입력] 완료');
      }

    } catch (error) {
      console.error('❌ 컬리페이 비밀번호 입력 중 에러:', error);
      throw error;
    }
  }

  
  /**
   * 주문완료 페이지에서 주문번호 확인 및 반환
   */
  async getOrderNumber(): Promise<string> {
    console.log('🔍 주문완료 페이지 주문번호 확인...');

    // 주문완료 메시지 확인
    const completeMessage = this.page.getByText('주문을 완료했어요');
    await completeMessage.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ 주문완료 페이지 확인');

    // 주문번호 추출: <span>주문번호</span><span>2403501180045</span>
    const orderNumberSpan = this.page.getByText('주문번호').locator('+ span');
    const orderNumber = await orderNumberSpan.textContent();

    if (!orderNumber) {
      throw new Error('주문번호를 찾을 수 없습니다.');
    }

    console.log(`✅ 주문번호: ${orderNumber}`);
    return orderNumber;
  }

  /**
   * [주문 상세보기] 버튼 클릭
   */
  async clickOrderDetailButton(): Promise<void> {
    console.log('🔍 [주문 상세보기] 버튼 클릭...');
    const detailButton = this.page.getByRole('button', { name: '주문 상세보기' });
    await detailButton.waitFor({ state: 'visible', timeout: 10000 });
    await detailButton.click();
    console.log('✅ [주문 상세보기] 버튼 클릭 완료');

    // 페이지 이동 대기
    await this.wait(2000);
    console.log('✅ 주문 상세 페이지 이동 완료, URL:', await this.getCurrentURL());
  }

  /**
   * 주문완료 확인 및 상세보기 이동 (주문번호 반환)
   */
  async verifyOrderComplete(): Promise<string> {
    console.log('📦 === 주문완료 확인 프로세스 시작 ===');

    // 1. 주문번호 확인 및 출력
    const orderNumber = await this.getOrderNumber();

    // 2. [주문 상세보기] 버튼 클릭
    await this.clickOrderDetailButton();

    console.log('✅ === 주문완료 확인 프로세스 완료 ===');
    return orderNumber;
  }
}
