import type { Locator, Page } from 'playwright';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
// import { safeClick } from './uiActions.js';
import { randomInt } from 'crypto';

async function preprocessCellForOcr(buf: Buffer) {
  // 셀 하나는 작으니 좀 더 키우고 대비 올리기
  return sharp(buf)
    .resize({ width: 220, withoutEnlargement: false }) // 셀 크기에 따라 180~320 조절
    .grayscale()
    .threshold(165) // 140~200 튜닝
    .png()
    .toBuffer();
}

export async function clickDigitsOnKeyboard(
  page: Page,
  digits: string,
  keyboardSelector: string,
  iframeSelector?: string // iframe 선택자 (선택적)
) {
  const worker = await createWorker('eng');

  await worker.setParameters({
    tessedit_char_whitelist: '0123456789',
  });

  // iframe 내부 또는 페이지에서 키패드 찾기
  let keysLocator: Locator;
  if (iframeSelector) {
    const frame = page.locator(iframeSelector).contentFrame();
    keysLocator = frame.locator(keyboardSelector);
  } else {
    keysLocator = page.locator(keyboardSelector);
  }

  const keyCount = await keysLocator.count();

  if (keyCount < 10) {
    throw new Error(`키패드의 키 개수가 예상보다 적습니다. (찾은 개수: ${keyCount}, 최소 10개 필요)`);
  }

  console.log(`총 ${keyCount}개의 키를 찾았습니다. 분석을 시작합니다...`);

  const keyMap: Record<string, Locator> = {};

  for (let i = 0; i < keyCount; i++) {
    // 모든 키를 분석 (삭제 버튼 등은 OCR에서 숫자가 아니므로 자동 필터링됨)

    const currentKey = keysLocator.nth(i);

    // 해당 요소의 스크린샷 캡처 (Buffer 반환)
    const imageBuffer = await currentKey.screenshot();
    const processed = await preprocessCellForOcr(imageBuffer);

    // Tesseract로 이미지 분석
    const {
      data: { text, confidence },
    } = await worker.recognize(processed);

    console.log(`[Index ${i}] 인식된 텍스트: "${text.trim()}", 신뢰도: ${confidence?.toFixed(2)}`);

    // 공백 및 줄바꿈 제거
    const detectedChar = text.trim();

    // 인식된 결과가 숫자라면 매핑 저장. (빈 문자열이 아니고 숫자인지 확인)
    if (detectedChar && /^\d+$/.test(detectedChar)) {
      console.log(`[Index ${i}] 인식 성공: ${detectedChar}`);
      keyMap[detectedChar] = currentKey;
    } else {
      console.warn(`[Index ${i}] 인식 실패 또는 노이즈: "${text}"`);
    }
  }

  console.log(`비밀번호 입력을 시작합니다.`);

  for (const char of digits) {
    const targetButton = keyMap[char];

    if (targetButton) {
      // 클릭
      await targetButton.click();
      console.log(`숫자 '${char}' 클릭 완료`);

      // 보안 키패드는 입력 간격이 너무 빠르면 인식을 못할 수 있음
      await page.waitForTimeout(randomInt(200, 400));
    } else {
      console.error(`Error: 숫자 '${char}'를 키패드에서 찾지 못했습니다.`);
    }
  }

  await worker.terminate();
}