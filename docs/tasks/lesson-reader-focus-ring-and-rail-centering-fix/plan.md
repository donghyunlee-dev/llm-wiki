# lesson-reader-focus-ring-and-rail-centering-fix Plan

## Impacted Areas
- `apps/web/src/ui/pages/LessonReaderPage.tsx`
- `apps/web/src/styles.css`

## Approach
1. **포커스 링**: `sceneTitleRef.current?.focus()`는 접근성(스크린리더 포커스 이동) 목적이고, 타이틀은 `tabIndex={-1}`이라 실제 키보드 Tab으로는 도달 불가능 — `focus-visible:outline*` 클래스가 트리거될 수 있는 유일한 경로가 이 프로그램적 focus() 호출뿐이라 항상 켜진 것처럼 보였다. 클래스를 완전히 제거(접근성 동작 자체는 focus() 호출만으로 유지됨).
2. **레일 위치**: `.lesson-reader-body-grid`+`--with-rail`(그리드로 콘텐츠+레일을 한 블록으로 묶어 함께 중앙 정렬) 구조를 폐기. `.lesson-reader-body-grid`는 원래처럼 콘텐츠만 담는 단순 중앙 정렬 컨테이너로 되돌리고, `.lesson-reader-side-rail`을 `position: fixed`로 완전히 독립시켜 `left: calc(50% + 32rem + 1.5rem)`(콘텐츠 중심 + 콘텐츠 절반 폭 + 여백)으로 계산.
3. **dock 겹침 회피**: 레일의 `bottom`을 하단 dock의 실측 높이(`--lesson-reader-dock-height`, 기존 ResizeObserver로 이미 관리 중)에 여백을 더해 계산 — dock이 아무리 커져도 레일은 항상 그 위에 뜬다.
4. 노출 breakpoint를 `xl`(1280px)에서 `2xl`(1536px)로 올림 — 콘텐츠(1024px, lg:max-w-5xl) 폭을 줄이지 않고 정중앙을 유지하려면, 레일(220px)+여백이 편측에 들어갈 자리가 실제로 남는 지점부터 켜야 한다.

## Validation Plan
- `pnpm test` / `pnpm typecheck`
- Playwright(1600×900, 2xl 이상): `getBoundingClientRect()`로 (a) 콘텐츠 좌우 여백이 동일한지, (b) 레일이 dock보다 위에 있는지(`rail.bottom < dock.top`), (c) 타이틀 `outline: none`인지 직접 실측.

## Risks
- 2xl로 breakpoint를 올리면 1280~1535px 폭에서는 레일이 안 보이고 하단 dock 배너만 보임 — 사용자가 이전에 "작은 노트북에서도 충분하다"고 한 것과는 다른 폭이 될 수 있음, 실측 기준(콘텐츠 정중앙 유지 우선)으로 조정한 것.
