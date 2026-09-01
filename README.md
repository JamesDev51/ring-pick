# Ring Pick v2 — 한국형 웨딩밴드 취향 테스트

실제 매일 착용하는 웨딩밴드의 **작은 다이아, 폭, 단면, 표면, 모티프, 색감과 투톤**을 이미지 선택으로 정리하는 모바일 전용 정적 SPA입니다.

## 사용자 모드

- 빠른 취향 찾기: 통제형 18문항 → 개인화 16강 → 결과
- 전체 월드컵: 64개 후보, 정확히 63번 선택
- 결과: 7개 취향 축, 매장용 문장, 강한 비선호, 파트너 링 조율, 대안 3개, 4:5 PNG 저장과 공유 링크

## 기술 구조

- React 19 + TypeScript + Vite
- 서버, API, DB, 로그인 없음
- 세션은 `ringpick.session.v2`에만 로컬 저장
- 320~480px 세로 모바일 공식 지원
- 64개 후보 × 단독/착용 × 384/768 WebP + 25개 진단 이미지 × 2 해상도
- WebP 오류 시 정적 SVG fallback

## 실행

```bash
npm ci
npm run dev
npm run verify
npx playwright install chromium webkit
npm run e2e
```

## 품질 게이트

`npm run verify`는 ESLint, unit test, 306개 WebP와 89개 fallback 자산, 18개 통제 비교, TypeScript 및 production build를 검사합니다. Playwright는 Chromium 320/390/480px와 iPhone WebKit에서 핵심 사용자 흐름을 검증합니다.

## PRD / 현재 완성 계획

- [Ring Pick v2.1 — 100% 완성 PRD](docs/PRD_V2.1_100_PERCENT_COMPLETION.md)

현재 기능·배포는 완료된 상태이며, v2.1 PRD는 **실사 웨딩밴드 이미지 153장 전면 교체, 진단 공정성 검수, 실제 사용자 5~10명 테스트, 최종 Production Release Gate**까지 남은 작업을 정의합니다.
