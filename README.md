# Kurly E2E 테스트 프로젝트

Playwright를 사용한 컬리(Kurly) 웹사이트 E2E 테스트 자동화 프로젝트입니다.

## 프로젝트 구조

```
├── config/
│   └── kurly.config.ts        # 테스트 설정 (URL, 테스트 데이터, 대기 시간)
├── pages/
│   ├── base.page.ts           # 페이지 객체 기본 클래스
│   ├── login.page.ts          # 로그인 페이지 객체
│   ├── cart.page.ts           # 장바구니 페이지 객체
│   ├── order.page.ts          # 주문/결제 페이지 객체
│   ├── order.list.page.ts     # 주문 목록 페이지 객체
│   ├── order.detail.page.ts   # 주문 상세 페이지 객체
│   ├── cancel.page.ts         # 주문 취소 페이지 객체
│   └── kurly.page.ts          # 컬리 통합 페이지 객체
├── tests/
│   ├── kurlyTest.ts           # Playwright 테스트 픽스처
│   └── kurly.spec.ts          # 테스트 케이스
└── playwright.config.ts       # Playwright 설정
```

## 테스트 케이스

- 메인 페이지 로드 확인
- 로그인 기능 테스트
- 장바구니 결제 테스트 (로그인 → 상품 검색 → 장바구니 담기 → 결제)
- 주문 완료 확인 테스트
- 주문 취소 테스트

## 로케이터 전략

이 프로젝트는 Playwright 권장 Semantic Locator를 사용합니다:

| 메서드 | 용도 | 예시 |
|--------|------|------|
| `getByRole()` | 버튼, 링크 등 역할 기반 | `getByRole('button', { name: '로그인' })` |
| `getByLabel()` | aria-label 기반 | `getByLabel('confirm-button')` |
| `getByPlaceholder()` | placeholder 기반 | `getByPlaceholder('아이디를 입력해주세요')` |
| `getByText()` | 텍스트 기반 | `getByText('주문을 완료했어요')` |
| `locator()` | URL 패턴 등 특수 케이스 | `locator('a[href*="/goods/"]')` |

## 설치

```bash
npm install
```

## 실행

```bash
# 모든 테스트 실행
npx playwright test

# 특정 테스트 실행
npx playwright test kurly.spec.ts

# UI 모드로 실행
npx playwright test --ui

# 테스트 리포트 확인
npx playwright show-report
```

## 환경 변수

`.env` 파일에 테스트 계정 정보를 설정할 수 있습니다:

```
TEST_ID=your_id
TEST_PASSWORD=your_password
KURLY_PAY_PASSWORD=your_kurly_pay_password
```
