import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { kurlyConfig } from '../config/kurly.config';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoLoginPage(): Promise<void> {
    console.log('🔍 로그인 페이지로 이동...');
    await this.page.goto('https://www.kurly.com/member/login');
    await this.page.waitForLoadState('domcontentloaded');
    console.log('✅ 로그인 페이지 URL:', await this.getCurrentURL());
  }

  async login(id: string, password: string): Promise<void> {
    await this.gotoLoginPage();

    console.log('📝 ID 입력 중...');
    await this.page.getByPlaceholder('아이디를 입력해주세요').fill(id);

    console.log('📝 비밀번호 입력 중...');
    await this.page.getByPlaceholder('비밀번호를 입력해주세요').fill(password);

    console.log('🔐 로그인 버튼 클릭...');
    await this.page.getByRole('button', { name: '로그인' }).click();

    await this.wait(kurlyConfig.waitTimes.medium);
    console.log('✅ 로그인 후 URL:', await this.getCurrentURL());

    await this.handlePasswordChangePopup();
  }

  async handlePasswordChangePopup(): Promise<void> {
    try {
      console.log('🔍 비밀번호 변경 팝업 확인 중...');

        const button = this.page.getByRole('button', { name: '다음에 변경하기' });
      const isVisible = await button.isVisible().catch(() => false);

      if (isVisible) {
        console.log('✅ 비밀번호 변경 팝업 발견!');
        await button.click();
        console.log('✅ "다음에 변경하기" 버튼 클릭 완료');
        await this.wait(1000);
        return;
      }

      console.log('ℹ️ 비밀번호 변경 팝업 없음 (정상)');
    } catch (error) {
      console.log('ℹ️ 비밀번호 변경 팝업 처리 중 에러 (무시하고 계속):', error);
    }
  }

  async logout(): Promise<void> {
    await this.page.getByRole('link', { name: '마이컬리' }).click();
    await this.getByText('로그아웃').click();
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      // "~님" 텍스트가 포함된 요소를 찾아 로그인 상태 확인
      const userNameElement = this.page.getByText(/님$/).first();
      const isVisible = await userNameElement.isVisible().catch(() => false);

      if (isVisible) {
        console.log('✅ 로그인 확인 성공');
        return true;
      }

      console.log('❌ 로그인 상태 아님');
      return false;
    } catch (error) {
      console.log('❌ 로그인 확인 중 에러:', error);
      return false;
    }
  }
}
