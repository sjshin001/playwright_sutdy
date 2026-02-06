import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async searchProduct(keyword: string): Promise<void> {
    console.log(`🔍 상품 검색: "${keyword}"`);
    await this.page.getByPlaceholder('검색').fill(keyword);
    await this.page.keyboard.press('Enter');
    await this.wait(2000);
    console.log('✅ 검색 완료, URL:', await this.getCurrentURL());
  }

  async clickFirstProduct(): Promise<void> {
    console.log('🔍 첫 번째 상품 찾는 중...');
    // 상품 카드 링크는 /goods/ 경로를 포함 (URL 패턴 기반 선택)
    const productCard = this.page.locator('a[href*="/goods/"]').first();
    await productCard.waitFor({ state: 'visible', timeout: 10000 });

    const productName = await productCard.textContent();
    console.log('✅ 상품 클릭:', productName);

    await productCard.click();
    await this.wait(2000);
    console.log('✅ 상품 상세 페이지 이동 완료');
  }

  async addToCart(): Promise<void> {
    console.log('🛒 장바구니에 담기...');

    // 장바구니 담기 버튼 찾기 (장바구니 담기 > 담기 순으로 시도)
    let button = this.page.getByRole('button', { name: '담기' }).first();
    let isVisible = await button.isVisible().catch(() => false);

    if (!isVisible) {
      button = this.page.getByRole('button', { name: '장바구니 담기' }).first();
      isVisible = await button.isVisible().catch(() => false);
    }

    if (isVisible) {
      await button.click();
      console.log('✅ 장바구니 담기 버튼 클릭 완료');
      await this.wait(2000);

      const confirmButton = this.page.getByRole('button', { name: '확인' });
      const hasConfirm = await confirmButton.isVisible().catch(() => false);
      if (hasConfirm) {
        await confirmButton.click();
        console.log('✅ 확인 팝업 닫기');
      }

      return;
    }

    throw new Error('장바구니 담기 버튼을 찾을 수 없습니다.');
  }

  async gotoCart(): Promise<void> {
    console.log('🛒 장바구니 페이지로 이동...');
    await this.page.goto('https://www.kurly.com/cart');
    await this.wait(2000);
    console.log('✅ 장바구니 페이지 URL:', await this.getCurrentURL());
  }

  async getCartItemCount(): Promise<number> {
    // 장바구니 아이템은 class에 cart와 item을 포함 (복합 클래스 패턴)
    const items = await this.page.locator('[class*="cart"][class*="item"]').count();
    console.log(`🛒 장바구니 상품 개수: ${items}`);
    return items;
  }

  async proceedToCheckout(): Promise<void> {
    console.log('💳 주문하기 버튼 클릭...');

    // 주문하기 버튼 찾기 (주문하기 > 결제하기 순으로 시도)
    let button = this.page.getByRole('button', { name: '주문하기' });
    let isVisible = await button.isVisible().catch(() => false);

    if (!isVisible) {
      button = this.page.getByRole('button', { name: '결제하기' });
      isVisible = await button.isVisible().catch(() => false);
    }

    if (isVisible) {
      await button.click();
      console.log('✅ 주문하기 버튼 클릭 완료');
      await this.wait(3000);
      console.log('✅ 결제 페이지 URL:', await this.getCurrentURL());
      return;
    }

    throw new Error('주문하기 버튼을 찾을 수 없습니다.');
  }
}
