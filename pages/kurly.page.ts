import { Page } from '@playwright/test';
import { LoginPage } from './login.page';
import { CartPage } from './cart.page';
import { OrderPage } from './order.page';
import { CancelPage } from './cancel.page';
import { kurlyConfig } from '../config/kurly.config';

export class KurlyPage {
  readonly loginPage: LoginPage;
  readonly cartPage: CartPage;
  readonly orderPage: OrderPage;
  readonly cancelPage: CancelPage;
  private page: Page;

  constructor(page: Page) {
    this.page = page;
    this.loginPage = new LoginPage(page);
    this.cartPage = new CartPage(page);
    this.orderPage = new OrderPage(page);
    this.cancelPage = new CancelPage(page);
  }

  async gotoHomePage(): Promise<void> {
    await this.page.goto(kurlyConfig.baseURL);
  }

  async getCurrentURL(): Promise<string> {
    return this.page.url();
  }

  // LoginPage 위임 메서드
  async login(id: string, password: string): Promise<void> {
    await this.loginPage.login(id, password);
  }

  async logout(): Promise<void> {
    await this.loginPage.logout();
  }

  async isLoggedIn(): Promise<boolean> {
    return this.loginPage.isLoggedIn();
  }

  // CartPage 위임 메서드
  async searchProduct(keyword: string): Promise<void> {
    await this.cartPage.searchProduct(keyword);
  }

  async clickFirstProduct(): Promise<void> {
    await this.cartPage.clickFirstProduct();
  }

  async addToCart(): Promise<void> {
    await this.cartPage.addToCart();
  }

  async gotoCart(): Promise<void> {
    await this.cartPage.gotoCart();
  }

  async proceedToCheckout(): Promise<void> {
    await this.cartPage.proceedToCheckout();
  }

  // OrderPage 위임 메서드
  async isOnCheckoutPage(): Promise<boolean> {
    return this.orderPage.isOnCheckoutPage();
  }

  async completePayment(kurlyPayPassword?: string): Promise<void> {
    await this.orderPage.completePayment(kurlyPayPassword);
  }

  async verifyOrderComplete(): Promise<string> {
    return this.orderPage.verifyOrderComplete();
  }

  // CancelPage 위임 메서드
  async cancelOrderList(orderNumber: string): Promise<void> {
    await this.cancelPage.cancelOrderList(orderNumber);
  }

    async cancelOrderDetail(orderNumber: string): Promise<void> {
    await this.cancelPage.cancelOrderDetail(orderNumber);
  }
}
