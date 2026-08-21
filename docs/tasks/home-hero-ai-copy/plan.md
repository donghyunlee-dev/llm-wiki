# home-hero-ai-copy Plan

## Summary
- `homeContent.ts`의 텍스트 상수만 교체하고, `HomePage.tsx`에 기존 미사용 `hero.eyebrow` 필드를 렌더링하는 요소 한 줄을 추가한다. 새 CSS는 추가하지 않는다(`.home-eyebrow`, `.home-title` 모두 기존 클래스 재사용).

## Impacted Modules
- `packages/wiki-core/src/lib/homeContent.ts`
- `apps/web/src/ui/pages/HomePage.tsx`

## Architecture Approach
- 콘텐츠(텍스트)와 렌더링(JSX)의 기존 분리 구조를 유지. `HOME_CONTENT`는 순수 데이터, `SearchHero` 컴포넌트가 렌더링만 담당.

## Data And API Impact
- 없음. 상수 문자열 값만 변경.

## Validation Plan
- `pnpm test` (homeContent.test.ts의 금지어/카운트 검증 포함)
- `pnpm typecheck`
- Playwright로 홈 화면(`/`) 라이트/다크 테마, 데스크톱/모바일 뷰포트에서 eyebrow+title 렌더링과 레이아웃 확인
- Codex에 diff 전달해 critical review 수집

## Risks
- eyebrow 추가로 `.home-hero-section`의 `min-height`(clamp 220~310px) 안에서 레이아웃이 밀리거나 겹칠 수 있음 → Playwright로 실제 확인.
- 새 문구가 `BLOCKED_UI_TERMS`의 다른 금지어(예: 없음 확인됨)를 우연히 포함하지 않는지 테스트로 검증.

## Rollback Considerations
- 텍스트 상수 변경 + 1줄 JSX 추가로 diff가 작아, 필요 시 해당 커밋만 revert하면 즉시 원복 가능.
