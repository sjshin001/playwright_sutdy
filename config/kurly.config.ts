export const kurlyConfig = {
  baseURL: 'https://www.kurly.com',

  testData: {
    validId: process.env.TEST_ID || '',
    validPassword: process.env.TEST_PASSWORD || '',
    kurlyPayPassword: process.env.KURLY_PAY_PASSWORD || '',
    paycoPin: process.env.PAYCO_PIN || '832013', // 페이코 결제 비밀번호
  },

  waitTimes: {
    medium: 3000,
  },
};
