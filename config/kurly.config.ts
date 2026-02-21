import dotenv from 'dotenv';

dotenv.config();

const isCI = process.env.CI === 'true';

function getEnv(name: string, required = false): string {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    if (required && isCI) {
      throw new Error(`❌ Required environment variable missing: ${name}`);
    }
    return '';
  }

  return value;
}

export const kurlyConfig = {
  baseURL: process.env.BASE_URL || 'https://www.kurly.com',

  testData: {
    validId: getEnv('TEST_ID', true),
    validPassword: getEnv('TEST_PASSWORD', true),
    kurlyPayPassword: getEnv('KURLY_PAY_PASSWORD', true),
    paycoPin: getEnv('PAYCO_PIN', false), // 선택값
  },

  waitTimes: {
    medium: Number(process.env.WAIT_MEDIUM) || 3000,
  },
};
