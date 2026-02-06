import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { OrderListPage } from './order.list.page';
import { OrderDetailPage } from './order.detail.page';

export class CancelPage extends BasePage {
  private orderListPage: OrderListPage;
  private orderDetailPage: OrderDetailPage;

  constructor(page: Page) {
    super(page);
    this.orderListPage = new OrderListPage(page);
    this.orderDetailPage = new OrderDetailPage(page);
  }

  /**
   * 주문 리스트 페이지로 이동
   */
  async gotoOrderPage(): Promise<void> {
    await this.orderListPage.goto();
  }

  /**
   * 주문번호로 주문상세 페이지로 이동
   */
  async gotoOrderDetailPage(orderNumber: string): Promise<void> {
    await this.orderDetailPage.goto(orderNumber);
  }

  /**
   * 주문 목록 페이지 에서 주문상세 페이지로 이동
   * 주문 번호가 없는 경우, 가장 최근 주문 상세 페이지로 이동
   */
  async gotoOrderPageIfNoOrderNumber(orderNumber?: string): Promise<void> {
    await this.orderListPage.goto();

    if (orderNumber) {
      await this.orderDetailPage.goto(orderNumber);
    } else {
      await this.orderListPage.clickRecentOrderLink();
    }
  }

  /**
   * 주문 목록에서 [주문 취소] 버튼 클릭
   */
  async clickOrderCancelButton(): Promise<void> {
    await this.orderDetailPage.clickOrderCancelButton();
  }

  /**
   * 취소사유 선택 페이지 로딩 대기
   */
  async waitForCancelReasonPage(): Promise<void> {
    console.log('🔍 취소사유 선택 페이지 로딩 대기...');
    await this.wait(2000);
    console.log('✅ 취소사유 선택 페이지 로드 완료');
  }

