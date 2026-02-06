import sharp from "sharp";
import { createWorker } from "tesseract.js";
import { Page } from "@playwright/test";


/**
 * iframe 내에서 OCR PIN 입력
 */
export async function enterPinByOcrInFrame(
  page: Page,
  frameSelector: string,
  _keypadSelector: string, // 향후 확장용 (현재 미사용)
  pin6: string,
  options?: {
    delay?: number;
    threshold?: number;
    retryCount?: number;
  }
) {
  const delay = options?.delay ?? 300;
  const threshold = options?.threshold ?? 180;
  const retryCount = options?.retryCount ?? 3;

  console.log(`🔐 OCR PIN 입력 시작 (iframe): ${"*".repeat(pin6.length)}`);

  // tesseract.js v7 API - 숫자만 인식하도록 설정
  const worker = await createWorker("eng");

  // 숫자만 인식하도록 설정 (whitelist)
  await worker.setParameters({
    tessedit_char_whitelist: '0123456789',
  });

  try {
    // iframe 요소 찾기
    const frameElement = page.locator(frameSelector);
    await frameElement.waitFor({ state: "visible", timeout: 10000 });

    const frameBoundingBox = await frameElement.boundingBox();
    if (!frameBoundingBox) throw new Error("iframe boundingBox를 찾을 수 없습니다.");

    // iframe 스크린샷
    for (let i = 0; i < pin6.length; i++) {
      const digit = pin6[i];
      let clicked = false;

      for (let attempt = 0; attempt < retryCount && !clicked; attempt++) {
        const raw = await frameElement.screenshot();

        // 디버깅: 원본 스크린샷 저장
        const fs = await import('fs');
        fs.writeFileSync(`screenshots/ocr_debug_raw_${i}_${attempt}.png`, raw);

        // 숫자 인식 최적화: 대비 강화 + threshold
        const img = await sharp(raw)
          .grayscale()
          .normalize()
          .linear(1.5, -30) // 대비 강화
          .threshold(128)   // 이진화
          .negate()         // 흑백 반전 (검은 배경에 흰 글자가 OCR에 더 좋음)
          .png()
          .toBuffer();

        // 디버깅: 처리된 이미지 저장
        fs.writeFileSync(`screenshots/ocr_debug_processed_${i}_${attempt}.png`, img);

        const result = await worker.recognize(img);
        const symbols = (result.data as any).symbols ?? [];

        // 디버깅: 인식된 모든 문자 출력
        if (attempt === 0) {
          const recognized = symbols.map((s: any) => s.text).join('');
          console.log(`  [OCR 인식 결과] "${recognized}" (${symbols.length}개 심볼)`);
        }

        const hit = symbols.find((s: any) => s.text === digit && s.bbox);

        if (hit) {
          const cx = frameBoundingBox.x + (hit.bbox.x0 + hit.bbox.x1) / 2;
          const cy = frameBoundingBox.y + (hit.bbox.y0 + hit.bbox.y1) / 2;
          await page.mouse.click(cx, cy);
          console.log(`  [${i + 1}/${pin6.length}] 숫자 "${digit}" 클릭 완료`);
          clicked = true;
        } else {
          console.log(`  ⚠️ 숫자 "${digit}" 인식 실패 (시도 ${attempt + 1}/${retryCount})`);
          if (attempt < retryCount - 1) {
            await page.waitForTimeout(500);
          }
        }
      }

      if (!clicked) {
        throw new Error(`숫자 "${digit}"를 OCR로 찾을 수 없습니다.`);
      }

      if (i < pin6.length - 1) {
        await page.waitForTimeout(delay);
      }
    }

    console.log("✅ OCR PIN 입력 완료 (iframe)");
  } finally {
    await worker.terminate();
  }
}
