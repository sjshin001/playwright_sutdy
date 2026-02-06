import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class OrderListPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * 주문 리스트 페이지로 이동
   */
  async goto(): Promise<void> {
    console.log('🔍 주문 리스트 페이지로 이동...');
    await this.page.goto('https://www.kurly.com/mypage/order');
    await this.page.waitForLoadState('domcontentloaded');
    await this.handleTemporaryErrorAlert();
    console.log('✅ 주문 리스트 페이지 URL:', await this.getCurrentURL());
  }

  /**
   * 가장 최근 주문 링크 클릭
   */
  async clickRecentOrderLink(): Promise<void> {
    console.log('🔍 가장 최근 주문 링크 클릭...');
    // 주문 상세 페이지 링크는 /mypage/order/ 경로를 포함 (URL 패턴 기반 선택)
    const recentOrderLink = this.page.locator('a[href^="/mypage/order/"]').first();
    await recentOrderLink.waitFor({ state: 'visible', timeout: 10000 });
    const href = await recentOrderLink.getAttribute('href');
    console.log(`📋 주문 링크: ${href}`);
    await recentOrderLink.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.handleTemporaryErrorAlert();
    console.log('✅ 주문 상세 페이지로 이동 완료');
  }

  /**
   * 특정 주문번호의 주문 링크 클릭
   */
  async clickOrderLinkByNumber(orderNumber: string): Promise<void> {
    console.log(`🔍 주문번호 ${orderNumber} 링크 클릭...`);
    const orderLink = this.page.locator(`a[href*="${orderNumber}"]`);
    await orderLink.waitFor({ state: 'visible', timeout: 10000 });
    await orderLink.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.handleTemporaryErrorAlert();
    console.log('✅ 주문 상세 페이지로 이동 완료');
  }

  /**
   * 주문 목록이 비어있는지 확인
   */
  async isOrderListEmpty(): Promise<boolean> {
    const emptyText = this.page.getByText('주문 내역이 없습니다');
    const isEmpty = await emptyText.isVisible().catch(() => false);
    console.log(`📋 주문 목록 상태: ${isEmpty ? '비어있음' : '주문 있음'}`);
    return isEmpty;
  }

  /**
   * 주문 목록 개수 확인
   */
  async getOrderCount(): Promise<number> {
    const orderItems = this.page.locator('a[href^="/mypage/order/"]');
    const count = await orderItems.count();
    console.log(`📋 주문 목록 개수: ${count}개`);
    return count;
  }
}