  /**
   * 단순변심 라디오버튼 선택
   * 여러 가지 방법을 순차적으로 시도하여 라디오버튼을 선택합니다.
   */
  async selectSimpleChangeOfMind(): Promise<void> {
    console.log('🔍 단순변심 라디오버튼 선택 시작...');
    console.log('═'.repeat(50));

    const methods = [
      {
        name: '방법 1: getByLabel로 라디오버튼 선택',
        action: async () => {
          const radioButton = this.page.getByLabel('단순변심');
          await radioButton.waitFor({ state: 'visible', timeout: 5000 });
          await radioButton.check();
        }
      },
      {
        name: '방법 2: getByRole radio로 선택',
        action: async () => {
          const radioButton = this.page.getByRole('radio', { name: '단순변심' });
          await radioButton.waitFor({ state: 'attached', timeout: 5000 });
          await radioButton.check({ force: true });
        }
      },
      {
        name: '방법 3: getByText로 라벨 클릭',
        action: async () => {
          const label = this.page.getByText('단순변심').first();
          await label.waitFor({ state: 'visible', timeout: 5000 });
          await label.click();
        }
      },
      {
        name: '방법 4: JavaScript로 직접 checked 설정',
        action: async () => {
          await this.page.evaluate(() => {
            const radio = document.querySelector('input[name="claim-cancel-reasons"][value="단순변심"]') as HTMLInputElement;
            if (radio) {
              radio.checked = true;
              radio.dispatchEvent(new Event('change', { bubbles: true }));
              radio.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
        }
      },
      {
        name: '방법 5: JavaScript로 click 이벤트 발생',
        action: async () => {
          await this.page.evaluate(() => {
            const radio = document.querySelector('input[name="claim-cancel-reasons"][value="단순변심"]') as HTMLInputElement;
            if (radio) {
              radio.click();
            }
          });
        }
      },
      {
        name: '방법 6: 부모 label/div 클릭',
        action: async () => {
          const parentLabel = this.page.getByRole('radio', { name: '단순변심' }).locator('..');
          await parentLabel.click({ force: true });
        }
      },
      {
        name: '방법 7: getByText로 단순변심 텍스트 클릭',
        action: async () => {
          const textElement = this.page.getByText('단순변심').first();
          await textElement.waitFor({ state: 'visible', timeout: 5000 });
          await textElement.click();
        }
      }
    ];

    // 시도 결과 기록
    const results: { name: string; status: 'success' | 'failed' | 'not_checked'; error?: string }[] = [];

    for (const method of methods) {
      try {
        console.log(`  🔄 ${method.name} 시도 중...`);
        await method.action();

        // 선택 상태 확인
        await this.wait(500);
        const isSelected = await this.isRadioButtonSelected();

        if (isSelected) {
          results.push({ name: method.name, status: 'success' });
          console.log(`  ✅ ${method.name} 성공!`);
          this.printRadioButtonSummary(results);
          console.log('✅ 단순변심 선택 완료');
          return;
        } else {
          results.push({ name: method.name, status: 'not_checked' });
          console.log(`  ⚠️ ${method.name} 실행 완료, 하지만 선택 상태가 아님. 다음 방법 시도...`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.push({ name: method.name, status: 'failed', error: errorMsg });
        console.log(`  ❌ ${method.name} 실패: ${errorMsg}`);
      }
    }

    // 모든 방법 실패 시 요약 출력 후 에러 throw
    this.printRadioButtonSummary(results);
    throw new Error('모든 라디오버튼 선택 방법이 실패했습니다.');
  }

  /**
   * 라디오버튼 시도 결과 요약 출력
   */
  private printRadioButtonSummary(results: { name: string; status: 'success' | 'failed' | 'not_checked'; error?: string }[]): void {
    console.log('\n' + '═'.repeat(50));
    console.log('📊 [라디오버튼 선택] 시도 결과 요약');
    console.log('═'.repeat(50));

    results.forEach((result, index) => {
      const icon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
      const statusText = result.status === 'success' ? '성공' : result.status === 'failed' ? '실패' : '미선택';
      console.log(`  ${index + 1}. ${icon} ${result.name}: ${statusText}`);
      if (result.error) {
        console.log(`      └─ 에러: ${result.error.substring(0, 100)}${result.error.length > 100 ? '...' : ''}`);
      }
    });

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const notCheckedCount = results.filter(r => r.status === 'not_checked').length;

    console.log('─'.repeat(50));
    console.log(`  총 시도: ${results.length}개 | ✅ 성공: ${successCount}개 | ❌ 실패: ${failedCount}개 | ⚠️ 미선택: ${notCheckedCount}개`);
    console.log('═'.repeat(50) + '\n');
  }

  /**
   * 단순변심 라디오버튼이 선택되었는지 확인
   */
  private async isRadioButtonSelected(): Promise<boolean> {
    try {
      const isSelected = await this.page.evaluate(() => {
        const radio = document.querySelector('input[name="claim-cancel-reasons"][value="단순변심"]') as HTMLInputElement;
        return radio?.checked ?? false;
      });
      console.log(`  📋 라디오버튼 상태: ${isSelected ? '선택됨 ✓' : '선택 안됨 ✗'}`);
      return isSelected;
    } catch (error) {
      console.log('  ⚠️ 라디오버튼 상태 확인 실패:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * 필수 취소 내역 동의 체크박스 선택
   * 여러 가지 방법을 순차적으로 시도하여 체크박스를 선택합니다.
   */
  async checkRequiredAgreement(): Promise<void> {
    console.log('🔍 필수 취소 내역 동의 체크박스 선택 시작...');
    console.log('═'.repeat(50));

    const methods = [
      {
        name: '방법 1: getByLabel로 체크박스 선택',
        action: async () => {
          const checkbox = this.page.getByLabel('[필수] 주문 취소 내역에 동의');
          await checkbox.waitFor({ state: 'attached', timeout: 5000 });
          await checkbox.check();
        }
      },
      {
        name: '방법 2: getByRole checkbox로 선택',
        action: async () => {
          const checkbox = this.page.getByRole('checkbox', { name: /주문 취소 내역에 동의/ });
          await checkbox.waitFor({ state: 'attached', timeout: 5000 });
          await checkbox.check();
        }
      },
      {
        name: '방법 3: getByText로 라벨 클릭',
        action: async () => {
          const label = this.page.getByText('[필수] 주문 취소 내역에 동의');
          await label.waitFor({ state: 'visible', timeout: 5000 });
          await label.click();
        }
      },
      {
        name: '방법 4: JavaScript로 직접 checked 속성 변경',
        action: async () => {
          await this.page.evaluate(() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const targetLabel = labels.find(label => label.textContent?.includes('[필수] 주문 취소 내역에 동의'));
            if (targetLabel) {
              const checkbox = targetLabel.querySelector('input[type="checkbox"]') as HTMLInputElement;
              if (checkbox) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                checkbox.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
          });
        }
      },
      {
        name: '방법 5: JavaScript로 click 이벤트 발생',
        action: async () => {
          await this.page.evaluate(() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const targetLabel = labels.find(label => label.textContent?.includes('[필수] 주문 취소 내역에 동의'));
            if (targetLabel) {
              const checkbox = targetLabel.querySelector('input[type="checkbox"]') as HTMLInputElement;
              if (checkbox) {
                checkbox.click();
              }
            }
          });
        }
      },
      {
        name: '방법 6: div 체크박스 UI 클릭 (커스텀 체크박스)',
        action: async () => {
          const checkboxDiv = this.page.getByText('[필수] 주문 취소 내역에 동의').locator('..').locator('div').first();
          await checkboxDiv.waitFor({ state: 'visible', timeout: 5000 });
          await checkboxDiv.click();
        }
      },
      {
        name: '방법 7: dispatchEvent로 체크 (React/Vue 상태 업데이트)',
        action: async () => {
          await this.page.evaluate(() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const targetLabel = labels.find(label => label.textContent?.includes('[필수] 주문 취소 내역에 동의'));
            if (targetLabel) {
              const checkbox = targetLabel.querySelector('input[type="checkbox"]') as HTMLInputElement;
              if (checkbox) {
                // React/Vue 등 프레임워크를 위한 이벤트 발생
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked')?.set;
                if (nativeInputValueSetter) {
                  nativeInputValueSetter.call(checkbox, true);
                }
                checkbox.dispatchEvent(new Event('input', { bubbles: true }));
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              }
            }
          });
        }
      }
    ];

    // 시도 결과 기록
    const results: { name: string; status: 'success' | 'failed' | 'not_checked'; error?: string }[] = [];

    for (const method of methods) {
      try {
        console.log(`  🔄 ${method.name} 시도 중...`);
        await method.action();

        // 체크 상태 확인
        await this.wait(500);
        const isChecked = await this.isCheckboxChecked();

        if (isChecked) {
          results.push({ name: method.name, status: 'success' });
          console.log(`  ✅ ${method.name} 성공!`);
          this.printCheckboxSummary(results);
          console.log('✅ 필수 취소 내역 동의 체크 완료');
          return;
        } else {
          results.push({ name: method.name, status: 'not_checked' });
          console.log(`  ⚠️ ${method.name} 실행 완료, 하지만 체크 상태가 아님. 다음 방법 시도...`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.push({ name: method.name, status: 'failed', error: errorMsg });
        console.log(`  ❌ ${method.name} 실패: ${errorMsg}`);
      }
    }

    // 모든 방법 실패 시 요약 출력 후 에러 throw
    this.printCheckboxSummary(results);
    throw new Error('모든 체크박스 클릭 방법이 실패했습니다.');
  }

  /**
   * 체크박스 시도 결과 요약 출력
   */
  private printCheckboxSummary(results: { name: string; status: 'success' | 'failed' | 'not_checked'; error?: string }[]): void {
    console.log('\n' + '═'.repeat(50));
    console.log('📊 [체크박스 선택] 시도 결과 요약');
    console.log('═'.repeat(50));

    results.forEach((result, index) => {
      const icon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
      const statusText = result.status === 'success' ? '성공' : result.status === 'failed' ? '실패' : '미체크';
      console.log(`  ${index + 1}. ${icon} ${result.name}: ${statusText}`);
      if (result.error) {
        console.log(`      └─ 에러: ${result.error.substring(0, 100)}${result.error.length > 100 ? '...' : ''}`);
      }
    });

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const notCheckedCount = results.filter(r => r.status === 'not_checked').length;

    console.log('─'.repeat(50));
    console.log(`  총 시도: ${results.length}개 | ✅ 성공: ${successCount}개 | ❌ 실패: ${failedCount}개 | ⚠️ 미체크: ${notCheckedCount}개`);
    console.log('═'.repeat(50) + '\n');
  }

  /**
   * 체크박스가 체크되었는지 확인
   */
  private async isCheckboxChecked(): Promise<boolean> {
    try {
      const isChecked = await this.page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('label'));
        const targetLabel = labels.find(label => label.textContent?.includes('[필수] 주문 취소 내역에 동의'));
        if (targetLabel) {
          const checkbox = targetLabel.querySelector('input[type="checkbox"]') as HTMLInputElement;
          return checkbox?.checked ?? false;
        }
        return false;
      });
      console.log(`  📋 체크박스 상태: ${isChecked ? '체크됨 ✓' : '체크 안됨 ✗'}`);
      return isChecked;
    } catch (error) {
      console.log('  ⚠️ 체크박스 상태 확인 실패:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * 하단 [주문 취소] 버튼 클릭
   */
  async clickBottomCancelButton(): Promise<void> {
    console.log('🔍 하단 [주문 취소] 버튼 클릭...');
    const cancelButton = this.page.getByRole('button', { name: '주문 취소' }).last();
    await cancelButton.waitFor({ state: 'visible', timeout: 10000 });
    await cancelButton.click();
    console.log('✅ 하단 [주문 취소] 버튼 클릭 완료');
  }

  /**
   * 얼럿 팝업에서 [주문 취소] 버튼 클릭
   */
  async clickAlertCancelButton(): Promise<void> {
    console.log('🔍 얼럿 [주문 취소] 버튼 클릭...');
    // 얼럿 팝업의 확인 버튼 (aria-label="confirm-button")
    const confirmButton = this.page.getByLabel('confirm-button');
    await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
    await confirmButton.click();
    console.log('✅ 얼럿 [주문 취소] 버튼 클릭 완료');
  }

  /**
   * 주문 취소 전체 프로세스 실행
   */
  async cancelOrderList(orderNumber: string): Promise<void> {
    try {
      console.log('🛒 === 주문 취소 프로세스 시작 ===');
      // 1. 주문 목록 페이지 이동
      await this.gotoOrderPageIfNoOrderNumber(orderNumber);

      // 2. [주문 취소] 버튼 클릭
      await this.clickOrderCancelButton();

      // 3. 취소사유 선택 페이지 로딩 대기
      await this.waitForCancelReasonPage();

      // 4. 단순변심 라디오버튼 선택
      await this.selectSimpleChangeOfMind();

      // 5. 필수 취소 내역 동의 체크박스 선택
      await this.checkRequiredAgreement();

      // 6. 하단 [주문 취소] 버튼 클릭
      await this.clickBottomCancelButton();

      // 7. 얼럿 [주문 취소] 버튼 클릭
      await this.clickAlertCancelButton();

      console.log('✅ === 주문 취소 프로세스 완료 ===');
    } catch (error) {
      console.error('❌ 주문 취소 중 에러:', error);
      await this.page.screenshot({ path: 'screenshots/cancel-order-error.png' });
      throw error;
    }
  }

  /**
   * 주문 취소 전체 프로세스 실행
   */
  async cancelOrderDetail(orderNumber: string): Promise<void> {
    try {
      console.log('🛒 === 주문 취소 프로세스 시작 ===');

      // 2. [주문 취소] 버튼 클릭
      await this.clickOrderCancelButton();

      // 3. 취소사유 선택 페이지 로딩 대기
      await this.waitForCancelReasonPage();

      // 4. 단순변심 라디오버튼 선택
      await this.selectSimpleChangeOfMind();

      // 5. 필수 취소 내역 동의 체크박스 선택
      await this.checkRequiredAgreement();

      // 6. 하단 [주문 취소] 버튼 클릭
      await this.clickBottomCancelButton();

      // 7. 얼럿 [주문 취소] 버튼 클릭
      await this.clickAlertCancelButton();

      console.log('✅ === 주문 취소 프로세스 완료 ===');
    } catch (error) {
      console.error('❌ 주문 취소 중 에러:', error);
      await this.page.screenshot({ path: 'screenshots/cancel-order-error.png' });
      throw error;
    }
  }
}
