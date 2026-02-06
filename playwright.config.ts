import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // 브라우저 보려면 false 추천
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 한 번에 하나씩 실행
  timeout: 600000,
  
  reporter: [
    ['html'],
    ['list']
  ],
  
  use: {
    baseURL: 'https://www.kurly.com',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    
    // 브라우저 항상 보이게 설정
    headless: false,
    
    // 느린 모션으로 실행 (밀리초)
    slowMo: 500,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // 브라우저 창 크기 설정
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});