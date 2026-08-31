# RING PICK

모바일 전용 **웨딩링 취향 테스트 & 이상형 월드컵**입니다. 두 반지를 반복해서 고르면 금속, 스톤 쉐입/크기, 밴드, 세팅 취향을 분석하고 반지샵에서 바로 보여줄 수 있는 결과를 만듭니다.

## Product

- 빠른 취향 찾기: 17개 통제 비교 → 개인화 16강
- 전체 월드컵: 64강 → 63매치 → 우승 링
- 결과: 페르소나, 8개 속성 선호도, 상위 4개 취향, 매장용 문장, 대안 3개
- 반지 단독컷/착용컷 전환
- 1080×1350 결과 PNG 저장 + Web Share / URL fallback
- LocalStorage 이어하기 / undo / 공유 결과 직접 URL
- 서버, API, DB, 로그인 없음
- 공식 지원: 모바일 portrait 320~480 CSS px

## Stack

React 19 + TypeScript + Vite SPA, React Router, Zod, Vitest, Playwright, html-to-image. Vercel에는 `dist`만 정적 배포합니다.

## Run

```bash
npm install
npm run verify
npx playwright install chromium
npm run e2e
npm run dev
```

## Assets

개발/빌드 시작 전에 `npm run prepare:assets`가 **22개 진단 이미지 + 64개 packshot + 64개 worn = 150개 SVG 자산**을 결정적으로 생성합니다. 모든 이미지는 동일한 속성 매니페스트에서 만들어져 진단 pair의 통제 변수를 보장합니다. 생성 결과는 `public/images/rings/**`에 위치하며 Git에는 중복 저장하지 않습니다.

실제 ChatGPT Image Gen 2 승인본을 사용할 때는 `src/data/ring/*.json`의 ringId/속성은 유지하고 생성된 `public/images/rings/**`와 같은 파일명/경로로 교체하면 엔진과 화면 수정 없이 적용할 수 있습니다.

```bash
npm run check:assets
```

위 명령은 64쌍 packshot/worn, 22개 진단 이미지, 17개 질문 pair와 통제 속성을 검사합니다.
