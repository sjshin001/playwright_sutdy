import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class OrderDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * 주문번호로 주문상세 페이지로 직접 이동
   */
  async goto(orderNumber: string): Promise<void> {
    console.log(`🔍 주문상세 페이지로 이동... 주문번호: ${orderNumber}`);
    const orderDetailURL = `https://www.kurly.com/mypage/order/view?order_no=${orderNumber}`;
    await this.page.goto(orderDetailURL);
    await this.page.waitForLoadState('domcontentloaded');
    await this.handleTemporaryErrorAlert();
    console.log('✅ 주문상세 페이지 URL:', await this.getCurrentURL());
  }

  /**
   * [주문 취소] 버튼 클릭
   */
  async clickOrderCancelButton(): Promise<void> {
    console.log('🔍 [주문 취소] 버튼 클릭...');
    await this.handleTemporaryErrorAlert();
    const cancelButton = this.page.getByRole('button', { name: '주문 취소' }).first();
    await cancelButton.waitFor({ state: 'visible', timeout: 10000 });
    await cancelButton.click();
    console.log('✅ [주문 취소] 버튼 클릭 완료');

    // 주문 취소 확인 얼럿에서 [주문 취소] 버튼 클릭 (aria-label="confirm-button")
    console.log('🔍 주문 취소 확인 얼럿 대기...');
    const alertConfirmButton = this.page.getByLabel('confirm-button');
    await alertConfirmButton.waitFor({ state: 'visible', timeout: 10000 });
    await alertConfirmButton.click();
    console.log('✅ 얼럿 [주문 취소] 버튼 클릭 완료');
  }

  /**
   * 주문 상태 텍스트 가져오기
   */
  async getOrderStatus(): Promise<string> {
    const statusElement = this.page.locator('[class*="order-status"], [class*="status"]').first();
    const status = await statusElement.textContent() ?? '알 수 없음';
    console.log(`📋 주문 상태: ${status}`);
    return status;
  }

  /**
   * 주문 금액 가져오기
   */
  async getOrderAmount(): Promise<string> {
    const amountElement = this.page.locator('[class*="total"], [class*="amount"]').first();
    const amount = await amountElement.textContent() ?? '0원';
    console.log(`📋 주문 금액: ${amount}`);
    return amount;
  }

  /**
   * 배송지 정보 가져오기
   */
  async getDeliveryAddress(): Promise<string> {
    const addressElement = this.page.locator('[class*="address"]').first();
    const address = await addressElement.textContent() ?? '주소 정보 없음';
    console.log(`📋 배송지: ${address}`);
    return address;
  }

  /**
   * 주문 취소 가능 여부 확인
   */
  async isCancelButtonVisible(): Promise<boolean> {
    const cancelButton = this.page.getByRole('button', { name: '주문 취소' }).first();
    const isVisible = await cancelButton.isVisible().catch(() => false);
    console.log(`📋 주문 취소 버튼: ${isVisible ? '표시됨' : '표시 안됨'}`);
    return isVisible;
  }
}
