import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string = '') {
    await this.page.goto(path);
  }

  getByText(text: string): Locator {
    return this.page.getByText(text);
  }

  async click(selector: string): Promise<void> {
    await this.page.locator(selector).click();
  }

  async fill(selector: string, text: string): Promise<void> {
    await this.page.locator(selector).fill(text);
  }

  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  async getCurrentURL(): Promise<string> {
    return this.page.url();
  }

  /**
   * "일시적인 장애가 발생했어요" 얼럿 처리
   * 얼럿이 표시되면 [확인] 버튼을 클릭하고, 표시되지 않으면 무시합니다.
   */
  async handleTemporaryErrorAlert(): Promise<void> {
    try {
      const alertText = this.page.getByText('일시적인 장애가 발생했어요');
      const isVisible = await alertText.isVisible().catch(() => false);

      if (isVisible) {
        console.log('⚠️ "일시적인 장애가 발생했어요" 얼럿 감지됨');

        // aria-label="confirm-button" 사용
        const confirmButton = this.page.getByLabel('confirm-button');
        await confirmButton.waitFor({ state: 'visible', timeout: 3000 });
        await confirmButton.click();
        console.log('✅ 얼럿 [확인] 버튼 클릭 완료');

        await this.wait(500);
      }
    } catch (error) {
      console.log('📋 "일시적인 장애" 얼럿 없음 - 정상 진행');
    }
  }
}