import { test as base } from '@playwright/test';
import { KurlyPage } from '../pages/kurly.page';

type KurlyFixtures = {
  kurlyPage: KurlyPage;
};

export const test = base.extend<KurlyFixtures>({
  kurlyPage: async ({ page }, use) => {
    const kurlyPage = new KurlyPage(page);
    await use(kurlyPage);
  },
});

export { expect } from '@playwright/test';
