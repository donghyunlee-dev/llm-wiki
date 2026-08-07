# Implementation Status

## Purpose
This document is the session-to-session progress ledger for the project. It must be updated every time implementation moves forward so a new session can resume in the correct order without depending on memory.

## Current Phase Map
| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| 0 | Project Setup | Completed | `pnpm` workspace, root config, web app, shared package created |
| 1 | Home Screen Prototype | Completed | Home page implemented from `Development Prompt` and realigned to the prototype-style compact layout |
| 2 | Read-only Wiki Core | In Progress | Remote source contract and validation are in place; actual endpoint value and CORS verification are still pending |
| 3 | Section and Article Pages | In Progress | Category/article pages now read through the shared async wiki source; upstream data wiring is still pending |
| 4 | Search Flow | In Progress | Search now uses the shared async wiki source and can swap snapshot/remote backends; upstream search data wiring is still pending |
| 5 | Metadata and Graph | In Progress | First article graph block now renders prerequisites, next, and related links from metadata |
| 6 | Read-only AI Ask | In Progress | Local dev endpoint, article Ask panel, and policy-aware prompt context return structured AI answer plus Confluence evidence and suggested documents |
| 7 | Operator Workflow | Not Started | No review workflow yet |

## Latest Completed Work
### 2026-08-07 — 학습 흐름(레슨 아웃라인 드로어) 씬 번호/간격 버그 수정
- 배경: 사용자가 "학습 흐름" 드로어에서 씬 번호가 전부 "1"로 보이고 항목 간 간격이 너무 넓어 스크롤이 길다고 리포트.
- 원인: `LessonOutlineDrawer.tsx`가 레슨마다 별도 `<ol>`을 만들며 번호를 레슨 내부 순번(`index + 1`)으로 표시하고 있었다. 지금 데이터는 레슨당 씬이 거의 1개뿐이라 사실상 모든 항목이 "1"로 보였다. 레슨 사이 간격(`gap-2.5`)도 씬 사이 간격(`gap-0.5`)보다 훨씬 넓어, 사실상 모든 항목 사이가 넓게 벌어지는 효과를 냈다.
- 수정: 번호를 코스 전체 누적 순번(리더 하단 "n / 23" 카운터와 동일 기준)으로 변경, 레슨/씬 사이 간격을 통일해 하나로 이어지는 목록처럼 촘촘하게 보이도록 수정. 회귀 테스트 추가.

### 2026-08-07 — 레슨 씬 Mermaid 다이어그램 지원 추가
- 배경: 콘텐츠팀이 `visual` 블록을 문서 간 변환이 쉬운 Mermaid 표기법으로 저작하고 싶어 했으나, 스키마가 `html`+`css`만 인식해 `mermaid` 필드는 조용히 버려지고 있었다(실측 확인). 상세는 `docs/tasks/lesson-scene-mermaid-diagram/`(spec/plan/tasks/test-result/result) 참고.
- `visual` 블록이 `mermaid`(다이어그램 정의 텍스트)로도 저작될 수 있게 스키마 확장 + `MermaidDiagramBlock` 컴포넌트로 실제 SVG 렌더링. 새 색상값 없이 이 앱의 기존 디자인 토큰(브랜드 컬러·폰트·라운드 반경)을 Mermaid 테마에 그대로 매핑해 기본 테마(청록/각진 상자)가 아닌 브랜드 톤으로 보이게 함.
- 다크 테마 토큰이 `color-mix()`를 쓰는데 이를 Mermaid의 색 파서가 이해하지 못해 초기화가 실패하는 문제를 Playwright 검증 중 발견·수정(실제 `<color>` 프로퍼티에 대입해 브라우저가 계산하게 한 뒤 레거시 `rgb()`로 정규화).
- Codex 크리티컬 리뷰에서 "저작자가 다이어그램 본문의 `%%{init}%%` 지시어로 `themeCSS`를 덮어써 페이지 전역 CSS를 주입할 수 있다"는 보안 이슈를 지적받아 Mermaid `secure` 설정 키 잠금 추가. 렌더 경쟁 상태(전역 `initialize()` 설정을 여러 렌더가 겹쳐 덮어쓰는 문제), `html`/`mermaid` 동시 저작 시 모호성 문제도 함께 수정.

### 2026-08-07 — 레슨 씬 타이틀 포커스 아웃라인 + interaction.steps 렌더링 복구, @sfood/ui 실사용 시작
- 배경: 씬 타이틀에 브라우저 기본 포커스 아웃라인이 계속 보이는 회귀(이전 수정이 `outline-none` 대체 없이 커스텀 클래스만 제거)와, `lesson.presentation`의 `interaction.steps`(예: 4단계 프로세스 설명)가 `compileScene`에서 조용히 버려져 화면에 전혀 안 보이던 문제를 수정. 상세는 `docs/tasks/lesson-scene-content-rendering/`(spec/plan/tasks/test-result/result) 참고.
- `@sfood/ui`를 이 저장소에서 처음으로 실제 React 컴포넌트로 사용(`List`+`Badge`) — 그 과정에서 디자인시스템의 git-의존성 dist 빌드 문제를 발견해 별도 저장소에 이슈 등록(#43, 수정 병합 확인)했고, pnpm이 빌드 결과를 최종 링크 위치로 못 옮기는 추가 문제는 root `postinstall` 자가 치유 스크립트(`scripts/ensure-sfood-ui-dist.mjs`)로 우회.
- `@sfood/ui`의 시맨틱 Tailwind 토큰(brand/surface/foreground/muted/border 등)을 `@theme inline`으로 노출해 이후 다른 `@sfood/ui` 컴포넌트도 하드코딩 없이 바로 쓸 수 있게 함(라이트+다크 모두 대응).
- Codex 크리티컬 리뷰에서 `Stepper`의 "완료" 의미가 데이터(진행 상태 없는 설명용 단계 목록)와 안 맞는다는 지적을 받아 `List`+`Badge`로 교체, `interaction.kind` 미검증 문제도 화이트리스트 가드로 수정.
- 사용자 재현 리포트로 추가 회귀 발견: `interaction.steps`가 있는 21개 씬 중 19개는 이미 `visual`(도식) 블록을 갖고 있었는데, 1차 구현이 무조건 리스트를 렌더링해 이 19개 전부에 도식과 중복되는 텍스트 리스트가 나타나는 문제가 있었다. `SceneShell`에 "이미 도식 블록이 있으면 리스트를 억제"하는 가드를 추가해 수정.

### 2026-08-06 — 사이트 헤더에 실제 SFOOD CI 로고 적용
- 배경: `docs/prd/SFOOD_CI_Normal_Small.png`에 있던 공식 CI 로고로 좌상단 브랜드 마크(기존엔 임의의 빨간 "S" 박스)를 교체. 상세는 `docs/tasks/site-header-ci-logo/`(spec/plan/tasks/test-result/result) 참고.
- 원본(1000×212)을 헤더 기존 마크 높이(28px)에 맞춰 레티나 대비 2x(264×56)로 리사이즈해 `apps/web/public/sfood-logo.png`로 배포.
- 다크 테마에서 로고의 "FOOD" 중간톤 회색 글자가 저대비로 흐리게 보이는 문제를 발견 — 빨간 "S"는 원색 유지, 회색 글자만 밝은 회색으로 재도색한 다크 전용 버전(`sfood-logo-dark.png`)을 만들어 `resolvedTheme`에 따라 자동 교체.
- 로고가 이미 "S FOOD"를 표현하므로 옆 텍스트를 "SFOOD AI WIKI" → "AI WIKI"로 축약(중복 제거).
- `pnpm test`/`pnpm typecheck` 통과, Playwright로 라이트/다크/모바일(390px) 확인.

### 2026-08-06 — 스크린샷 분석으로 발견한 3건 수정(포커스 링, 레일 위치, 콘텐츠 중앙 정렬)
- 배경: 사용자가 실제 화면 스크린샷을 캡처해 분석을 요청, 3가지 문제를 발견/확인함. 상세는 `docs/tasks/lesson-reader-focus-ring-and-rail-centering-fix/`(spec/plan/tasks/test-result/result) 참고.
- **씬 타이틀에 항상 떠 있던 빨간 테두리**: `.lesson-reader-scene-title`의 `focus-visible:outline*` 클래스가 원인. 씬 전환마다 접근성 목적으로 `sceneTitleRef.current?.focus()`를 호출하는데, 타이틀이 `tabIndex={-1}`이라 실제 키보드 Tab으로는 절대 도달 불가능해 이 프로그램적 focus()가 `focus-visible`을 트리거할 수 있는 유일한 경로였음 — 결과적으로 항상 켜진 것처럼 보였다. 클래스 제거(접근성 동작은 focus() 호출만으로 유지).
- **"다음 페이지" 사이드 레일 위치**: 원래 "우측 하단 고정"으로 정했는데 구현이 상단(`sticky top-24`, `items-start`)으로 되어 타이틀 옆에 떠 있었음 — 우측 하단 고정으로 수정.
- **콘텐츠 중앙 정렬 밀림**: 사이드 레일을 그리드로 콘텐츠와 한 블록으로 묶어 함께 중앙 정렬했더니 콘텐츠 자체의 중심이 왼쪽으로 밀리는 부작용이 있었음 — 레일을 `position: fixed`로 완전히 독립시켜 콘텐츠는 원래처럼 순수하게 정중앙 유지, 레일은 `left: calc(50% + 콘텐츠 절반폭 + 여백)`으로 콘텐츠 중심 기준 계산.
- **수정 중 발견한 추가 버그**: 레일을 콘텐츠 하단에 `position: absolute`로 배치했더니, 씬이 짧으면 콘텐츠 끝이 하단 dock(전체 폭, fixed, z-30) 영역과 겹쳐 레일이 완전히 가려지는 문제가 실측(Playwright `getBoundingClientRect`)으로 드러남 — 레일을 `position: fixed`로 바꾸고 `bottom`을 dock 실측 높이(`--lesson-reader-dock-height`)에 여백을 더해 계산해 항상 dock보다 위에 뜨도록 수정. 노출 breakpoint도 `xl`(1280px)에서 `2xl`(1536px)로 상향(콘텐츠 폭을 줄이지 않고 정중앙을 지키려면 레일이 들어갈 여백이 실제로 남는 지점부터 켜야 함).
- `pnpm test`/`pnpm typecheck` 전체 통과, Playwright 실측(좌우 여백 동일, 레일-dock 겹침 없음, outline 없음)으로 확인.

### 2026-08-06 — "다음 페이지" 사이드 레일 이동 + ResizeObserver 미작동 버그 근본 수정
- 배경: 사용자가 "콘텐츠가 가운데만 표시되고 좌우 여백이 남는데 다음 메시지를 우측으로 빼도 되지 않을까?"라고 제안, 이어서 "작은 노트북 모니터에서도 사이드 공간이 충분하다"고 확인하며 "교육 설명 높이가 작은 모니터에서 콘텐츠를 가린다"는 문제도 함께 요청. 그 직전에는 "교육 설명 숨기기가 안 되는데 테스트에서 왜 안 걸렸냐"는 리포트가 있었음. 상세는 `docs/tasks/lesson-reader-side-rail-and-dock-height-fix/`(spec/plan/tasks/test-result/result) 참고.
- **"숨기기가 안 된다" 리포트는 systematic-debugging으로 조사했으나 재현 실패** — Playwright 실제 클릭/컴포넌트 테스트 모두 정상 동작. jsdom 컴포넌트 테스트는 요소를 참조로 직접 클릭해 실제 화면 히트테스트를 하지 않으므로, "다른 요소가 시각적으로 위에 겹쳐 클릭을 가로채는" 클래스의 버그는 원천적으로 검증할 수 없다는 점을 사용자에게 설명(이전 세션의 `position: fixed` 독립 배너가 그 시점엔 숨기기 버튼과 겹칠 수 있었던 잔상으로 추정).
- **"다음 페이지" 안내를 `xl`(1280px) 이상에서 우측 사이드 레일로 이동** — `.lesson-reader-content`/`.lesson-reader-side-rail`을 그리드로 묶어 여백을 실제로 활용, `xl` 미만에서는 기존 하단 dock 배치 유지(반응형 이중 렌더 + CSS로 전환).
- **"교육 설명" 패널 높이를 `clamp(96px,22vh,260px)`로 조정** — 작은 노트북 모니터에서 더 적극적으로 줄어들게 함.
- **조사 중 훨씬 심각한 별도 버그를 발견해 근본 수정**: `ResizeObserver`(dock 실제 높이를 측정해 본문 여백에 반영하는 로직, 직전 세션에서 추가)가 `useEffect(fn, [])`로 등록돼 있어 로딩 스피너 렌더 시점(ref가 아직 null)에 한 번 실행되고 다시는 재시도되지 않았음 — 실제 콘텐츠가 마운트된 뒤에도 dock 높이를 영원히 측정 못 해 CSS 폴백(8rem)에 머물러 있었다. 이 때문에 짧은 씬+작은 화면(1366×768) 조합에서는 문서 전체 높이가 뷰포트와 정확히 같아져(`scrollHeight === innerHeight`) 스크롤 자체가 사라지고, dock에 가려진 콘텐츠(카드 그리드 등)를 영구히 볼 방법이 없는 상태였다. `useEffect` deps를 제거해 매 렌더 재등록하도록 수정(이 파일의 keydown 이펙트와 동일한 기존 패턴) — Playwright 실측으로 CSS 변수가 실제 dock 높이와 일치하고, 스크롤하면 항상 완전히 드러남을 재확인.
- 1차 가설(`flex-1`, `.lesson-reader-shell`의 `min-height`)은 틀렸음을 실측으로 확인 후 배제 — `min-height` 제거는 부수적으로도 더 올바른 설계라 유지.
- `pnpm test`/`pnpm typecheck` 전체 통과, Playwright로 1366×768/1440×900과 xl 경계 확인.

### 2026-08-06 — 레슨 리더 키보드 네비게이션 제한 + "교육 설명" 하단 고정/자체 스크롤
- 배경: 사용자가 (1) 키보드 아래 계열 키(Space/PageDown/PageUp)가 씬을 넘겨버려 긴 "교육 설명"을 스크롤로 읽을 수 없는 문제, (2) "교육 설명"이 길어지면 페이지 전체가 늘어나니 하단 컨트롤 바 위에 고정하고 그 안에서만 스크롤되게 해달라는 것, (3) "숨기기"를 아이콘으로 바꾸고 접으면 컨트롤 바에 붙게 해달라는 요청. 상세는 `docs/tasks/lesson-reader-keyboard-and-script-dock/`(spec/plan/tasks/test-result/result) 참고.
- 전역 키보드 핸들러에서 Space/PageDown/PageUp을 통한 씬 이동을 제거, ArrowLeft/ArrowRight(+기존 Home/End)만 남김.
- "교육 설명" 패널과 하단 컨트롤 바를 하나의 dock으로 묶어 화면에 고정, 패널 본문에 `max-h-[26vh] overflow-y-auto`를 줘서 텍스트가 길어도 패널 안에서만 스크롤됨. "숨기기/보기" 텍스트 버튼을 회전하는 셰브론 아이콘으로 교체, 접으면 슬림 헤더만 컨트롤 바에 붙어 남음.
- **아키텍처 시행착오와 수정**: 처음엔 dock을 `position: sticky`로 구현했으나, Codex 비판 리뷰로 "다음 페이지 안내 배너가 펼쳐진 패널과 겹칠 수 있다"는 지적을 받아 조사한 결과, `sticky`는 dock을 문서 흐름에 남겨 문서 전체 길이를 늘리고 콘텐츠가 짧은 씬에서는 항상 "문서 길이 - 뷰포트 높이"만큼 실제 콘텐츠 뒤쪽과 겹치는 더 근본적인 문제가 있음을 발견 — `position: fixed`로 전환하고, dock 높이가 씬마다 달라지는 문제는 `ResizeObserver`로 실측해 `--lesson-reader-dock-height` CSS 변수에 반영, 본문 하단 여백이 그 값을 정확히 따라가게 재작업(vh 기반 추정치는 표/카드 그리드가 있는 씬에서 부정확했음).
- 씬 콘텐츠가 유난히 길면 스크롤 전 화면에서 dock과 살짝 겹칠 수 있지만, 스크롤하면 항상 완전히 드러나고 "교육 설명" 자체는 페이지 스크롤과 무관하게 항상 읽을 수 있음을 Playwright 실측으로 확인 — 허용 가능한 트레이드오프로 판단, Open Gap 없음.
- `pnpm test`/`pnpm typecheck` 전체 통과, Playwright로 짧은/긴 씬과 라이트/다크 테마 확인.

### 2026-08-05 — `/lesson` UI/UX 진단 리포트 작성 + 오픈 전 필수 개선(히어로 일러스트, 챕터 색상)
- 배경: 사용자가 "메인/리스트 화면이 최고의 교육 콘텐츠 서비스 수준인지 평가하고, 이대로는 오픈 못한다"는 전제로 실제 교육 서비스와 비교 분석을 요청.
- Playwright로 인프런(코스 목록/상세), Duolingo(마이크로러닝 UX), SFOOD 참고 레퍼런스 사이트를 실제 접속해 캡처하고 우리 `/lesson` 화면과 비교한 UI/UX 진단 리포트를 아티팩트로 작성 — 결론: "오픈 비권장, 콘텐츠 구조는 탄탄하지만 이미지·색상·신뢰 신호가 전무해 관리자 목록처럼 보임".
- 오픈 전 필수 3건 중 사용자 확인 후 2건 진행(신뢰 신호는 실제 데이터 없어 보류): (1) 참고 레퍼런스 일러스트는 제3자 산출물이라 재사용 불가 + 이미지 생성 도구 없음 → `rect`/`circle`/`line` 기본 도형만으로 직접 그린 SVG 일러스트(`LessonHeroIllustration.tsx`)를 히어로에 추가, 2열 레이아웃으로 재구성. (2) 목록 23개 레슨이 전부 같은 색으로 반복되던 문제 → 챕터별 5색 팔레트(브랜드 레드와 겹치지 않게 신규 정의)를 헤더/순번/좌측 강조선에 일관 적용.
- Codex 비판 리뷰에서 1건 확인 및 수정: 장식용 히어로 SVG에 `role="img"`+`aria-label`을 준 것이 스크린리더에 불필요한 안내를 추가하는 문제 → `aria-hidden="true"`로 변경. 챕터 색 순환/undefined 처리/다크 대비/CSS 타입 안전성은 문제 없음으로 확인.
- 상세는 `docs/tasks/lesson-main-screen-visual-polish/`(spec/plan/tasks/test-result/result) 참고. `pnpm test`/`pnpm typecheck` 통과, Playwright로 라이트/다크/모바일 확인.

### 2026-08-05 — "이전" 버튼 레슨 경계 이동 버그 수정 + Pretendard 폰트 적용
- 배경: 사용자가 "이전으로 가는 건 왜 안돼?"라고 지적. 상세는 `docs/tasks/lesson-nav-fix-and-pretendard-font/`(spec/plan/tasks/test-result/result) 참고.
- **원인**: 레슨당 씬이 1개인 현재 콘텐츠 구조에서 "다음"은 레슨 경계를 넘어가도록 이미 구현돼 있었지만 "이전"은 그렇지 않아, 사실상 항상 비활성처럼 동작했음(비대칭 버그).
- `packages/wiki-core/src/lib/lessonDocuments.ts`에 `getNextLessonSlugFrom`과 대칭인 `getPreviousLessonSlugFrom` 추가, `LessonReaderPage.tsx`의 `goPrevious()`가 첫 씬에서 이전 레슨의 마지막 씬으로 이동하도록 수정, "이전" 버튼은 정말 첫 번째 레슨의 첫 씬일 때만 비활성화.
- 사용자가 Pretendard를 기본 폰트로 요청(본문: Pretendard/맑은 고딕/Malgun Gothic/Arial/sans-serif, 코드·인용구: Consolas/Menlo/Monaco/맑은 고딕 모노스페이스). woff2가 설치돼 있지 않음을 확인한 뒤 `pretendard` npm 패키지(가변 폰트 + 유니코드 서브셋 지연 로딩)를 설치, 앱 레벨 `--font-sans`/`--font-mono` 토큰을 오버라이드(디자인 시스템 패키지 자체는 변경하지 않음).
- Codex 비판 리뷰에서 2건 확인 및 수정: (1) 레슨 경계 이동 시 진입 애니메이션 방향(`backward`)을 설정하지 않던 문제, (2) `pretendard` 설치 중 `@sfood/ui`(git `#main` 의존성)가 무관하게 최신 커밋으로 재해석된 lockfile drift를 원상 복구. 메타데이터가 불완전한(unordered) 레슨이 섞일 때 이전/다음 탐색이 코스 경계를 넘어갈 수 있는 기존 특성(실 콘텐츠엔 영향 없음)은 Open Gap으로 문서화.
- `pnpm test`/`pnpm typecheck`/`pnpm build` 전체 통과, Playwright로 레슨 경계 이동과 폰트 로드 확인.

### 2026-08-05 — `/lesson` 메인 화면 재디자인 + "이어서 학습하기" 삭제
- 배경: 사용자가 "`/lesson`이 교육 콘텐츠의 메인 화면인데 디자인 없이 단조롭다"는 피드백과 "완료는 삭제했는데 이어서 학습하기는 왜 남아있냐"는 지적을 남김. 상세는 `docs/tasks/lesson-index-main-screen-redesign/`(spec/plan/tasks/test-result/result) 참고.
- AskUserQuestion으로 확인 후 "이어서 학습하기"(진행 상태 기반 재진입) 기능과 그 기반이던 `lessonProgress.ts`(localStorage 저장/조회) 모듈 전체를 삭제 — `LessonReaderPage.tsx`의 `markSceneVisited` 호출, `lessonAnalytics.ts`의 `progress_recovered` 이벤트 타입도 함께 제거. 시작 버튼은 항상 `lessons[0]`으로 연결.
- `/lesson` 화면을 "메인 화면"다운 구조로 재구성: 다른 페이지와 스타일을 맞출 필요는 없다는 사용자 지시에 따라, 기존 디자인 토큰(`--radius-xl`/`--accent-soft`/`--card-bg`/`--panel-border-soft` 등)만 재사용해 히어로(eyebrow 뱃지+헤드라인+통계 chip+CTA) + 챕터별 그룹 헤더 + 구분선 기반 "블로그 리스트" 스타일로 전환(기존 카드 박스 스타일 제거).
- Codex 비판 리뷰: 진행 상태 참조 완전 삭제 확인, `outline.lessons[index]`/`lessons[index]` 인덱스 정합성(둘 다 `listLessonDocumentsFrom` 기반) 확인, 챕터 헤더 렌더링 조건의 `undefined` 챕터 처리 확인, CSS 죽은 클래스 없음 확인 — 결함 없음.
- `pnpm test`/`pnpm typecheck` 전체 통과, Playwright로 라이트/다크 테마 확인.

### 2026-08-05 — 레슨 목록/리더 콘텐츠 전면 정리 (10건 사용자 피드백)
- 배경: 사용자가 로컬 서비스를 직접 확인한 뒤 두서없이 남긴 10개 UI 피드백을 정리·확인받아 진행. 상세는 `docs/tasks/lesson-reader-content-refinement/`(spec/plan/tasks/test-result/result) 참고.
- `/lesson` 목록을 가로형 1열 리스트로 재배치, 카드 설명을 `lesson.presentation` 첫 씬 텍스트(hook/paragraph)에서 뽑아 100자로 제한(원문 `bodyHtml` 기반 요약의 제목 중복 버그 해결 겸함), "약 N분" 시간 표시 제거.
- **"완료" 관련 기능 전체 삭제**(사용자 명시: "체크 및 표시는 다 삭제하는 걸로 하자") — `lessonProgress.ts`의 `completedLessonSlugs`/`markLessonCompleted`, 목록 카드 "완료" 뱃지, 레슨 리더 마지막 씬의 "레슨 완료" 버튼 라벨을 전부 제거하고 항상 "다음"으로 고정("이어서 학습하기"용 `lastLessonSlug`/`lastSceneId`는 유지).
- "대본" 섹션을 "교육 설명"으로 개명, 기본 노출(이전엔 기본 숨김)로 전환하고 탭 제목 + 우측 "숨기기/보기" 버튼으로 재구성.
- narration(교육 설명 원문)이 문장 구분 없이 한 덩어리였던 것을 문장 단위 여러 `<p>`로 분리하는 로직을 `lessonPresentation.ts`에 추가.
- `transitionToNext` 안내를 본문 강조 배너에서 화면 우측 하단 고정 카드로 이동, 진행률 카운터를 상단바에서 하단 풋터(이전/다음 버튼 사이)로 이동, 씬 타이틀 폰트 축소 및 전체 세로 간격 확대, "학습 흐름" 드로어 리스트 간격 축소.
- Codex 비판 리뷰에서 **3건 확인 및 즉시 수정**: (1) narration 문장 분리 정규식이 소수점/공백 없는 구두점에서 텍스트를 유실하던 버그 → 문자 단위 스캔 방식으로 교체, (2) 목록 카드 설명이 첫 씬에 텍스트 블록이 없으면(customHtml만 있는 경우) 빈 값이 되던 문제 → `lesson.summary` 폴백 추가, (3) 우측 하단 고정 배너가 하단 바보다 z-index가 낮아 safe-area/줄바꿈 시 가려질 수 있던 문제 → z-index 상향 및 safe-area 고려 `bottom` 계산으로 수정.
- `pnpm test`/`pnpm typecheck` 전체 통과, Playwright로 라이트/다크 테마 모두 실제 화면 확인.

### 2026-08-05 — 레슨 리더 UI 정리 (카운터 단일화 / 이전 버튼 대비 / 학습 흐름 중복 제거)
- 배경: 참고 사이트(sfood-ai-education.leedh84.chatgpt.site) vs 실 앱 Playwright 비교 분석 리포트를 본 사용자가 3건 피드백. 상세는 `docs/tasks/lesson-reader-ui-cleanup/`(spec/plan/tasks/test-result/result) 참고.
- 상단 "이 레슨 X/Y · 전체 X/Y" 이중 카운터 → `globalPosition` 있으면 "전체 X/Y" 하나만, 없으면 "이 레슨 X/Y" 하나만 표시(참고 사이트의 단일 카운터 스타일에 맞춤, 레이블 없이 숫자만).
- `.lesson-reader-nav-button`("이전" 버튼)이 배경(`bg-card-bg`)과 부모(`bg-panel-bg`)가 같은 색이라 안 보이던 문제 — `bg-card-hover-bg`로 배경 대비 확보.
- "학습 흐름" 드로어에서 레슨 제목 줄("제목 + 약 N분")과 그 아래 씬 목록 제목이 중복 표시되던 것(레슨:씬 1:1 구조라 완전히 같은 텍스트가 두 번 나옴) — 레슨 제목 줄 제거, 챕터 헤더 아래 씬 버튼(제목만)만 남김. 다중 씬 레슨이 생기면 레슨 경계 표시가 없어지는 트레이드오프는 사용자 확인 후 허용.
- Codex 비판 리뷰 반영: 레이블 제거는 참고 사이트 스타일에 맞춘 의도된 결정으로 유지, 테스트에는 레슨 제목/시간 표시 "부재" 검증과 카운터 단일 개수 검증을 추가.
- `pnpm test`/`pnpm typecheck` 통과, Playwright로 라이트/다크 테마 모두 실제 화면 확인.

### 2026-08-05 — 레슨 콘텐츠 스키마 전면 마이그레이션 (`lesson.presentation` Content Property + `wiki.metadata` 평탄화)
- 배경: 사용자가 "문서는 18개인데 보이는 건 왜 7개일까?"라고 질문 → 실 Confluence 데이터를 REST API로 직접 조회해 조사한 결과, 콘텐츠 관리 에이전트가 저작 방식을 완전히 바꿨음을 발견. `wiki.metadata`가 중첩 `course:{courseId,order}`/`next` 체인에서 평탄화된 `courseId`/`order`/`chapter`/`estimatedMinutes`/`learningObjectives`/`lastReviewedAt` 필드로 바뀌었고, 진짜 학습 콘텐츠(Scene/블록/내레이션/모션/인터랙션/전환 문구)는 `bodyHtml`이 아니라 완전히 별도인 `lesson.presentation` Content Property(JSON)에 있었음. 사용자가 제공한 참고 사이트(sfood-ai-education.leedh84.chatgpt.site)가 정확히 이 스키마를 렌더링하는 것으로 확인.
- 사용자 확인 후(정식 spec.md/plan.md 작성 → 승인) 레슨 읽기·렌더링 파이프라인 전체를 재작성 — 상세 내역은 `docs/tasks/lesson-presentation-schema-migration/`(spec/plan/tasks/test-result/result) 참고. 핵심 변경:
  - 코스 순서는 `courseId`+`order`로만 결정(레거시 `next` 체인 폴백 완전 제거, 사용자 확인).
  - 기존 H2 헤딩 기반 `bodyHtml` 파서(`lessonScenes.ts`)를 완전히 삭제 — 실 콘텐츠 23개 전부 새 스키마 사용 확인됨. 대체: 신규 `lessonPresentation.ts` 컴파일러.
  - `lesson.presentation`의 `blocks[]`(hook/explanation/example/visual)를 새 `SemanticBlock` variant(`hookStatement`/`exampleNote`/`customHtml`+`css`)로 매핑, `transitionToNext`를 Scene 하단 배너로 노출.
  - 참고 사이트 실측 결과 `reveal: "manual"`이 있어도 클릭 게이팅 없이 Scene 진입 즉시 전체가 보임을 확인 — Task #25의 Reveal 클릭 게이팅 상태 기계를 신규 스키마에 연결하지 않기로 결정(spec.md를 이 발견에 맞춰 구현 중 수정), 관련 코드 제거.
  - 학습 흐름 드로어에 `chapter` 그룹 헤더 추가.
- **Codex 비판 리뷰에서 Critical 버그 1건 발견·수정**: `wikiDataSource.ts`(브라우저가 `/api/wiki-pages` JSON을 다시 검증하는 별도 계층)가 `presentation`과 평탄화된 `wiki.metadata` 필드를 전혀 읽지 않고 있었음 — `confluenceClient.ts`(서버 측 원본 Confluence 파싱)만 고치고 이 두 번째 재검증 계층을 놓쳐서, 스냅샷 모드에서는 정상 동작하지만 실제 앱 사용(remote 모드) 시 모든 레슨이 조용히 사라지는 상태였음. 파싱 로직(`readLessonPresentationValue` 등)을 `lessonSemanticBlocks.ts`로 옮겨 두 파일이 공유하도록 재작성해 같은 종류의 재발을 구조적으로 방지. Medium 3건도 함께 수정: `CustomHtmlDiagramBlock`의 `css` prop이 `</style` 시퀀스로 sandbox iframe의 style 태그를 조기 종료시킬 수 있는 문제(零폭 문자로 방어), 블록이 `order` 필드가 아니라 배열 순서로 렌더링되는 문제(정렬 추가), `wiki.metadata.order`가 소수를 허용하는 문제(`Number.isInteger` 검증 추가).
- 검증: `pnpm typecheck`/`pnpm test` 전체 통과(wiki-core 255, apps/web 180, mcp-server 42, edge-sidebar 23, serverless 21 — 회귀 없음). Playwright로 snapshot 모드(신규 스키마 픽스처)와 **remote 모드(실 Confluence 23개 레슨)** 양쪽 확인 — remote 모드에서 "23개 레슨 · 23개 장면 · 약 115분" 정상 노출, 레슨 1 상세 화면이 참고 사이트의 동일 레슨과 텍스트·구조 거의 동일하게 렌더링됨을 라이트/다크 + 데스크톱/모바일에서 확인.
- Open Gaps: `ContextWindowVisual`/`HotspotVisual`(Task #25/#28)이 새 스키마에서는 트리거 경로가 없어 죽은 코드가 됨(삭제 여부 미결정) — `motion`/`interaction`은 캡처만 하고 진입 애니메이션으로 렌더링하지 않음(iframe 경계 문제로 후속 설계 필요) — Knowledge Check 블록 kind는 새 스키마 실측 데이터에 없어 매핑 경로가 없음.
- 후속 조치(같은 날): 사용자가 "출처 패널이 무엇인지" 재질문 → 실 23개 레슨 데이터 + 참고 사이트를 재확인한 결과 링크(`<a>`, `http(s)://`)가 어디에도 없음을 확인, 이 기능이 실 콘텐츠나 참고 사이트가 애초에 쓰지 않던 기능이었음을 설명 후 사용자 확인을 받아 Reference Panel(Task #26, `ReferencePanel.tsx`/`.test.tsx` + `LessonReaderPage.tsx`의 `handleSceneContentClick`/관련 상태/CSS) 전체 삭제. `pnpm typecheck`/`pnpm test` 재확인(apps/web 173개로 감소, 그 외 회귀 없음).
- 후속 조치(같은 날, 2차): 사용자가 "안 쓰는 것, 죽은 것 다 삭제해줘. 클린한 코드를 유지해야 해"라고 요청 → 전면 죽은 코드 감사 수행. `ContextWindowVisual`/`HotspotVisual`(Task #25/#28) 컴포넌트+테스트+CSS 삭제, `SceneVisual`/`HotspotPoint` 타입 삭제. 감사 과정에서 더 큰 죽은 코드를 추가로 발견: `lessonScenes.ts`(H2 파서, 이미 삭제됨)의 유일한 호출자가 없어져 `lessonSemanticBlocks.ts`의 `compileSceneBlocks`/`inferSceneTypeAndLayout`(정규식 기반 HTML→SemanticBlock 컴파일러 전체, ~320줄)가 완전히 도달 불가능한 상태였음 — 삭제. 이로 인해 다시는 생성될 수 없는 `SemanticBlock` variant(`bullets`/`steps`/`comparison`/`callout`/`image`/`knowledgeCheck`/`unsupported`) 및 관련 렌더 컴포넌트(`ImageBlock`/`KnowledgeCheckBlock`)/CSS/진단 코드(`missing_image_alt`/`unsupported_block_rendered`)/관측 이벤트(`asset_load_failure`)까지 연쇄적으로 삭제. `KnowledgeCheckScene.tsx` 등 Scene 타입 컴포넌트는 `SceneType` enum이 여전히 허용하는 값의 라우팅 타깃이라 삭제하지 않음(구분 기준을 result.md에 명시). `pnpm typecheck`/`pnpm test` 전체 재확인(wiki-core 224개, apps/web 158개로 감소, 그 외 회귀 없음), snapshot 모드 Playwright로 콘솔 에러 없이 정상 렌더링 재확인.

### 2026-07-31 — Lesson Reader 레이아웃을 온라인 강의 플레이어 스타일로 재구성
- 배경: 앞선 잔여 갭 12건 완료 보고 후, 사용자가 "설계에 교육 시스템의 UI/UX에 대한 내용이 없었나?"라고 재확인 — 설계서 재조사 결과 "시각 시스템"(의미 색상 토큰) 섹션은 발견했으나, 사용자가 "디자인 토큰은 SFOOD 디자인 시스템 기준, 설계서 토큰은 생성하지 말라"고 명확히 선을 긋고, 대신 "화면이 화면 가운데에 작은 규모로 떠 있어 교육 시스템 느낌이 전혀 없다"며 레이아웃/폰트 크기/배치만 온라인 강의 플레이어(Coursera/Udemy/Khan Academy 등) 벤치마킹으로 재구성해 달라고 요청.
- 진단: `LessonReaderPage`가 전역 `SiteHeader` 아래에 레슨 전용 헤더를 또 얹고, 콘텐츠는 `max-w-3xl`(768px) 블록을 화면 안에서 `justify-center`로 수직 중앙 정렬 — 화면 가운데 작은 카드가 떠 있는 느낌. 하단 컨트롤도 콘텐츠 블록 안의 인라인 버튼 2개뿐, 화면 폭을 가로지르는 바가 아니었음.
- 구현(레이아웃/타이포그래피만, 색상 토큰 불변):
  - 3단 구조로 재구성 — `.lesson-reader-topbar`(전체 폭 sticky 상단 바, 안에 뒤로가기/이중 진행률/학습 흐름 버튼 + 얇은 진행률 바 신규 추가) / `.lesson-reader-content`(상단 정렬, 폭 확대 `max-w-4xl`~`lg:max-w-5xl`) / `.lesson-reader-bottombar`(전체 폭 sticky 하단 바, 이전/다음 버튼).
  - 진행률 바(`.lesson-reader-progress-track`/`-fill`) 신규 — 과정 전체 위치가 있으면 그 기준, 없으면 레슨 내 위치로 폭 계산.
  - Scene 제목 크기를 본문과 거의 같던 `clamp(19px, 4vw, 26px)`에서 `clamp(26px, 3.4vw, 40px)` + `font-bold`로 확대해 제목/본문 위계를 뚜렷하게 분리(가독성 목적으로 설계서의 `clamp(36px, 3.2vw, 64px)`보다는 보수적으로 조정).
  - 본문 텍스트를 15px→17px/leading-8로, 하단 버튼을 좀 더 큰 터치 타깃(px-5 py-2.5, 14px)으로 확대.
- Reference Panel/Reveal 상태 기계 등 기존 인터랙션 로직은 무수정, 클래스명(`lesson-reader-progress-item` 등 테스트가 의존하는 것)도 유지 — 회귀 없이 구조만 재배치.
- 검증: `pnpm typecheck`/`pnpm test` 전체 통과(wiki-core 250/apps-web 181, 회귀 없음). Playwright로 데스크톱(1440x900)/모바일(390x844) + 라이트·다크에서 상단 바/진행률 바/하단 고정 바/제목·본문 크기/비교 표 오버플로우 여부까지 확인.
- Open: `/lesson` 인덱스 페이지(코스 로드맵 카드형)는 이번 스코프에서 다루지 않음 — 사용자가 지목한 화면은 `/lesson/:slug` 리더였음.

### 2026-07-31 — Lesson Player 설계서 재검토 후 잔여 갭 12건(#17~#28) 전체 구현
- 배경: 사용자가 "남은 개발 작업이 없어? docs 설계 문서 읽고 다시 검토 해줘"라고 요청 — `docs/prd/lesson-player-design.md` 전체를 실제 코드와 다시 대조해 15개 항목 갭 감사를 제시. 이후 우선순위 확인을 위해 다시 질문하자 사용자가 "내가 개발을 다 진행하고 알림을 주라고 했는데 왜 자꾸 멈추는 거지?"라며 전체를 중단 없이 계속 진행하고 완료 시에만 보고하라는 지시를 명확히 함 — 이후 모든 하위 작업을 태스크 도구(Task/TaskUpdate)로만 추적하고 사용자 재확인 없이 연속 실행(spec.md/plan.md 등 정식 태스크 문서화는 시간상 생략, 이 항목에 그 사실을 명시).
- 완료된 12개 항목, 각각 구현 + 유닛/통합 테스트 + Codex(read-only sandbox) 비판 리뷰 + Playwright 실브라우저 검증(임시 snapshot 모드 dev 서버, 작업 후 정리) 순서로 처리:
  1. **진단 시스템**(`lessonDiagnostics.ts` 신규) — `validateLesson()`이 중복 sceneId/빈 Scene/이미지 alt 누락/Scene 15개 초과 등을 Error/Warning/Info로 분류, 콘솔 로그 + `?diagnostics=1` 시 화면 패널 노출.
  2. **반응형 레이아웃** — 태블릿/모바일 브레이크포인트, `clamp()` 기반 제목 폰트, `env(safe-area-inset-bottom)`.
  3. **포커스 접근성** — Scene 전환마다 `<h1>` 제목으로 포커스 이동, `sr-only aria-live="polite"` 위치 안내.
  4. **Knowledge Check 정답 로직** — 콘텐츠 저작 관례로 평문 "정답" 접두어(모든 태그 제거 후 판정) + 첫 번째 ` — ` 구분자로 이유 분리, 이유를 정답 여부보다 먼저 표시, 정답이 없어도 다음 이동 허용.
  5. **키보드 단축키 확장** — Space/Shift+Space/PageUp/PageDown/Home/End/M, 입력 필드·버튼 포커스 시 가로채지 않음.
  6. **터치 스와이프**(`useLessonSwipeNavigation.ts` 신규) — 48px 최소 수평/60px 최대 수직 편차, `iframe`/`data-lesson-swipe-ignore` 제외.
  7. **이미지 alt 필수화 + fallback** — `SemanticBlock`의 image variant에 `altMissing` 추가, 로드 실패 시 alt 텍스트 카드로 대체.
  8. **휠 임계치 분리** — 첫 이벤트의 `deltaY` 크기로 마우스(80)/트랙패드(120) 휴리스틱 분리.
  9. **Reveal 상태 기계** — `presentation.scenes[].reveal: "manual"` 옵트인 필드 신규(타입 체인 전체: `lessonScenes.ts`/`wikiDocuments.ts`/`confluenceClient.ts`), NEXT/PREVIOUS 정책에 따라 Scene 안에서 블록을 단계적으로 공개.
  10. **Reference Panel**(`ReferencePanel.tsx` 신규) — 본문 내 링크 클릭 시 레슨을 벗어나지 않고 슬라이드 패널에서 미리 보여줌(포커스 트랩은 기존 `LessonOutlineDrawer` 패턴 재사용), 열려 있는 동안 휠/스와이프/키보드 탐색 중지.
  11. **관측성 이벤트**(`lessonAnalytics.ts` 신규) — 설계서의 8개 이벤트명(`lesson_load_success/failure`, `scene_view`, `scene_navigation_blocked`, `unsupported_block_rendered`, `content_overflow_detected`, `asset_load_failure`, `progress_recovered`)을 `console.debug` 기반으로 기록.
  12. **Screenshot Hotspot**(`HotspotVisual.tsx` 신규) — `SceneVisual`에 `hotspots` variant 추가(이미지 + 포인트 배열), 마커 클릭/키보드(Tab+Enter)로 확대(같은 zoom-layer에 이미지+마커를 묶어 확대해도 정렬 유지)+설명 교체, 우하단 미니맵으로 원본 윤곽 유지.
- Codex 크리티컬 리뷰에서 발견해 수정한 주요 이슈: (1) Knowledge Check 정답 마커가 `<strong>정답</strong>` 정확 일치만 인식해 `<b>`/중첩 span에서 실패 → 태그 제거 후 평문 판정으로 수정, 두 번째 em-dash를 포함한 이유 텍스트가 잘리는 버그도 `parts.slice(1).join(" — ")`로 수정. (2) `CustomHtmlDiagramBlock`의 sandbox iframe이 모바일 스와이프의 "죽은 영역"이 되는 문제 → 투명 오버레이 div로 터치를 가로채도록 수정. (3) Reference Panel 링크가 `javascript:` 등 위험 프로토콜을 그대로 열 수 있는 위험 → `http(s):`/`mailto:` 화이트리스트 검증 추가, 포커스 복귀 로직 누락도 수정. (4) Hotspot 포인트 좌표(x/y)가 범위 검증 없이 통과되고 일부만 잘못돼도 조용히 필터링되어 번호가 저작 라벨과 어긋나는 문제 → 0~100 범위 검증 + 하나라도 잘못되면 전체 visual을 버리도록 수정. (5) Hotspot 확대 시 마커가 이미지와 함께 이동하지 않아 어긋나는 문제 → 이미지+마커를 단일 `zoom-layer`로 묶어 함께 변환하도록 수정. (6) Hotspot 이미지에 로드 실패 fallback이 없던 문제 → 기존 `ImageBlock`과 동일한 패턴으로 추가.
- 알려진 한계로 남기고 수정하지 않은 것(설계서 자체도 "권장 초기값"이라고 명시하거나, 실질적 대안이 없는 항목): 마우스 휠 임계치 휴리스틱은 OS의 "부드러운 스크롤" 마우스 설정과 완전히 구분할 수 없음. Scene 전환 포커스 이동에 비동기 로딩/딥링크 레이스가 겹치는 극히 드문 경우 포커스가 두 번 옮겨질 수 있음. Hotspot 미니맵은 `aria-hidden`이라 스크린리더 사용자는 시각적 위치 정보(사분면 등)를 별도로 듣지 못함(레이블/설명 텍스트는 동일하게 제공됨).
- 검증: `pnpm -r typecheck`(6개 패키지) 통과, `pnpm -r test` 전체 통과(wiki-core 250, apps/web 181, mcp-server 42, edge-sidebar 23, serverless 21 — 회귀 없음). Playwright로 Reveal/Reference Panel/Screenshot Hotspot 각각 임시 snapshot 모드 dev 서버(포트 5199)에서 실브라우저 확인 후 정리(스크린샷/서버 종료).
- `confluenceSnapshots.ts`에 데모/회귀 픽스처 3건 추가(영구 유지, 모두 opt-in 필드라 기존 콘텐츠 회귀 없음): "컨텍스트와 기억의 한계" 레슨의 컨텍스트 창 Scene에 `reveal: "manual"`, 본문에 안전한 외부 링크(Reference Panel 데모), 신규 Scene "화면에서 확인하기"(Screenshot Hotspot 데모, 실제 이미지 에셋이 없어 SVG data URI 목업 사용).
- 문서화 부채: 이번 라운드(#17~#28)는 사용자의 "계속 진행" 지시에 따라 `docs/tasks/{scope}/spec.md`~`result.md` 정식 태스크 워크스페이스 없이 Task 도구 추적만으로 진행 — 필요 시 후속 세션에서 사후 문서화 가능.
- Open Gaps(설계서 대비 의도적 미착수, 이번 라운드에서 다루지 않음): ADF 기반 `LessonAst` 컴파일러/Course Manifest 정식 스키마, Backend API/캐시 계층, 여러 Course 간 전환 정책.

### 2026-07-31 — Lesson Player 설계서 구현 계속: Slice 2~4(나머지 Scene Type, HTML 도식 컴포넌트, Motion, Context Window)
- 배경: Slice 1 완료 후 사용자가 "컨텐츠 관련된 내용 빼고 다 진행해줘"라고 요청하며, 콘텐츠팀이 도식·도형을 HTML+CSS로 제공하기로 했다는 새 정보를 전달. 우선순위(Scene Type → Motion → Interactive → Backend API)를 확인 질문으로 확정한 뒤 순서대로 진행. Backend API는 Slice 1에서 이미 의도적으로 제외한 범위라 최종적으로 진행하지 않기로 재확인(사용자 확정).
- **Slice 2 — 나머지 Scene Type + HTML 도식 공통 컴포넌트** (`docs/tasks/lesson-player-slice-2/`): 설계서의 11개 Scene Type·8개 Layout 전부 지원. 콘텐츠팀이 Confluence "HTML" 매크로로 제공할 도식을 위해 `CustomHtmlDiagramBlock`(sandbox iframe, `allow-scripts` 없음) 신규 구현. Codex 리뷰로 CSP 누락(원격 네트워크 요청 유출 가능), 표 셀 안에 중첩된 HTML 매크로가 조용히 사라지는 문제, misconception/comparison 추론 순서 버그를 발견해 수정 — 스크립트/이벤트 핸들러 삽입 페이로드로 실제 브라우저에서 sandbox 방어를 직접 검증.
- **Slice 3 — Motion(순수 CSS 전환 애니메이션)** (`docs/tasks/lesson-player-slice-3/`): 장면 이동 방향별 진입 애니메이션, `prefers-reduced-motion` 대응, 전환 잠금(빠른 연속 입력 방지). 새 라이브러리 없이 CSS만으로 구현(사용자 확정). Codex 리뷰로 이미 첫/마지막 장면인데 Home/End를 눌러 불필요한 잠금이 걸리는 엣지 케이스 발견·수정.
- **Slice 4 — Interactive 컴포넌트: Context Window** (`docs/tasks/lesson-player-slice-4/`): `wiki.metadata.presentation.scenes[].visual` 필드 신규 추가, AI 컨텍스트 창 한계를 설명하는 고정 개념도(콘텐츠 무관) 구현. Codex 리뷰로 잘못된 `emphasis` 값이 조용히 통과하는 검증 누락과, overflow 강조가 opacity 상속으로 hover 툴팁 대비를 떨어뜨리는 접근성 문제를 발견·수정. Screenshot Hotspot과 Backend API는 사용자 확정으로 이번 범위에서 제외.
- 각 Slice마다 Codex(read-only sandbox) 비판적 리뷰 → 발견된 이슈 수정 → 회귀 테스트 추가 → Playwright 실브라우저 재검증(임시 snapshot 모드 dev 서버, 작업 후 정리) 순서를 반복.
- 검증: `pnpm typecheck`/`pnpm test` 전체 통과(wiki-core 231, apps/web 134, 나머지 워크스페이스 회귀 없음).
- `docs/prd/confluence-metadata.md`에 `presentation.scenes[].visual` 필드와 HTML 매크로 도식 작성 규약을 반영.
- Open Gaps: 실 콘텐츠에 `wiki.metadata.course`/`presentation`/HTML 매크로 도식이 아직 없어 `/lesson` 인덱스는 여전히 레슨 1개만 노출 — 콘텐츠팀 작업 대기 중. Motion의 Reveal(단계별 점진 공개), Screenshot Hotspot 인터랙션, Backend API/캐시 계층은 이번 범위에서 의도적으로 제외.

### 2026-07-31 — Lesson Player 재설계 착수: 렌더링 버그 근본 수정 + Slice 1(Compiler/Scene 도메인 모델/Course Manifest 스텁)
- 배경: 사용자가 "레슨 페이지 내용이 제대로 안 보이고 mermaid 그래프도 깨져 보인다"고 보고 — SFOOD 디자인 스킬로 조사한 결과, 레슨 리더가 원본 Confluence storage HTML을 매크로 정리 없이 `dangerouslySetInnerHTML`로 그대로 렌더링하고 있었음(가이드/페이지가 쓰는 `ArticleContentRenderer` 파이프라인을 타지 않음)을 확인. 이후 사용자가 매우 상세한 "AI 기초교육 Lesson Player 개발 설계 계획서"를 전달, `docs/prd/lesson-player-design.md`로 저장. 설계서의 "권장 첫 번째 구현 Slice"(레슨 1개, H2 Scene 5개, Compiler, 좌우 Player, 키보드·휠, 진도 복구)만 먼저 구현하기로 결정(단계적 적용).
- 태스크 문서: `docs/tasks/lesson-player-slice-1/`(spec/plan/tasks/test-result/result).
- 설계서 대비 의도적 축소(사용자 승인): `lesson.course`/`lesson.presentation`을 별도 Confluence Content Property로 만들지 않고 기존 `wiki.metadata`의 선택적 하위 필드로 접어 넣음(레슨 페이지당 API 호출 횟수를 그대로 유지하기 위함).
- 구현:
  - `lessonSemanticBlocks.ts`(신규, Lesson Compiler) — Confluence 매크로(코드, 콜아웃, Mermaid Forge 다이어그램 확장 등)를 사람이 읽을 수 있는 `SemanticBlock[]`(paragraph/bullets/steps/comparison/callout/image/knowledgeCheck/unsupported)로 변환. Mermaid/원문 코드 블록은 실제 다이어그램 대신 "미리보기 미지원" 안내형 `unsupported` 블록으로 안전 대체(원본 매크로 메타데이터 노출 버그의 근본 수정).
  - Scene 도메인 모델: 5개 Scene Type × 4개 Layout, `wiki.metadata.presentation.scenes[]` 명시 우선 + 규칙 기반 추론 폴백.
  - `lessonDocuments.ts` — `wiki.metadata.course`(courseId+order)가 있으면 그 순서로, 없으면 기존 `next` 체인 그대로 정렬(레거시 콘텐츠 100% 회귀 없음).
  - `apps/web/src/ui/pages/lessonScenes/` 신규 — `SceneRenderer` + 5개 Scene 컴포넌트, 원본 HTML 직접 주입 제거.
  - `useLessonWheelNavigation` 신규 — 세로 휠 스크롤을 좌우 장면 이동으로 해석(임계치 누적 + 잠금).
  - `lessonProgress.ts` — 저장 키를 `lastSceneIndex`(number) → `lastSceneId`(anchor 문자열)로 전환, 장면 이동 시 URL `?scene=` 파라미터도 동기화해 새로고침 후 위치 복구.
- Codex 크리티컬 리뷰에서 6건 발견, 전부 수정: (1) 정규식 기반 블록 분리기가 미인식 태그(예: iframe)를 조용히 삭제 → catch-all로 `unsupported` 보존. (2) Mermaid 확장 감지가 속성 없는 태그만 매칭 → 속성 허용하도록 완화. (3) H2 `id` 속성이 첫 속성이 아니면 유실 → 위치 무관 추출로 수정. (4) `courseId`를 레슨 일부에만 태깅하면 기존 `next` 체인이 예기치 않게 역전 → course/legacy 그룹 간 `next` 교차 참조 시 전체를 레거시 방식으로 폴백하는 가드 추가. (5) Knowledge Check 선택 상태가 다음 장면으로 누수 → Scene을 `${slug}:${scene.id}` 키로 리마운트. (6) 같은 레슨 내 이동 시 URL이 갱신되지 않아 새로고침하면 옛 위치로 복귀 → URL 동기화 추가(단, 레슨 로드 전에는 건드리지 않도록 가드해 딥링크 덮어쓰기 회귀를 자체 발견·수정).
- 검증: `pnpm typecheck`/`pnpm test` 전체 통과(wiki-core 220, apps/web 112, 나머지 워크스페이스 회귀 없음). Playwright로 실제 Mermaid 포함 운영 레슨 페이지를 라이트/다크 테마에서 확인 — 매크로 메타데이터 노출 버그 해소, 딥링크(`?scene=N`)·새로고침 위치 복구 확인.
- Open Gaps: 실 콘텐츠 18개 레슨에는 아직 `wiki.metadata.course`가 없어 `/lesson` 인덱스는 여전히 1개만 노출(콘텐츠팀의 메타데이터 입력 필요). Mermaid는 실제 다이어그램을 그리지 않고 안내 카드로만 대체(후속 Slice 후보). 여러 courseId 간 레슨 전환 경계 미처리(과정이 하나뿐인 현재는 문제 없음). Knowledge Check 정답 판정 미구현.

### 2026-07-30 — Lesson 진행 UI(코스 로드맵/이중 진행률/학습 흐름 드로어) — 레퍼런스 사이트 격차 좁히기
- 브랜치: `develop`에서 신규 분기한 `feature/lesson-progress-ui`(격리 워크트리, Subagent-Driven Development로 태스크별 구현+2단계 리뷰).
- 배경: 사용자가 동일 목적으로 이미 완성된 레퍼런스 사이트(`https://ai-work-education.leedh84.chatgpt.site/`, 고정 콘텐츠로 만든 사내 AI 교육 사이트)와 1차 Lesson 구현을 비교해 달라고 요청 — Playwright로 레퍼런스 사이트를 직접 열어 홈/장면/학습 흐름 드로어/진행자 도우미 패널까지 확인한 뒤, 격차를 4개 영역(Scene 시각 컴포넌트/진행 UI/진행자 도우미/모션)으로 분류해 보고. 사용자가 "진행 UI"부터 좁히기로 확정, 콘텐츠는 계속 관리 에이전트가 만드는 중이라는 전제 하에 진행. 브레인스토밍으로 레이아웃 지정 방식(Confluence 본문 관례 패턴 유지), 예상 시간 산정 방식(장면 수 기반 자동 계산), 시각 스타일(기존 SFOOD 토큰 유지, 레이아웃 구조만 참고), 인덱스/드로어 역할 분리를 확정 후 설계 문서(`docs/superpowers/specs/2026-07-30-lesson-progress-ui-design.md`) 승인, 계획(`docs/superpowers/plans/2026-07-30-lesson-progress-ui.md`) 작성.
- 구현(Task 0-4, 각 태스크마다 spec-compliance + code-quality 2단계 subagent 리뷰):
  - `packages/wiki-core`: `courseOutline.ts` — `buildCourseOutline`(레슨×장면 트리, 레슨별 예상 소요시간 = 장면수×1.5분), `getGlobalScenePosition`(특정 장면의 코스 전체 내 1-based 위치). 기존 `listLessonDocumentsFrom`/`splitLessonContentIntoScenes` 재사용, 신규 스키마 필드 없음.
  - `/lesson` 인덱스 → 코스 로드맵 그리드(통계 라인 + 2열 카드: 순번/제목/요약/예상시간/완료 배지).
  - `/lesson/:slug` 리더 헤더에 "이 레슨"/"전체" 이중 진행률 추가.
  - `LessonOutlineDrawer` 신규 — 이 코드베이스 최초의 접근성 모달/드로어 컴포넌트(라이브러리 없이 포커스 트랩·ESC/배경 클릭 닫기·body 스크롤 잠금·포커스 복귀 직접 구현), "학습 흐름" 버튼으로 열어 전체 레슨×장면 트리에서 장면 클릭 시 즉시 이동(같은 레슨) 또는 라우팅(다른 레슨).
- Task 3 구현 중 실제 테스트 실행에서 발견한 문제: 이중 진행률 도입으로 단일 레슨 픽스처에서 "이 레슨"과 "전체" 표시가 같은 숫자를 렌더링해 기존 4개 테스트의 `getByText` 쿼리가 모호해짐 — 사용자 승인 없이 임의로 마크업을 바꾸지 않고 즉시 보고, 승인 받은 뒤 해당 4개 테스트의 쿼리를 `이 레슨` 라벨 기준으로 스코프를 좁히는 방식으로 해결(테스트가 검증하는 동작 자체는 변경 없음).
- Codex 크리티컬 리뷰(6c)에서 2건 발견, 1건 수정: (1) 포커스 트랩이 "포커스가 이미 첫/마지막 요소에 있을 때"만 감지해, 포커스가 패널 밖으로 벗어나면 Tab이 트랩을 무시할 수 있는 접근성 결함 → `panelRef.current.contains(document.activeElement)` 가드 추가로 즉시 재포획하도록 수정, 회귀 테스트 2건 추가. (2) `next` 체인이 끊긴 레슨은 슬러그 직접 조회(`getLessonDocumentFrom`)로는 리더에 정상 표시되지만 체인 순회 기반 `buildCourseOutline`에서는 조용히 누락되어 코스 개요·이중 진행률·드로어에서 빠질 수 있는 엣지 케이스 → 코드는 이미 크래시 없이 안전하게 처리 중이라 알려진 한계로 문서화(콘텐츠 저작 시 `next` 체인 연결 필요, 근본 해결은 후속 Course Manifest 설계 영역).
- 검증: `pnpm -r typecheck`(5개 패키지)/`pnpm -r test`(wiki-core 201, web 101, mcp-server 42, edge-sidebar 23, serverless 21 — 전부 통과)/`pnpm --filter @sfood/web build` 통과. Playwright로 코스 로드맵, 이중 진행률, 드로어 열기/장면 이동(같은 레슨·다른 레슨)/ESC·배경 클릭 닫힘/포커스 복귀를 라이트·다크 + 데스크톱(1280)·모바일(390)에서 확인, 레퍼런스 사이트와 구조적 유사도 비교.
- 제외 범위(설계 문서에 명시, 사용자 승인): Scene 시각 컴포넌트(카드형 비교, 노드 다이어그램), 진행자 도우미 4단 구조, 모션/전환 애니메이션, 홈 화면 진입 카드 변경, 레퍼런스 색상/브랜드 채택 — 전부 후속 세션 범위.
- 태스크 문서: `docs/tasks/lesson-progress-ui/`(spec/plan/tasks/test-result/result).

### 2026-07-30 — Lesson 기능, 실제 Confluence 콘텐츠로 재검증 후 대본 파싱 확장 (당일 후속)
- 브랜치: `develop`(머지 완료 후 바로 이어서 작업, 격리 워크트리 없이 직접 진행 — 작고 독립적인 파서 수정이라 판단).
- 배경: 사용자가 `pnpm dev`로 5184 포트를 띄워 화면을 직접 보다가 "문서 기준으로 구현이 맞는지" 검토를 요청. 확인 결과 로컬 dev 서버가 `.env.local`의 Confluence 자격증명으로 인해 자동으로 `remote` 모드(기존 vite.config.ts 로직, 이번 세션 이전부터 존재)로 동작해 실제 Confluence 데이터를 쓰고 있었고, 실제 공간에는 아직 `docType: "lesson"` 문서가 없어 홈 진입 카드가 정상적으로 숨겨진 것(버그 아님)임을 확인·설명. 이후 사용자가 실제 Confluence에 레슨 페이지 1개(page ID `183238731`)를 작성했다고 알려와 실 데이터로 재검증 진행.
- 발견 및 조치:
  1. 새 페이지에 `wiki.metadata` Content Property가 전혀 없어(`missing_metadata`) 앱에서 완전히 제외되고 있었음 — 사용자 승인 하에 Confluence Content Property API로 `docType: "lesson"` 등 필수 필드를 직접 추가(코드 문제 아님, 콘텐츠 메타데이터 누락).
  2. 메타데이터 추가 후 홈→목록→리더 전체 플로우가 실제 데이터로 정상 동작 확인.
  3. **실제 저자가 대본을 Confluence Expand 매크로가 아니라 `<blockquote><strong>나레이션:</strong>...</blockquote>` 형태의 평범한 인용구로 작성하는 관례를 쓰고 있어**, 기존 파서(Expand 매크로만 인식)로는 대본이 전혀 숨겨지지 않고 노출되는 문제를 발견 — 사용자 승인 하에 `packages/wiki-core/src/lib/lessonScenes.ts`의 `splitLessonContentIntoScenes`를 확장해 `나레이션:` 라벨 blockquote도 숨겨진 대본으로 인식하도록 수정(TDD, 회귀 테스트 추가).
  4. 수정 과정에서 정규식이 `</blockquote>` 경계를 넘어 앞선 hook blockquote까지 통째로 삼켜버리는 버그를 실제 화면 스크린샷으로 발견 — 이 시나리오를 재현하는 회귀 테스트를 추가하고 negative lookahead로 경계를 고정해 해결.
- 검증: `pnpm -r typecheck`/`pnpm -r test`(wiki-core 195개, 전체 패키지 통과) 통과. Playwright로 실제 레슨 페이지의 4개 장면 전체를 순회하며 hook/목록/시각 자료는 노출, 대본만 토글 뒤에 숨겨짐을 최종 확인.
- 커밋: `06efa77`("Recognize 나레이션-labeled blockquotes as hidden scene scripts").
- 태스크 문서 갱신: `docs/tasks/lesson-entry-and-progress/result.md`/`test-result.md`.

### 2026-07-30 — Lesson(AI 기초교육) 진입점, docType 격리, 학습 진도(localStorage) 신규 구현
- 브랜치: `develop`에서 신규 분기한 `feature/lesson-entry-and-progress`(격리 워크트리 `.worktrees/feature-lesson-entry-and-progress`에서 작업, Subagent-Driven Development로 태스크별 구현+2단계 리뷰 수행).
- 배경: 사용자가 홈 화면에 AI 기초교육(Lesson) 진입 경로가 없다는 점, Confluence에 `docType: "lesson"`이 신규 도입될 예정이며 검색/가이드/페이지 노출에 영향이 없어야 한다는 점, 계정 시스템이 없어 학습 진도는 브라우저 저장(이어서 학습하기)이 필요하다는 점을 전달 — 브레인스토밍으로 3가지 구현 범위(A: 세로 리더 재사용, B: 설계문서 전체 1차 Slice, C: 단순화된 좌우 Player)를 제시해 C안으로 확정, 이후 대본(스크립트) 토글 요구사항을 추가로 확인해 설계 문서(`docs/superpowers/specs/2026-07-30-lesson-entry-and-progress-design.md`) 승인 후 계획(`docs/superpowers/plans/2026-07-30-lesson-entry-and-progress.md`) 작성.
- 구현(Task 0-8, 각 태스크마다 spec-compliance + code-quality 2단계 subagent 리뷰):
  - `docType: "lesson"`을 `WikiDocument`/`RawConfluencePage` 유니온에 추가 — `getWikiDocumentSection()`의 기존 `null` 기본 분기를 그대로 활용해 검색·가이드·페이지·라이브러리·홈 추천 가이드에서 자동 격리(신규 분기 추가 없음). `docs/prd/confluence-metadata.md`/`CLAUDE.md` Frozen 표에 `lesson` 항목 문서화.
  - `packages/wiki-core`: `lessonDocuments.ts`(`listLessonDocumentsFrom`/`getLessonDocumentFrom`/`getNextLessonSlugFrom` — 신규 필드 없이 기존 `metadata.next` 체인으로 순서 도출), `lessonScenes.ts`(`splitLessonContentIntoScenes` — H2 헤딩 기준 장면 분리 + Confluence Expand 매크로 → 장면별 숨김 "대본" 추출).
  - `confluenceSnapshots.ts`에 레슨 픽스처 2건(각 2개 장면, Expand 매크로 대본 포함) 추가 — 실제 Confluence Lesson 콘텐츠는 아직 없어 스냅샷으로 개발.
  - `apps/web/src/data/lessonProgress.ts` — `localStorage` 기반 진도 저장(`lesson-progress:{courseId}`, 완료 레슨 목록·마지막 위치), 손상된 데이터는 무시하고 폴백.
  - 홈 하단 진입 카드(`LessonEntrySection`, 레슨 문서 존재 시에만 노출) → `/lesson` 인덱스 페이지(레슨 목록, 이어서 학습하기/학습 시작하기) → `/lesson/:slug` 좌우 전환 리더(키보드 방향키·버튼, 장면별 대본 토글, 마지막 장면 완료 시 다음 레슨 자동 이동 및 진도 기록).
- Playwright 실사용 검증 중 발견 및 수정한 버그: (1) 레슨 완료 후 다음 레슨 자동 이동 시 React Router가 동일 라우트(`/lesson/:slug`) 컴포넌트를 리마운트하지 않아 장면 인덱스가 초기화되지 않는 문제 — `slug` 변경 시 재계산하는 effect 추가로 수정. (2) 리더 화면의 과도한 빈 공간(레이아웃 어색함) — 콘텐츠+컨트롤을 단일 블록으로 수직 중앙 정렬하도록 CSS 수정.
- Codex 크리티컬 리뷰(6c)에서 5건 발견, 4건 수정: (1) `wikiDataSource.ts`의 remote 로딩 허용 목록에 `lesson` 누락(실 Confluence 연동 시 전부 유실) → 추가. (2) 비동기 문서 로딩 완료 전 `?scene=` 딥링크 진입 시 파라미터 무시 레이스 → effect 의존성에 `scenes.length` 추가. (3) 정수가 아닌 `?scene=` 값(`0.5` 등)으로 인한 크래시 가능성 → `clampSceneIndex`에 정수/유한값 가드 추가. (4) 진도 데이터의 `lastSceneIndex`/`completedLessonSlugs` 원소 타입 검증 미흡 → 검증 강화. (5) Expand 매크로 내부에 `<h2>`가 있으면 장면 경계로 오인식될 수 있는 정규식 파서의 구조적 한계는 이번 스코프에서 수정하지 않고 알려진 갭으로 문서화(현재 픽스처는 해당 패턴 미사용).
- 검증: `pnpm -r typecheck`(5개 패키지)/`pnpm -r test`(wiki-core 192, web 86, mcp-server 42, edge-sidebar 23, serverless 21 — 전부 통과)/`pnpm --filter @sfood/web build` 통과. Playwright로 홈→목록→리더 전체 플로우, 키보드 내비게이션, 대본 토글, 새로고침 후 진도 복구, 검색/가이드/페이지 비노출을 라이트·다크 + 데스크톱(1280)·모바일(390)에서 확인.
- 제외 범위(설계 문서에 명시, 사용자 승인): ADF 기반 Lesson Compiler·`LessonAst`·Content Property 스키마, Motion Preset, 휠/스와이프 탐색, Knowledge Check 등 인터랙티브 컴포넌트, Confluence 실연동, 다중 Course 관리 — 전부 후속 세션 범위.
- 태스크 문서: `docs/tasks/lesson-entry-and-progress/`(spec/plan/tasks/test-result/result).

### 2026-07-27 — AWS 배포(S3+CloudFront+Lambda) 워크플로우, AI 질문/검색 로직 wiki-core 추출
- 브랜치: `feature/sfood-design-system-tone`(동일 브랜치에서 계속).
- 배경: 사용자가 S3/CloudFront 배포 + GitHub Actions 자동배포를 요청. 3차례 명확화 문답을 거쳐 최종 스코프 확정 — AI 질문/검색은 메인 기능이라 반드시 실사용 가능해야 함(Lambda로 신규 배포), Projects/GitHub 연동은 배제 및 숨김, Lambda는 1회성 신규 생성, OpenAI 키는 기존 값 재사용.
- 구현: `apps/web/vite.config.ts`의 `/api/wiki/ai/ask`·`/api/wiki/ai/search` dev 미들웨어 로직(~530줄)을 `packages/wiki-core/src/lib/aiOrchestration.ts`의 트랜스포트-비의존 함수(`handleAiAskRequest`/`handleAiSearchRequest`)로 추출 — `architecture.md`의 "Frontend-First Runtime Policy"를 그대로 따름. `vite.config.ts`는 이 함수를 호출하는 얇은 어댑터로 축소(로컬 dev 동작 불변, 실제 Confluence/OpenAI 자격증명으로 라이브 스모크 테스트 확인). `packages/serverless`에 `aiAskHandler`/`aiSearchHandler` Lambda 핸들러 2개 신규 추가(기존 `wikiPagesHandler` 유지) + esbuild 빌드 스크립트/3개 엔트리포인트. `.github/workflows/deploy.yml` 신규 — S3 동기화+CloudFront invalidation, 3개 Lambda 코드 업데이트, 액세스 키 시크릿 인증. 배포된 정적 사이트가 실제 Lambda Function URL을 호출하도록 `VITE_AI_ASK_ENDPOINT`/`VITE_AI_SEARCH_ENDPOINT` 빌드타임 env var 추가(구현 중 발견한 갭 — 상대 경로는 dev 전용이라 정적 배포본에서는 동작하지 않았을 것). Projects/GitHub 기능은 grep으로 이미 모든 내비게이션 표면에서 링크가 없음을 확인 — 코드 변경 불필요.
- Codex 크리티컬 리뷰(6c)에서 5건 발견 및 수정: (High) `pnpm-lock.yaml` 미스테이징으로 `--frozen-lockfile` 설치 실패 위험 → 스테이징. (Medium) `vite.config.ts` 어댑터가 원래의 try/catch 에러 응답을 누락 → 복원. (Medium) Lambda 핸들러가 `JSON.parse("null")`을 통과시켜 런타임 에러 위험 → non-null-object 가드 추가 + 회귀 테스트. (Medium) CORS만으로는 비-브라우저 클라이언트 직접 호출을 막지 못함 → 기존 `wikiPagesHandler` 선례와 동일한 것으로 확인, spec.md에 알려진 리스크로 명시. (Low) 빈 문자열 env var일 때 폴백 미적용 → `?.trim() || fallback`으로 수정.
- 검증: `pnpm -r typecheck`/`test`(316개) 통과, `packages/serverless build` 3개 번들 생성 확인, 실제 자격증명으로 `/api/wiki/ai/ask`·`/api/wiki/ai/search` 라이브 스모크 테스트(정상 케이스+에러 케이스 모두)로 추출 무결성 확인. AWS 실제 리소스 생성/첫 배포는 사용자의 AWS 계정이 필요해 이번 세션 범위 밖 — `aws-setup-guide.md`에 1회성 수동 절차로 문서화.
- 태스크 문서: `docs/tasks/aws-static-site-and-ai-api-deployment/`(spec/plan/tasks/test-result/result/aws-setup-guide).

### 2026-07-27 — 가이드 상세 페이지 레이아웃 재구조화 (3차, flex 기반 — TOC/site-shell 완전 분리, 목차 라벨 버그, blueprint 숨김, 접두어 필터 보완)
- 브랜치: `feature/sfood-design-system-tone`(동일 브랜치에서 계속).
- 배경: 직전 두 차례(`docs/tasks/guide-page-toc-sidebar-refresh/`) 모두 `position:fixed`+뷰포트 계산식을 사용해 스크롤바 폭 오차를 반복 유발. 사용자가 "벌써 3번째 반복"이라며 5개 항목(TOC 우측 사이드 패널 재구성, 목차 라벨 스크롤 버그, Ask 버튼 위치, 홈 blueprint 숨김, `[Type]` 접두어 공통 필터)을 정밀하게 재요청, Playwright+Codex 이중 검증을 명시적으로 요구.
- 구현(근본 원인 제거): `ArticlePage`/`StartingGuidePage`를 `CardLayout`(공용 `site-shell`, max-w-6xl) 밖 — `AppLayout`의 직계 자식으로 재배치(`SearchPage`와 동일 선례). 이 전체 폭 위에서 순수 flex 2단 레이아웃(`.guide-detail-shell > .guide-detail-row > .guide-detail-content(flex-1) + .guide-detail-toc(xl:sticky, 고정폭)`)으로 재구성 — 계산식이 전혀 없어 스크롤바 오차가 원천적으로 발생하지 않음. "목차" 라벨을 내부 스크롤 박스 밖의 별도 헤더로 분리해 긴 목차 스크롤 시 라벨이 사라지는 버그를 구조적으로 수정(Playwright로 뷰포트 높이를 좁혀 강제 재현 후 확인). Ask 도크/뒤로가기 버튼은 양쪽 anchor 명시+mx-auto 패턴으로 재계산. 홈 화면 blueprint(`ProjectDesignCta`) 렌더 제거 및 데드 코드/텍스트 헬퍼(`homeContent.ts`) 정리. `[Type]` 접두어 stripping을 문서 내 인라인 링크/그래프 포커스바/정책 출처 링크에 추가 적용(표시 텍스트만, href/매칭 로직 불변).
- Codex 크리티컬 리뷰(라우팅 정확성, flex 박스 모델, sticky 동작, Ask 도크 cascade, 접두어 stripping이 표시 전용인지 전부 확인) — 2건 발견(데드 `.home-blueprint*` CSS, `homeContent.ts`의 검증 헬퍼가 숨겨진 텍스트를 여전히 포함) 즉시 반영.
- 검증: `pnpm test`(web 68/wiki-core 171)/`typecheck`/`build` 통과. Playwright로 1280/1920/800/390px + 라이트·다크, `/guides/map` 라우팅 충돌 없음, 텍스트 선택→질문하기 정상 동작, 홈 blueprint 미노출까지 확인.
- 태스크 문서: `docs/tasks/guide-page-detail-layout-rearchitecture/`(spec/plan/tasks/test-result/result).

### 2026-07-27 — 가이드 페이지 컨텐츠 재중앙정렬(TOC 제외 영역 기준), 뒤로가기 버튼 site-shell 정렬 (2차 재검토 수정)
- 브랜치: `feature/sfood-design-system-tone`(동일 브랜치에서 계속).
- 배경: 바로 이전 항목("TOC 구조적 분리")의 구현을 사용자가 재검토한 결과, TOC를 `xl:fixed`로 분리하면서 컨텐츠가 "TOC 제외 영역"이 아니라 "뷰포트 전체" 기준으로 중앙 정렬되어 버리는 회귀를 지적 — 최초 요청("목차 왼쪽 영역에서 중앙 정렬")과 어긋남. "목록으로 돌아가기" 버튼도 `page-shell`의 추가 패딩 때문에 다른 페이지 컨텐츠 시작 위치와 어긋나 어색하게 떠 보인다는 지적도 함께 받음.
- 구현: `.guide-article-layout`에 `xl:pr-[calc(toc폭+gap)]`을 추가해 컨텐츠 컨테이너 우측에 TOC 자리를 예약, `.article-body`의 `mx-auto`가 TOC 제외 영역에서 자연 중앙 정렬되도록 복원. `.article-aside`/`.article-ask-dock`의 `left` 계산식을 이 오프셋에 맞춰 재도출(세 규칙 상호 일치, Codex가 수식 검증). "목록으로 돌아가기" 버튼을 `page-shell` 밖으로 꺼내 `.site-shell`(모든 라우트가 공유하는 프레임, 신규 `position: relative`)의 직계 자식으로 이동, `.site-shell` 자신의 패딩과 동일한 값(`left-3 top-3 sm:left-5 sm:top-5`)으로 재배치해 다른 페이지 컨텐츠 시작 위치와 픽셀 단위로 일치시킴.
- Codex 크리티컬 리뷰에서 발견: `GuidesPage.tsx`가 TOC 헤딩이 없는 경우에도 `.guide-article-layout`(TOC 공간 예약)을 그대로 써서 존재하지 않는 TOC를 위한 공간이 남는 문제 → `hasToc` 조건부 클래스 적용으로 수정.
- 사용자가 보고한 "TOC 스크롤 다운 후 업 시 텍스트 안 보임" 버그는 프로그램적/시뮬레이션 스크롤, 클릭+스크롤, 라이트/다크 조합으로 재현을 시도했으나 재현하지 못함 — 추가 재현 조건 확인 필요(미해결로 남김, 은폐하지 않고 명시).
- 검증: `pnpm typecheck`/`test`(17 files/68 tests)/`build` 통과. Playwright로 1280/800/390px + 라이트·다크에서 컨텐츠/Ask도크/TOC/뒤로가기 버튼의 실측 좌표가 새 수식과 정확히 일치함을 확인.
- 태스크 문서: `docs/tasks/guide-page-toc-sidebar-refresh/result.md`("추가 수정 (2026-07-27, 2차)" 섹션).

### 2026-07-27 — 가이드 페이지 TOC 구조적 분리(page-shell 밖으로), 검색창 단일 레이어화 (재검토 수정)
- 브랜치: `feature/sfood-design-system-tone`(동일 브랜치에서 계속).
- 배경: 사용자가 같은 날 앞서 완료한 `docs/tasks/guide-page-toc-sidebar-refresh/` 구현을 실제 화면에서 재검토한 뒤, 지시("page-shell에서 목차를 빼라", "검색을 하나의 div로 심플하게")가 문자 그대로 반영되지 않았다고 지적 — 이전 구현은 TOC를 같은 그리드 안에 두고 보더/간격만 추가했고, Ask 패널은 보더만 없앴지 배경색 차이로 인한 "박스 안의 박스"가 남아 있었음. Playwright로 직접 재확인해 두 문제 모두 실제로 남아있음을 검증한 뒤 수정.
- 구현: `.article-aside`(TOC)를 `xl:fixed`로 전환해 `.page-shell`/`.page-width` 컨테이너 밖 좌표계에서 화면 우측에 독립적으로 고정(신규 `.guide-article-layout` 단일 컬럼 그리드 + `--article-content-width` 공유 토큰 기반 `left` 앵커링). `.article-ask-form`의 남은 배경색 차이를 제거해 Ask 패널을 완전한 단일 표면으로 통일. 컨텐츠는 TOC 유무와 무관하게 모든 브레이크포인트에서 뷰포트 정중앙 정렬.
- Codex 크리티컬 리뷰에서 발견: (1) `.article-layout` 클래스가 TOC 없는 `ProjectDetailPage`에도 재사용되고 있어, 그리드 변경이 그 페이지에 의도치 않게 영향을 줄 뻔함 → `.article-layout`(원래 정의로 복원, `ProjectDetailPage` 전용)과 `.guide-article-layout`(신규, TOC 있는 페이지 전용)로 분리. (2) 1280~1300px 부근에서 `fixed` 요소의 `50%` 계산이 스크롤바 거터를 포함한 뷰포트 폭을 참조해 TOC가 실제 컨텐츠 영역보다 몇 px 밖으로 밀려날 수 있음(Playwright로 1280px 실측 7px 확인) → `min()` 클램프로 보정.
- 검증: `pnpm test`(17 files/68 tests)/`typecheck`/`build` 통과. Playwright로 1280px(경계, 클램프 확인)/1920px(클램프 미개입 확인)/800px(태블릿)/390px(모바일) + 라이트·다크 + 스크롤 중 TOC 고정 유지 + `StartingGuidePage` 재확인 + 합성 DOM으로 `.article-layout`(원래 2-컬럼 그리드 복원) 확인.
- 태스크 문서: `docs/tasks/guide-page-toc-sidebar-refresh/result.md`("추가 수정" 섹션).

### 2026-07-27 — 가이드 문서 텍스트 선택 → 질문하기 기능 추가
- 브랜치: `feature/sfood-design-system-tone`(동일 브랜치에서 계속).
- 배경: 직전 태스크(`docs/tasks/guide-page-toc-sidebar-refresh/`)에서 사용자가 함께 요청했으나 새 인터랙션 기능이라 별도 스코프로 분리하기로 합의 — brainstorming → writing-plans → subagent-driven-development 전체 프로세스로 진행(설계 `docs/superpowers/specs/2026-07-27-guide-text-selection-ask-design.md`, 계획 `docs/superpowers/plans/2026-07-27-guide-text-selection-ask.md`).
- 구현(Task 1-4, 각 태스크마다 spec-compliance + code-quality 2단계 subagent 리뷰 수행): `PromptComposer.tsx`/`ArticleAskPanel.tsx`를 `forwardRef`로 전환해 각각 `focus()`/`fillAndFocus(text)` imperative handle 노출. 신규 `ArticleSelectionAskButton.tsx` — 본문(`.article-body`) 내 텍스트 선택 시 플로팅 "질문하기" 버튼을 위/아래 자동 배치로 표시, 500자 초과 선택은 트렁케이트, 스크롤/바깥클릭/Escape/선택해제 시 dismiss. `ArticlePage.tsx`가 `articleRef`/`askPanelRef`로 둘을 연결 — `ArticleContentRenderer`는 이 기능을 전혀 모름.
- Codex 크리티컬 리뷰(6c)에서 실제 버그 2건 발견 및 수정: (1) 버튼 클릭 시 mousedown이 브라우저의 텍스트 선택 collapse를 유발해 클릭이 유실될 수 있는 문제 → `onMouseDown`에 `preventDefault()` 추가로 해결. (2) `window` 스크롤만 감지해 코드블록/표 등 내부 스크롤 컨테이너 스크롤 시 버튼이 stale 좌표에 남는 문제 → `document` 캡처 단계 `scroll` 리스너로 교체.
- 검증: `pnpm test`(17 files/68 tests)/`typecheck`/`build` 통과. Playwright로 실제 브라우저 마우스 클릭(합성 이벤트 아님)으로 선택→버튼→클릭→Ask 인풋 채움/포커스 확인, 라이트/다크, 데스크톱(1280px)/모바일(390px), 컨테이너 바깥 선택 시 버튼 미노출, 코드블록 내부 스크롤 dismiss까지 재확인.
- 태스크 문서: `docs/tasks/guide-page-text-selection-ask/`(spec/plan/tasks/test-result/result).

### 2026-07-27 — 가이드 페이지 TOC 우측 분리, 컨텐츠 정렬, Ask 패널 폭 정렬/이중 보더 제거
- 브랜치: `feature/sfood-design-system-tone`(동일 브랜치에서 계속).
- 배경: 사용자가 "TOC를 우측 사이드 패널로 명확히 분리하고, 컨텐츠는 그 왼쪽 영역 안에서 중앙 정렬, 하단 플로팅 검색창은 컨텐츠 폭에 맞추고 이중 보더/큰 높이/각진 라운드를 개선"해 달라고 요청 — spec-driven-workflow에 따라 `docs/tasks/guide-page-toc-sidebar-refresh/`에 spec.md/plan.md 작성 후 승인받고 구현.
- 구현: `.article-layout`(`ArticlePage.tsx`/`GuidesPage.tsx`의 `StartingGuidePage` 공유)의 xl 그리드 gap을 새 토큰 `--article-toc-gap`(2rem)으로 확대하고, `.article-aside`(TOC)에 `xl:border-l xl:border-panel-border-soft`(중립 톤, "no colored accent bar" 원칙 준수)를 추가해 시각적 분리를 명확히 함. `.article-ask-dock`은 `--article-toc-width`/`--article-toc-gap` 공유 토큰 기반 `left: calc(50% - (toc폭+gap)/2)` + `transform: translateX(-50%)`로 재계산해 컨텐츠 컬럼(`.article-body`)과 폭·중심을 픽셀 단위로 일치시킴. `.article-ask-form`의 중복 보더 제거(바깥 `.article-ask` 프레임만 유지), `.article-ask` 라운드를 `--radius-lg`→`--radius-xl`로, `ArticleAskPanel.tsx`의 `COLLAPSED_HEIGHT`를 92px→68px(PromptComposer `minRows` 2→1)로 축소.
- 아웃오브스코프(사용자 확인): 문서 본문 텍스트 드래그 선택 → 컨텍스트 메뉴 → "질문하기" → Ask 인풋 포커스 이동 기능은 새 인터랙션 기능이라 이번 스코프에서 제외, 별도 세션에서 브레인스토밍부터 진행 예정.
- 검증: `pnpm --filter @sfood/web typecheck`/`test`(56 통과)/`build` 통과. Playwright로 데스크톱(1280x900) 라이트·다크, 모바일(390x844, 가로 스크롤 없음 확인), Ask 패널 확장 상태(질문 1건 등록 후 정렬 유지)까지 확인 — `.article-body`/`.article-ask-dock`의 `getBoundingClientRect()`가 동일 좌표(`left:119 / right:879`)로 일치함을 확인.
- Codex 크리티컬 리뷰(6c)에서 `sm`(640px)~`xl`(1280px) 사이 구간에서 Ask 패널 폭이 `.article-body`보다 넓어지는 문제를 지적 — `.article-body`는 `.site-shell`(px-3/sm:px-5)과 `.page-shell`(px-4/sm:px-6) 두 겹 패딩을 거치는데 기존 dock 폭 계산이 `.page-shell` 패딩만 반영했던 것이 원인. 두 레이어 합산 인셋 기준(`base: calc(100%-3.5rem)`, `sm: calc(100%-5.5rem)`)으로 재계산해 639/800/1280/390px 4개 뷰포트 전부에서 `.article-body`/`.article-ask-dock` 좌표 일치를 재확인.
- 태스크 문서: `docs/tasks/guide-page-toc-sidebar-refresh/`(spec/plan/tasks/test-result/result).

### 2026-07-27 — 가이드 문서 페이지 후속 수정 (full-bleed 본문, 하단 고정 Ask 도크, 얇은 스크롤바)
- 브랜치: `feature/sfood-design-system-tone`(동일 브랜치에서 계속).
- 배경: 사용자가 개편된 가이드 문서 페이지가 여전히 이전 디자인과 "거의 비슷"하다고 지적 — 본문(`.page-panel`)이 border/shadow는 제거됐지만 여전히 별도 배경색+둥근 모서리로 카드처럼 보였음.
- 구현: `.article-body`(신규, `.page-panel` 대체) — 배경/모서리 없이 페이지와 동화, 읽기 최대폭(760px) 유지. `ArticlePage.tsx`/`GuidesPage.tsx`의 `StartingGuidePage` 양쪽 적용. `ArticleAskPanel`을 그리드 밖으로 옮기고 `.article-ask-dock`을 `sticky`→`fixed inset-x-0 bottom-5`(하단 중앙 고정, 검색 페이지 `.chat-input-dock`과 동일 패턴)로 변경. 전역 얇은 스크롤바(hover/focus 시에만 보임) 추가.
- 부수 발견/수정: `.article-layout`이 `xl` 미만에서 명시적 grid-template-columns이 없어 넓은 표가 있는 문서에서 모바일 가로 스크롤 발생 — `grid-cols-1` 추가로 수정(사전 존재 버그, 이번 회귀 아님).
- 검증: `pnpm test`/`typecheck`/`build` 통과, Playwright 라이트/다크 + 모바일(390px) 확인.
- 커밋: `c2ba613`. 태스크 문서: `docs/tasks/notion-style-ui-refresh/result.md`(Follow-up 섹션).

### 2026-07-24 — Notion/Linear 스타일 UI 개편 (구현 + 검증 완료, Codex 리뷰만 보류)
- 브랜치: `feature/sfood-design-system-tone`(직전 세션과 동일 브랜치에서 이어서 작업).
- 배경: 직전 세션에서 `@sfood/ui` 브랜드 컬러 스케일을 `#d65050`(코랄 레드)로 갱신 반영한 위에서, 사용자가 지적한 잔여 문제(가이드 문서 구식 스타일, TOC 폰트/간격/줄바꿈 불편, 배경-패널 구분 방식이 구식, 낯선 톤)를 브레인스토밍(3안 중 Notion/Linear 미니멀 A안 선택)으로 해결.
- 구현(Task 1-6, subagent-driven-development로 각 태스크마다 spec-compliance + code-quality 2단계 리뷰 수행, 발견된 3건 회귀 즉시 수정):
  - `.page-panel`/`.home-card`/`.home-guide-card`/`.article-aside`(TOC)/`.chat-guide-spotlight`/`.empty-card` 등 패널·카드에서 `border`/`box-shadow` 제거, 배경 톤 차이만으로 구분(버튼/입력 등 기능 컨트롤은 테두리 유지).
  - 홈 "시작 가이드" 카드의 좌측 액센트/브랜드 틴트를 중립 1px 테두리(`border-panel-border`+`bg-card-bg`)로 교체 — 좌측 액센트 바 패턴 전면 제거(최초 배경-톤-only 시도는 라이트모드 시인성 저하로 리뷰에서 반려, 재수정).
  - 본문/TOC/리스트/테이블 타이포그래피·여백 확대(13px→14px, `leading-6`→`leading-7`, TOC 간격 확대로 긴 제목 2줄 줄바꿈 여유 확보).
  - `/guides` 목록을 카드형에서 신규 `.document-list`(divider) 클래스 기반 리스트로 전환. `.document-list-item`은 `.document-list` 내부에서만 divider 스타일이 적용되도록 스코프(최초 전역 변경은 `/projects` 등 다른 화면의 시각적 구분을 없애는 회귀로 리뷰에서 발견, 재수정). `guide` docType only 필터(Frozen Behavior)는 불변.
  - `ArticlePage.tsx`와 `/guides/agent-start`를 담당하는 별도 컴포넌트 `StartingGuidePage` 양쪽에 `IntersectionObserver` 기반 TOC scroll-spy 추가, 활성 항목은 `.article-toc-link-active`(텍스트 색상+semibold만, 막대 없음)로 표시. `StartingGuidePage` 쪽은 계획에 없었으나 Task 8 Playwright 검증 중 "TOC 클릭해도 활성 표시 안 됨" 버그로 발견 — 라우터 확인 결과 별도 컴포넌트임을 파악해 동일 로직 이식.
  - 검색 페이지 사용자 질문 말풍선(`.chat-message-user`)을 솔리드 브랜드 블록에서 연한 pill(`rounded-full bg-accent-soft`)로 교체.
- 검증(Task 8): `pnpm test`(wiki-core 168/web 55/edge-sidebar 21/mcp-server 36/serverless 5) 통과, `pnpm typecheck` 전체 통과, `pnpm --filter @sfood/web build` 통과. Playwright MCP로 홈/검색/`/guides`/문서 상세 4개 화면 × 라이트·다크 + 모바일(390x844) 확인. **Codex 비판 리뷰는 사용량 한도(2026-07-29 재시도 가능)로 이번 세션에서 수행 불가** — `docs/tasks/notion-style-ui-refresh/test-result.md`에 사유와 대체 검증(subagent 2단계 리뷰) 기록, 스킵이 아니라 명시적으로 남김.
- 태스크 문서: `docs/tasks/notion-style-ui-refresh/`, 계획: `docs/superpowers/plans/2026-07-24-notion-style-ui-refresh.md`, 설계: `docs/superpowers/specs/2026-07-24-notion-style-ui-refresh-design.md`.

### 2026-07-24 — SFOOD 디자인 시스템(@sfood/ui) 톤앤매너 적용 + 검색 스크롤/TOC 겹침 수정
- 브랜치: `develop` 신규 생성, `feature/sfood-design-system-tone`(base: develop)에서 작업. 커밋은 아직 하지 않음.
- 대상: 사용자 확인(service 축)에 따라 `apps/web`의 컬러/폰트/배경/radius를 사내 디자인 시스템(`@sfood/ui`, private repo) semantic 토큰 기준으로 전면 교체. 페이지 내부 구성은 불변.
- 구현: `apps/web/src/styles.css`에서 `@sfood/ui/tokens/base.css`+`tokens/semantic.css`를 import하고, `--accent`/`--page-bg`/`--panel-bg`/`--font-body` 등 기존 로컬 변수를 `--color-brand`/`--color-background`/`--color-surface`/`--font-sans` 등으로 재매핑. 다크모드는 동일 원시 스케일(`--gray-*`, `--brand-*`) + `color-mix()`로 자체 구성(디자인 시스템이 다크 기본값 미제공). `--radius-xl/lg/md`는 `@sfood/ui/base.css`의 동일 이름 프리미티브와의 자기참조 충돌을 피하기 위해 리터럴 픽셀(16/12/8)로 적용.
- 버그 수정: (1) `SearchPage.tsx` — 새 답변 turn 추가/loading→complete 전환 시 `scrollIntoView`로 자동 스크롤. (2) `.article-aside`(TOC) sticky top을 `.site-header` 실측 높이에 맞춰 `top-4`→`top-[88px]`로 수정, 겹침 제거.
- 환경 제약: 이 세션의 pnpm은 `@sfood/ui`의 git 의존성 `prepare`(vite build) 스크립트를 임시 디렉터리에서 성공적으로 빌드하지만(로그로 확인) 산출물(`dist/index.js`)을 최종 패키지 경로에 반영하는 단계가 반복적으로 누락되어, React 컴포넌트(Button/Card 등) import는 이번 세션에서 사용하지 못함. CSS 토큰(`tokens/*.css`)은 빌드 불필요라 정상 적용됨. 후속 세션에서 정상 환경 재설치 후 컴포넌트 교체 필요.
- 검증: `pnpm test`(wiki-core 168/web 52/edge-sidebar 21/mcp-server 36/serverless 5) 통과, `pnpm typecheck` 전체 통과, `pnpm --filter @sfood/web build` 통과. Playwright MCP로 홈(라이트/다크)/검색 스크롤/`/guides`/가이드 상세 TOC/모바일(390x844) 확인. Codex 비판 리뷰 완료(Critical 0, non-critical 1건 — 무관한 `pnpm-lock.yaml` 변경 혼입 → unstage로 반영).
- 태스크 문서: `docs/tasks/sfood-design-system-tone/`.

### 2026-07-23 — 웹 검색/문서 note 이중 표시 및 목차 정리
- 대상: (1) Confluence ADF 확장(`<ac:adf-extension>`) 패널이 웹 아티클/검색에서 이중 렌더 + `panel-type` "note" 텍스트 누출, (2) 목차 마커(`•`/`—`) 세로중앙 배치로 정렬 어긋남 + 항목 간격 과다.
- 근본 원인: 두 렌더러(`confluenceCleanHtml.ts`, `ArticleContentRenderer.tsx`) 모두 `ac:adf-extension` 미처리 → `ac:adf-content`와 `ac:adf-fallback`(`.panel`)이 동시 출력.
- 해결:
  - `packages/wiki-core/src/lib/confluenceCleanHtml.ts`: `ac:adf-extension` 패널 → 단일 `wiki-callout` div 변환. `panel-type`은 화이트리스트(`resolveAdfPanelType`)로 정규화(속성 인젝션 차단), 본문은 `inner`에서 직접 추출(중첩 `adf-node` 절단 방지).
  - `apps/web/src/ui/pages/ArticleContentRenderer.tsx`: `rewriteConfluenceRichNodes`에 `ac:adf-extension` 패널 → blockquote 콜아웃(`resolveConfluenceAdfPanelElement`) 추가, 동일 화이트리스트 적용.
  - `apps/web/src/styles.css`: 목차 `::before` 마커 전부 제거, 레벨 들여쓰기(pl-2/5/8)로 구분, `py-1.5→py-1`·`space-y-1→space-y-0.5`로 간격 축소.
- 검증: `pnpm test`/`pnpm typecheck` 통과, ADF 단위테스트 3건 추가(변환·중첩·인젝션), Playwright로 note 단일 렌더+목차 확인, Codex 크리티컬 리뷰 2건 반영. 태스크: `docs/tasks/websearch-note-toc-fix/`.

### 2026-07-22 — 익스텐션 검색/가이드 오동작 수정 (A안: 서버 정리 HTML)
- 대상: `apps/edge-sidebar` 3대 오동작 — (1) 가이드 본문 이중 노출 + 다크모드 불가시, (2) 추천/참고 페이지 중복, (3) 추천 링크 오동작.
- 근본 원인: 익스텐션이 웹 정규화 모델을 재사용하지 않고 원본 Confluence `bodyHtml`을 raw로 렌더 + 제목 기준 dedup + `/guides/`만 우선하는 href 선택.
- 해결(A안, 서버 정리): 매크로 정리를 서버에서 수행하고 익스텐션은 정리된 HTML 렌더만. 익스텐션 0-의존 격리 유지.
  - `packages/wiki-core/src/lib/confluenceCleanHtml.ts` 신규: DOM-비의존 `renderConfluenceContentToCleanHtml(html, documents)` — code/callout/ac:link 매크로 → 시맨틱 HTML, 잔여 `ac:`/`ri:`·`wiki.metadata` 제거.
  - `apps/web/vite.config.ts`: `GET /api/wiki/documents` 신규(정리된 contentHtml + related). 기존 `/api/wiki-pages` 불변.
  - `apps/edge-sidebar/src/sidepanel/wikiClient.ts`: 검색 소스 dedup을 제목 → 페이지 ID로 변경, `isSpecificDocumentHref`를 guides/faq/library로 확장, 가이드 본문을 새 엔드포인트에서 `findCleanDocumentByHref`로 로드, storage-format 죽은 코드 제거.
  - `apps/edge-sidebar/src/sidepanel/styles.css`: `.wiki-callout`/코드에 테마 변수 스타일(다크모드 가시성).
  - Codex High(XSS) 반영: `sanitizeConfluenceHtml`이 따옴표 없는 이벤트 핸들러도 제거.
- 검증: `pnpm test` 279개 통과, `pnpm typecheck` 전체 통과, 익스텐션 build 통과. 서브에이전트 2단계 리뷰 + Codex 비판 리뷰(Critical 0). 라이브 엔드포인트·익스텐션 실사용은 사용자 브라우저 수동 확인 필요(MCP Playwright에 unpacked 익스텐션 미로드).
- 태스크 문서: `docs/tasks/edge-sidebar-fixes/`, 계획: `docs/superpowers/plans/2026-07-22-edge-sidebar-fixes.md`.

### 2026-06-18 — 위키 MCP 서버 (`apps/mcp-server`) 신규 구현 (격리)
- 사내 Confluence 위키를 읽기 전용 MCP(Model Context Protocol) 서버로 노출하는 독립 앱 `apps/mcp-server` 추가.
- **격리 제약(사용자 핵심 요구)**: `apps/edge-sidebar`와 동일 레벨의 별도 앱. `@sfood/wiki-core` 등 워크스페이스 패키지를 import하지 않고 Confluence 클라이언트를 자체 보유. 기존 패키지(web/edge-sidebar/wiki-core/serverless) 소스 무수정. 환경만 공유, 배포 독립. 런타임 의존성 0개(Node 22 글로벌 `fetch`).
- MCP Tools 5개: `search_wiki`, `get_page`(plain text 8000자 트림), `get_page_by_title`, `get_page_children`, `get_space_list`.
- MCP Streamable HTTP transport를 JSON-RPC 2.0(protocolVersion `2024-11-05`)로 직접 구현 (외부 SDK 미사용). `initialize`/`ping`/`tools.list`/`tools.call`/`notifications` 지원.
- `x-api-key` 인증(401), Lambda Function URL 핸들러(`export const handler`), esbuild 단일 ESM 번들(18.5kb).
- Confluence 실패/404는 서버 크래시 없이 tool `isError`로 반환. CQL `space`는 숫자 Space ID 사용, 선택적 `space_key` 오버라이드.
- Codex 비판 리뷰 7건 중 6건 반영: id:null 응답, 빈 배치/malformed shape `-32600`, malformed base64 무크래시, 페이지네이션 상한, 동일 origin next 링크만 추적(SSRF 방지). 와일드카드 CORS는 서버사이드 클라이언트 전제로 수용.
- 문서: `apps/mcp-server/README.md`, `docs/tasks/wiki-mcp-server/aws-deployment-guide.md`.
- 검증: `pnpm --filter @sfood/mcp-server typecheck/test`(36건)/`build` 통과, 전체 `pnpm typecheck`/`pnpm test` 회귀 없음, 격리 grep 0건. 실제 AWS 배포·Confluence end-to-end는 가이드 기반 수동 단계로 분리.

### 2026-06-09 — 브라우저 사이드바 확장 MVP 추가
- 기존 위키 앱과 분리된 `apps/edge-sidebar` 워크스페이스 패키지를 추가.
- Manifest V3 기반 side panel extension으로 구성:
  - toolbar action 클릭 시 side panel 열기
  - 로컬 기본 위키 URL `http://localhost:5173`
  - multiline 질문 입력
  - `/api/wiki/ai/search` 호출
  - API 실패 시 `/search?q=` fallback 링크 제공
- 로컬 로드 피드백 반영:
  - 웹 favicon 기반 PNG 아이콘 4종 추가
  - 웹 공통 CSS 변수 톤으로 사이드바 UI 재정렬
  - 상단 URL/텍스트 제거
  - 우측 상단 홈 아이콘 추가
  - 답변 영역을 상단 full 영역으로 확장
  - 검색 composer를 하단 고정
  - 답변 markdown 링크와 참고 문서 링크를 새 탭으로 열도록 수정
  - 검색 후 입력값 초기화 및 제출 질문을 답변 상단에 표시
  - 참고 문서 링크 contrast 수정
  - composer 내부 우측 하단 전송 버튼으로 변경
  - `http://localhost:5173/*` 페이지에 draggable floating launcher 주입
- 전역 브라우저 사이트로 범위를 넓혀 `"<all_urls>"`에서 플로팅 launcher가 보이도록 변경.
- 플로팅 launcher는 hover 시 확장되며 wiki home 버튼과 환경 설정 popover를 제공.
- hover 시 제목 텍스트는 표시하지 않고, 위에는 home 아래에는 settings 버튼을 분리해서 보여줌.
- launcher 설정은 `chrome.storage.local`에 저장되어 사이트를 바꿔도 유지.
- 사이드 패널 헤더에 launcher 복구 버튼을 추가해 숨김 상태를 다시 해제할 수 있게 함.
- 가이드 결과를 선택하면 새 창 대신 side panel 내부의 오른쪽 슬라이드 영역으로 전환되며, 상단 뒤로 가기 버튼으로 검색 화면으로 복귀할 수 있게 함.
- 가이드 슬라이드 영역은 전체 페이지 URL iframe 대신 `/api/wiki-pages`에서 찾은 문서의 본문 HTML만 렌더링하도록 변경.
- 검색 답변과 가이드 본문 스크롤은 extension 전용 얇은 scrollbar 스타일로 조정.
- 검색 화면 복귀 화살표를 가이드 화면의 상단 왼쪽 끝으로 이동.
- 검색 답변은 단일 결과 교체가 아니라 side panel 세션 안에서 chat turn으로 누적되도록 변경. side panel을 닫거나 새로고침하면 초기화됨.
- 질문 말풍선과 답변/참고문서/입력 영역 typography를 더 작고 촘촘하게 조정해 좁은 side panel에서 줄바꿈을 줄임.
- 동일 제목 source 중 `/guides/...` 링크를 우선해 참고 문서 링크가 slide-in guide view로 열리도록 복구.
- launcher hover 액션 배치를 위는 home, 아래는 settings로 정렬.
- launcher를 Shadow DOM으로 전환해 일반 웹사이트 CSS가 버튼/아이콘/옵션 팝업 스타일을 깨지 않도록 격리.
- 메인 책 버튼 pointer drag를 복구하고, 세로 이동 위치를 `chrome.storage.local`에 저장하도록 변경.
- 옵션의 상단/하단 이동은 새로고침 없이 즉시 위치를 바꾸고 저장하도록 변경.
- 플로팅 launcher의 흰 배경 패널을 제거하고 아이콘만 투명하게 노출되도록 단순화.
- hover/expanded/drag 상태에서 home/settings와 메인 아이콘 투명도를 낮춰 페이지 콘텐츠를 덜 가리도록 조정.
- launcher 확장 모델을 수정해 메인 아이콘은 항상 100% opacity로 유지하고, hover 시 home/settings 아이콘만 뒤에서 위/아래로 slide-out되도록 변경.
- side panel 닫기 요청이 브라우저 API에서 실패하면 닫힘 상태를 storage에 저장하지 않도록 보정.
- 직전 launcher CSS 회귀를 수정:
  - settings popover가 초기 로드부터 떠 있던 문제 제거
  - popover 버튼에 launcher absolute positioning이 새는 문제 제거
  - 책 아이콘 크기를 다시 크게 표시
  - 숨김 상태에서도 새로고침 후 오른쪽 핸들이 보이도록 조정
- unpacked extension을 새로고침한 뒤 기존 탭에 남아 있던 stale content script가 `Extension context invalidated`를 던지는 문제를 완화:
  - content script startup과 launcher action에서 invalidated context 예외를 잡아 uncaught rejection으로 남지 않도록 보정
  - stale launcher는 자동 teardown 처리
  - 다만 브라우저 탭 자체는 새 확장 context를 쓰기 위해 한 번 새로고침이 필요
- 숨김 기능 추가 후 메인 런처 아이콘까지 화면 밖으로 밀려 기능이 죽은 것처럼 보이던 회귀를 수정:
  - hidden 상태에서도 메인 책 아이콘은 그대로 보이고 클릭 가능
  - hidden 상태는 home/settings 보조 아이콘만 막도록 단순화
- 런처 열기/닫기 토글이 extension storage의 `sfoodWikiSidebar.panelOpen` 값에 종속되던 문제를 수정:
  - 메인 런처 클릭은 저장값을 읽지 않고 background에 `toggle` 요청만 보냄
  - background service worker가 탭 단위 메모리 상태로 open/close 방향을 결정
  - 기존 `panelOpen` 저장 키는 startup에서 제거되어 더 이상 동작을 좌우하지 않음
- side panel open/close 호환성 경로를 보강:
  - open 전 현재 탭을 `setOptions(... enabled: true)`로 다시 활성화
  - global side panel 닫기는 `windowId` 기준 `close()`를 우선 사용
  - `close()`가 없는 브라우저에서는 `setOptions({ tabId, enabled: false })`로 현재 탭 패널을 숨김
- 확장 표시 이름을 `SFOOD AI Wiki`로 변경.
- 로컬 unpacked 설치 및 패키징 가이드를 `apps/edge-sidebar/README.md`에 추가.
- 검증: `pnpm --filter @sfood/edge-sidebar test`, `pnpm --filter @sfood/edge-sidebar typecheck`, `pnpm --filter @sfood/edge-sidebar build`, `pnpm test`, `pnpm typecheck` 통과. MCP Playwright는 로컬 위키 페이지 접속은 확인했으나, MCP 브라우저 context에 unpacked extension이 로드되지 않아 설치 확장 UI의 직접 시각 검증은 사용자 브라우저에서 필요.

### 2026-06-08 — `/guides` 검색 박스 중복 테두리 및 다크모드 버튼 가시성 수정
- `/guides` 리스트에서 검색 입력을 감싸던 바깥 래퍼를 제거해 이중 테두리를 해소.
- 공유 `PromptComposer` 버튼 스타일을 테마 변수 기반으로 바꿔 다크모드에서도 검색 버튼이 사라지지 않도록 수정.
- 검색 입력 영역의 세로 여백을 소폭 조정해 리스트 상단 밀도를 유지.
- 검증: `pnpm --filter @sfood/web test`, `pnpm --filter @sfood/web typecheck` 통과.

### 2026-06-08 — `/guides` 헤더를 아이콘 홈 링크로 정리
- `/guides` 페이지에서 `[추천 가이드]` 괄호 타이틀을 일반 `추천 가이드`로 교체.
- 상단 `홈으로 돌아가기` 텍스트 링크를 오른쪽 정렬 아이콘 링크로 교체하고, 접근성용 `aria-label`/`title`을 유지.
- `CategoryPage` 테스트를 새 레이아웃과 아이콘 링크 기준으로 갱신.
- 검증: `pnpm --filter @sfood/web test -- --run src/ui/pages/CategoryPage.test.tsx`, `pnpm --filter @sfood/web typecheck` 통과.

### 2026-06-08 — guide-like `page` 후보 메타데이터를 `guide`로 재분류
- 조사에서 확인한 강한 guide-like `page` 후보 10개를 Confluence에서 직접 `wiki.metadata.docType=guide`로 변경.
- 대상: `119930898`, `95846431`, `95715380`, `95748126`, `97124360`, `107708613`, `107675805`, `114294785`, `114163769`, `114294946`
- 변경 후 동일 페이지들을 다시 읽어 `docType=guide`로 반영되었음을 확인.
- 이 작업은 Confluence 메타데이터만 수정했고 본문은 변경하지 않음.

### 2026-06-08 — guide-like `page` docType 후보 조사
- Confluence space `63111172`의 current pages 321개를 읽고 `wiki.metadata.docType = page` 문서 중 guide-like 신호를 가진 후보를 조사.
- 제목/본문 구조 기준으로 153개 후보를 추려냈고, 그중 `[Guide]` 접두사와 단계형 본문 구조를 가진 문서들이 추천 가이드/`/guides` 표면에서 누락될 가능성이 높음을 확인.
- 대표 후보로 `119930898` `[Guide] Claude Code vs Codex 도구 비교 및 선택 가이드`, `95846431` `[Guide] Claude Code Checkpointing`, `95715380` `[Guide] Claude Code Sessions`, `107708613` `[Guide] Claude 모델 선택 가이드: Opus, Sonnet, Haiku 비교` 등을 확인.
- 이 작업은 분석-only로 수행했으며 Confluence 메타데이터나 앱 코드는 변경하지 않음.

### 2026-06-08 — 가이드 목차 계층 표시 및 HTML 엔티티 렌더 보정
- 가이드/문서 우측 목차에서 하위 heading이 공백만 보이던 문제를 수정.
  - level 2: `•`
  - level 3: `—`
  - level 4: `·`
  marker와 단계별 padding을 추가해 구조가 한눈에 드러나도록 조정
- Confluence read model에서 HTML entity 처리 보강:
  - `contentHtml`: `&amp;entity;`를 `&entity;`로 한 단계 unescape
  - `summary`, `headings.text`: `&mdash;`, `&nbsp;`, numeric entity 등을 실제 문자로 디코딩
- 검증: `pnpm --filter @sfood/wiki-core test`, `pnpm --filter @sfood/web test`, `pnpm typecheck`, Playwright MCP 시작 가이드 목차 확인 통과.

### 2026-06-08 — 검색 composer 멀티라인 UX 및 홈 밀도 조정
- 홈 검색, 검색 결과 검색, 가이드 목록 검색, 문서 상세 Ask 패널을 공통 `PromptComposer` 기반 multiline textarea로 통일.
- 입력 규칙 통일:
  - plain `Enter` 제출/검색
  - `Shift+Enter` 줄바꿈
  - IME 조합 중 `Enter` submit 방지
- 홈 화면 조정:
  - 검색 폭을 추천 가이드 프레임과 동일한 `max-w-4xl`로 확장
  - 검색 박스 라디우스를 추천 가이드 카드와 동일한 `8px`로 정렬
  - hero 상하 여백과 검색-가이드 간격을 줄여 첫 화면에서 스크롤 없이 함께 보이도록 압축
- 가이드 목록 검색은 `Enter` 확정형으로 바꾸고, 검색 textarea 높이를 키워 긴 질의 입력 가독성을 개선.
- 검증: `pnpm --filter @sfood/web test`, `pnpm typecheck`, Playwright MCP 홈/검색/가이드/문서 상세 확인 통과.

### 2026-06-08 — Rovo 수준 검색 답변 품질을 위한 retrieval 보강
- `claude worktree를 설명하세요.` 같은 페이지-기반 개념 질문에서 broad Claude guide가 직접 대상 페이지를 이기는 문제를 수정.
- 검색 스코어링 보강:
  - 질문어 노이즈 토큰 제거 (`설명하세요`, `알려줘` 등)
  - 영문 단복수 변형 보정 (`worktree` / `worktrees`)
  - 다중 토큰 커버리지 및 title/slug 2-token 매치 보너스 추가
  - concept 질문에서 direct subject coverage가 강한 `page` 문서가 broad guide보다 밀리지 않도록 보정
- Stage 1 query-understanding이 usable keyword를 돌려주지 못할 때, raw 질문 대신 정제된 fallback 검색 쿼리를 사용하도록 수정.
- AI가 보이는 답변에서 "현재 위키에 해당 주제에 대한 페이지가 없습니다"라고 말하면서 `unsupportedClaims`를 비워 두는 경우를 서버/클라이언트가 완전 미지원 응답으로 정규화하도록 수정.
- 검증: `pnpm --filter @sfood/wiki-core test`, `pnpm --filter @sfood/web test`, `pnpm typecheck` 통과. 로컬 dev API 재현에서 `claude worktree를 설명하세요.`가 page `95780877`을 `confluenceData`와 `recommendedDocuments`에 포함해 답변함을 확인.

### 2026-06-04 — 완전 미지원 검색 답변의 페이지 카드 숨김
- AI가 `confluenceData`를 비우고 `unsupportedClaims`를 반환한 완전 미지원 검색 답변에서는 FAQ·추천 페이지·관련 페이지를 모두 숨기도록 수정.
- 서버가 lexical fallback 추천/관련 문서를 붙이지 않도록 했고, 클라이언트도 직접 FAQ 랭킹과 fallback 추천을 추가하지 않도록 이중 방어 적용.
- 부분 지원 답변은 기존 페이지 노출을 유지하도록 회귀 테스트 추가.
- 검증: `pnpm test`, `pnpm typecheck`, Playwright MCP 동일 질의 재현 통과. `claude worktree 에 대해 설명해줘` 결과에서 무관한 페이지 카드가 더 이상 노출되지 않음.

### 2026-05-28 (7) — 자가 개선 프롬프트 시스템
- **자가 개선 루프 구축**: Playbook 누적 데이터 → AI 프롬프트 자동 개선 → 서비스 재배포 없이 반영
  - `promptRulesLoader.ts` 신규: Confluence "Prompt Rules" 페이지 파싱 (`parsePromptRulesFromHtml`, `loadPromptRulesFromConfluence`, `buildInitialPromptRulesPageHtml`)
  - `playbookAnalyzer.ts` 신규: Playbook 일별 테이블에서 "부족" 패턴 집계 (`analyzeRecentPlaybookFailures`, `parsePlaybookRows`, `extractFailurePatterns`)
  - `aiAsk.ts` 수정: `AiSearchPromptContext.dynamicRules` 필드 추가, `buildAiSearchInstructionsForIntent`에 동적 규칙 주입 (`buildDynamicRuleLines` 내부 헬퍼)
  - `vite.config.ts` 수정: `promptRulesCache` + `loadDevPromptRulesCache()` 추가, 검색 핸들러에서 TTL 캐시 기반 동적 규칙 로드
  - Claude schedule 루틴 등록: 매일 20:00 KST, Playbook 7일치 분석 → "Prompt Rules - Search" Confluence 페이지 자동 갱신 (ID: `trig_018dn6jkaABXrxrkHpKhcriL`)
  - 환경 변수 `CONFLUENCE_PROMPT_RULES_PAGE_ID` 추가 (미설정 시 기존 프롬프트로 폴백)
- 검증: `pnpm test` 전체 202개 통과 (신규 20개 포함), `pnpm typecheck` 통과

### 2026-05-22 (6)
- **검색 추천/관련 페이지 랭킹 쿼리 불일치 버그 수정**: `vite.config.ts`에서 `rankingRecommendedDocuments` 계산 시 원래 한국어 질문(`searchQuestion`) 대신 Stage 1 이중언어 키워드(`searchQuery`)를 사용하도록 수정.
  - 원인: Stage 2 컨텍스트 문서 검색은 `searchQuery`를 쓰는데, 추천/관련 페이지 랭킹은 `searchQuestion`을 사용 → "스킬" 토큰이 "skill"로 확장되지 않아 "Claude Code Skills" 같은 영어 제목 페이지가 누락됨
  - 추가 수정: `searchKeywords` 빈 문자열 포함 배열에서 fallback이 누락되는 결함 제거 (Codex Medium 지적)
  - 수정 후: "Claude Code 스킬과 Codex 스킬 차이점" 검색 시 "Claude Code Skills", "Claude Code Jira Skill Setup" 등이 추천/관련 페이지에 포함됨 ✅
- 검증: `pnpm test` 전체 182개 통과, `pnpm typecheck` 통과, Playwright 추천 페이지 확인

### 2026-05-21 (5)
- **docType 노출 규칙 동결 및 `/guides` 목록 복원**: `/guides` 목록에서 `page` docType 문서를 제외하도록 `CategoryPage.tsx` 필터 복원. 이전 세션(2026-05-21 (2))의 "guide + page 모두 표시" 수정은 사용자 의도와 달랐음을 확인하고 되돌림.
  - Surface별 docType 노출 규칙을 `CLAUDE.md`, `ui-spec.md`, `development-rules.md`, `development-prompt-reference.md`에 FROZEN으로 명시
  - 규칙 요약: 홈 추천/`/guides` 목록은 `guide` only. 검색 답변(추천·관련·인라인 링크)은 `guide` + `page` 모두.
  - `CategoryPage.test.tsx` 테스트명 및 검증 항목 복원
- 검증: `pnpm test` 전체 통과, Playwright `/guides` 스냅샷 2개(guide only) 확인

> **NOTE**: 2026-05-21 (2) 항목 "guide + page 모두 표시" 수정은 위에서 superseded됨. 현재 규칙은 guide only.

### 2026-05-21 (4)
- **playbook docType 검증 누락 버그 수정**: `wikiDataSource.ts`의 `readDocType`에 `"playbook"` 추가.
  - 원인: `confluenceClient.ts`에는 `playbook`이 있었으나 `wikiDataSource.ts`에는 누락되어, Confluence API 응답에 playbook 페이지가 포함되면 전체 데이터 로딩 실패
  - 결과: 5173 홈 추천 가이드 4개, /guides 129개, 검색 정상 동작 복구
  - Codex 리뷰 반영: `wikiDataSource.test.ts`에 playbook 파싱/제외 회귀 테스트 추가
- 검증: `pnpm test` 전체 182개 통과, `pnpm typecheck` 통과, Playwright 홈·가이드·검색 확인

### 2026-05-21 (3)
- **홈 추천 가이드 스펙 문서화**: `ui-spec.md`와 `development-prompt-reference.md`에 홈 추천 가이드 정의 추가 및 기존 잘못된 기술 수정.
  - "추가 추천 가이드 5개" → "최대 4개 (guide 부족 시 있는 만큼)"로 수정
  - **Home Recommended Guides Rules** 섹션 신규 추가: 소스(공개 corpus `guide` docType), 필터(온보딩 제외), 정렬(`updatedAt` 내림차순), 개수(최대 4개), 시작 가이드 중복 제거, 총 최대 5개 명시
  - 시작 가이드 매핑 규칙: slug → title 패턴 2가지 → id 순 fallback, `nav` docType 허용, 홈+agent-start 라우트 한정 노출
  - Guide List Rules: `/guides`가 `guide` + `page` docType 모두 표시, `page` 기준 public read model 조건 명시
  - `development-prompt-reference.md`: "5개" → "최대 4개 (동적 선택)", "guide only" → "guide or page" 수정
- 코드 변경 없음; 문서가 실제 코드(`buildFeaturedGuides`, `CategoryPage`)와 일치함을 확인
- Codex 비판 리뷰 반영: 4가지 불일치 항목 모두 수정

### 2026-05-21 (2)
- **`page` docType 가이드 목록 노출 수정**: `/guides` 카테고리가 `guide` docType만 표시하고 `page` docType을 숨기던 버그 수정.
  - `CategoryPage.tsx`: `guide`에게만 intro 필터 적용, `page`는 모두 통과하도록 조건 역전
  - 스냅샷 모드 Playwright 확인: guide 2 + page 3 = 5개 정상 노출, intro 문서 숨김 유지
  - Codex 비판 리뷰 반영: `isIntroGuideDocument`가 `page` 타입에 의도치 않게 적용되는 부작용 제거
- **개발 프로세스 강제화 문서 추가**: 수정 지시 시 항상 ① 태스크 문서 → ② 구현 → ③ 단위 테스트 → ④ Playwright 리뷰 → ⑤ Codex 비판 리뷰 → ⑥ 완료 보고 순서를 `docs/ops/spec-driven-workflow.md`와 `CLAUDE.md`에 명시
- 검증: `pnpm test` 전체 181개 통과 (134 wiki-core + 42 web + 5 serverless), Playwright guides 페이지 확인

### 2026-05-21
- **AI 검색 관련성 판단 개선**: SUBJECT COVERAGE GATE(단일 페이지 필수 텍스트 매칭)를 제거하고 AI 프롬프트 수준의 RELEVANCE CHECK로 교체.
  - Case 1(비교 질문): A 페이지 + B 페이지 조합 허용 — "코덱스와 클로드의 skill 차이" 같은 질문이 두 페이지를 올바르게 조합해 답변 가능
  - Case 2(복합 주제어): 특정 도구+기능은 단일 페이지 커버 요구 — "claude webhook" 질문에 무관한 Jira Setup 페이지 사용 금지
- **intent 분류 개선** (`intentClassifier.ts`):
  - 비교 패턴에 `다르|달라|달리` 추가 — "뭐가 다르지?" 같은 질문이 comparison으로 올바르게 분류
  - 목표 지향적 how-to 패턴 `읽으려면|활용하려면|쓰려면|하려면` 추가 — "Jira 이슈를 읽으려면?" 같은 질문이 setup으로 분류
- **운영 지침 강화** (`CLAUDE.md`, `ai-ask-prompt-guide.md`, `search-flow-contract.md`): AI 동작 수정 시 docs 먼저 확인 의무화, Gate/수동 매핑 금지 패턴 명시, 관련성 판단 위임 원칙 문서화
- 검증: `pnpm test` 전체 171개 통과 (129 wiki-core + 37 web + 5 serverless), Codex 최종 리뷰 합격, 10개 질문 검증 8/10 PASS (나머지 2개는 실제 페이지 존재 여부 확인 필요)

### 2026-05-20
- Increased and separated search typography: search input text now renders at 15px, user questions at 14px, AI answer body/list text at 15px, and markdown answer headings at 17-19px with bold weight.
- Verified the updated computed styles in Playwright and rechecked the web package test/typecheck.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과, Playwright computed style 확인.

### 2026-05-20
- Fixed policy notice visibility so search and article Ask responses show the policy source links whenever a policy-related response includes sources, even if the model leaves the notice message empty.
- Added a default policy notice message for source-only policy notices and shared the same visibility helper across search and article Ask UI.
- 검증: `pnpm --filter @sfood/web test` 통과, `pnpm --filter @sfood/web typecheck` 통과, `pnpm typecheck` 통과.

### 2026-05-19
- Added a `page-lookup` search answer intent so questions like `mcp 설정페이지가 있지 않아?` answer with whether a matching page was found and link the best/closest page before any topic explanation.
- Updated the AI prompt guide and search flow contract so page/document/guide/link existence questions are treated as lookup/navigation questions, not generic concept or setup explanations.
- 검증: `pnpm --filter @sfood/wiki-core test` 통과, `pnpm --filter @sfood/wiki-core typecheck` 통과, `pnpm typecheck` 통과, `pnpm test` 통과.

### 2026-05-19
- Added source policy links to `policyNotice`: the dev API now enriches policy-related search and page Ask responses with the selected policy context sources, and the UI renders those source pages inside the policy notice box.
- 검증: `pnpm --filter @sfood/web test` 통과, `pnpm --filter @sfood/web typecheck` 통과, `pnpm typecheck` 통과, `pnpm test` 통과.

### 2026-05-19
- Updated inline page links inside structured search/article answers so they render as visible accent-colored badge links by default instead of only becoming obvious on hover.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과.

### 2026-05-19
- Corrected the previous search-answer simplification that made answers too thin: structured supplemental details are now preserved as same-style natural follow-up paragraphs/lists instead of being dropped.
- Relaxed the search prompt from "empty arrays by default" to "answer must be useful on its own, with supplemental arrays only when they add detail", and explicitly prevents three-line teaser answers.
- 검증: `pnpm --filter @sfood/web test` 통과, `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/wiki-core test` 통과, `pnpm --filter @sfood/wiki-core typecheck` 통과, `pnpm typecheck` 통과, `pnpm test` 통과.

### 2026-05-19
- Removed separately styled search answer support sections from the search page: `immediateActions`, `exampleCommands`, `verificationChecks`, and `cautions` are no longer rendered under the answer.
- Strengthened search prompt rules so the answer body must not create fixed headings such as `바로 할 일`, `예시`, `확인`, `확인 포인트`, `주의`, or `확인 필요`; the answer should stay as short natural paragraphs or a very short list when necessary.
- 검증: `pnpm --filter @sfood/web test` 통과, `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/wiki-core test` 통과, `pnpm --filter @sfood/wiki-core typecheck` 통과, `pnpm typecheck` 통과, `pnpm test` 통과.

### 2026-05-19
- Fixed duplicate search answer support sections: when the answer body already contains visible `바로 할 일`, `확인/확인 포인트`, or `주의` sections, the separately styled structured `immediateActions`, `verificationChecks`, and `cautions` blocks are suppressed.
- Added web regression coverage so ordinary prose mentioning 확인/주의 is not mistaken for a duplicate section.
- 검증: `pnpm --filter @sfood/web test` 통과(10 files / 35 tests), `pnpm --filter @sfood/web typecheck` 통과.

### 2026-05-19
- Adjusted search answer tone/readability rules so explanatory prose uses short vertical paragraphs with blank lines and avoids parenthetical side explanations.
- Updated the AI answer guide and search-flow contract, strengthened `aiAsk.ts` search prompt requirements, and added UI-side paragraph splitting for long single-block chat answers.
- 검증: `pnpm --filter @sfood/wiki-core test` 통과, `pnpm --filter @sfood/web test` 통과, `pnpm --filter @sfood/wiki-core typecheck` 통과, `pnpm --filter @sfood/web typecheck` 통과, `pnpm typecheck` 통과, `pnpm test` 통과.

### 2026-05-19
- Widened the Home recommendation and blueprint support frame from `max-w-3xl` to `max-w-4xl` so those secondary sections have less visible desktop side whitespace while the search box remains unchanged.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과, Playwright `1280x800`에서 search `672px`, recommendation/blueprint `896px` 확인.

### 2026-05-19
- Changed Playbook search logging from monthly child pages to KST daily child pages named `Playbook - YYYY-MM-DD`.
- Reworked Playbook page content so each daily page keeps a single log table and appends each search as one row instead of creating one table per entry.
- Added regression coverage for daily title creation, new-page table creation, and existing-page row append behavior.
- 검증: `pnpm --filter @sfood/wiki-core test` 통과, `pnpm --filter @sfood/wiki-core typecheck` 통과, `pnpm typecheck` 통과, `pnpm test` 통과.

### 2026-05-19
- Re-centered the Home search hero with wider top/bottom breathing room, narrowed the search box to `max-w-2xl`, kept recommendation/blueprint as `max-w-3xl` support frames, and converted recommendation guides into one `시작 가이드` featured card plus four regular cards.
- 검증: Playwright confirmed `1280x800` search `672px` vs support frames `768px`, a balanced four-card regular guide grid, widened card area `734px`, and no mobile horizontal overflow at `390x844`; `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(9 files / 31 tests), `pnpm typecheck` 통과.

### 2026-05-19
- Restored the Home search box width to `max-w-3xl` after the guide list compression pass.
- 검증: `pnpm --filter @sfood/web typecheck` 통과.

### 2026-05-19
- Reduced only the Home recommended guide block height so the search block stays untouched while the guide list becomes denser.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(9 files / 31 tests).

### 2026-05-19
- Renamed the `/guides` page title to `추천 가이드`, removed the extra guide filters, kept only the integrated search box, hid the guide index map button, and kept the list paginated.
- Centered the Home search block more vertically, tightened the recommended guide block spacing, added icon-led rows, and turned the pinned recommendation into a stronger `추천 가이드` card.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(9 files / 31 tests), `pnpm typecheck` 통과.

### 2026-05-19
- Updated `/guides` so it now shows only `metadata.docType === "guide"` documents, excludes intro-style guide pages, paginates long lists, and moves the guide index map to the bottom.
- Added a focused render test to keep the guide-only filter and pagination behavior stable.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(9 files / 31 tests), `pnpm typecheck` 통과.

### 2026-05-19
- Increased the Home recommended guide list so it now shows the pinned starting guide plus five additional guides.
- Updated the Home render test to cover the six-item guide list and keep the starting guide at the top.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(8 files / 30 tests), `pnpm typecheck` 통과.

### 2026-05-19
- Restored the blueprint CTA below the Home guide list.
- Moved the `사내 지식 위키` label from the Home hero into the centered site header.
- Updated the starting guide link to use the actual dedicated `guides/agent-start` route, with `/guides/start` kept as a compatibility alias.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(8 files / 30 tests), `pnpm typecheck` 통과.

### 2026-05-19
- Simplified the Home screen so it now shows the search block first and a single recommended guide section second.
- Removed the visible project examples, FAQ, library, and project design blocks from the Home screen.
- Pinned the starting guide to the top of the recommended guide list and kept the dedicated start route resilient by resolving the guide document through slug/title/id fallback.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(7 files / 29 tests), `pnpm typecheck` 통과.

### 2026-05-19
- Fixed the Home guides tab "전체 보기" route so `/guides` renders the full guide category list again instead of the fixed starting guide document.
- Moved the fixed starting guide article view to `/guides/start` and updated the Home starting guide card to use that dedicated route.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(6 files / 28 tests), `pnpm typecheck` 통과.

### 2026-05-12
- docType 분류 체계를 12개 타입에서 5개 타입(`nav`, `guide`, `page`, `policy`, `ops`)으로 교체.
- 타입 정의: `RawConfluencePage`, `WikiDocument` 모두 5-type union으로 변경.
- 검색 스코어링: `isIndexWikiDocument`(nav 단일 체크), `getSearchDocTypeAffinity`(guide/page 모드별 가중치) 재작성, `rankSearchDocumentsIn`에 ops 사전 필터 추가.
- UI 필터: `CategoryPage`의 `HIDDEN_DOC_TYPES`, `searchRecommendations` policy 필터, `ArticleAskPanel` nav/ops 조기 반환, `vite.config` API 핸들러 slug 패턴 제거 → docType 기반 필터.
- 데이터 소스: `confluenceClient.ts`(`readDocType`, `resolveCategory`, `inferMetadataFromTitle`), `wikiDataSource.ts`(`readDocType`) 업데이트.
- `confluenceSnapshots.ts` 스냅샷 픽스처 전체 신규 타입으로 매핑.
- `WikiDocumentListItem.DOC_TYPE_LABELS` 5개 타입 레이블 업데이트.
- 모든 테스트 파일의 mock/fixture docType 값 갱신(confluenceClient, wikiDataSource, wikiDocuments, guideIndexGraph, GuideIndexGraphPage, wikiPagesHandler).
- 검증: `pnpm typecheck` 전체 통과, `pnpm test` 전체 통과(81/81: wiki-core 48, web 28, serverless 5).

### 2026-05-12
- GitHub 프로젝트 README 상세 페이지 구현.
- `GitHubProject`에 `readmeMarkdown` 필드 추가 (10,000자 cap), `fetchRepoReadme`로 통합.
- `ProjectDetailPage` 신규 생성: README 마크다운 렌더링 + GitHub 원본 링크.
- `projects/:slug` 라우트를 `ProjectDetailPage`로 교체.
- `ProjectsPage` 목록 카드를 GitHub 외부 링크 → 내부 `/projects/:slug`로 변경.
- `HomePage` 추천 프로젝트도 내부 링크로 통일.
- 검증: `pnpm typecheck` 통과, `pnpm test` 전체 통과(48/28/5).

### 2026-05-11
- Confluence 메타데이터 fetch 병렬화: `fetchConfluencePageRecords`의 순차 `for...await` 루프를 배치 크기 20의 청크 기반 `Promise.all()`로 교체.
- 130페이지 기준 직렬 130+ API 호출 → 7라운드 병렬로 압축, 초기화 시간 수십 초 → 수 초 수준으로 단축 예상.
- 검증: `pnpm test` 전체 통과(48/28/5), `pnpm typecheck`, `pnpm build` 성공.

### 2026-05-11
- 비개발자 사내 직원 대상 AI 답변 톤 강화: 기술 용어(MCP, CLI, npm 등) 첫 등장 시 괄호 설명 요구 지시, "친구에게 설명하듯" 비개발자 프로필을 검색·아티클 Ask 프롬프트 양쪽에 추가.
- `docs/prd/ai-ask-prompt-guide.md`에 사용자 프로필 섹션 신설.
- 추천/관련 페이지 분리 개선: 서버에서 AI 직접 선택 페이지를 `recommendedDocuments`(max 4), 랭킹 기반 나머지를 `relatedDocuments`(max 4)로 분리 반환.
- `resolveSearchDocumentSections` 업데이트: server-provided `relatedDocuments` 우선 사용, 없으면 기존 방식 하위 호환.
- 빈 검색어 UX 추가: `/search` 직접 접근 시 입력 안내 힌트, 빈 폼 제출 시 2.5초 시각적 힌트 표시.
- 관련 테스트(aiAsk, searchRecommendations) 업데이트 및 신규 추가.
- 검증: `pnpm test` 전체 통과(48/28/5), `pnpm typecheck`, `pnpm build` 성공.

### 2026-05-11
- Softened the search answer structure so `바로 할 일`, `예시`, `확인`, `주의`, and `확인 필요` are now optional helpers instead of a mandatory template.
- Updated the search prompt and PRD guidance so natural prose is the default and section headings only appear when they materially help the reader.
- Revalidated the prompt helper tests and workspace typecheck after updating the tone contract.

### 2026-05-11
- Rewrote the search and AI Ask prompt instructions so answers now speak in a friendlier, blog-like explanatory tone for 초·중급 AI 바이브코딩 users.
- Kept the recommendation ordering and answer structure intact while making the opening explanation more teaching-oriented.
- Added prompt-level regression coverage for the new tone language and fixed the web document type label map that typecheck exposed.

### 2026-05-07
- Reworked the search recommendation section so multiple strong pages can stay in `추천 페이지` in strongest-first order instead of forcing everything except the first card into `관련 페이지`.
- Updated the search prompt guide and contract to treat index/overview family pages as a multi-card recommendation path, with the family entry page first and strong follow-up pages next.
- Verified in Playwright that the cached `mcp가 뭐지?` result now renders three recommendation cards and three related cards, while the mobile overflow fix stays in place and the search/recommendation tests plus workspace typecheck still pass.

### 2026-05-07
- Fixed the search result page overflow regression by constraining answer sections and code-frame components with `min-width: 0` / `max-width: 100%`.
- Confirmed the mobile `/search?q=mcp가 뭐지?` viewport no longer grows wider than the screen after the code example is rendered.

### 2026-05-07
- Verified the live `/search?q=mcp가 뭐지?` browser path and confirmed the visible answer starts cleanly without raw JSON or prefix labels.
- Confirmed the recommendation sections render after the answer while keeping the visible schema keys hidden.

### 2026-05-07
- Reworked search recommendation selection so AI-recommended pages now stay first and generic fallback pages only fill the list when the model omits page links.
- Removed evidence-page mixing from the visible recommendation list and revalidated the search recommendation tests plus full workspace typecheck.

### 2026-05-07
- Removed the concept-question shortcut from `getIndexFirstSearchWikiDocumentsIn` so search candidate selection now keeps the documented index-first expansion path active for every question family.
- Added regression coverage for index-seeded concept searches and revalidated the wiki-core ranking suite plus typecheck.

### 2026-05-07
- Reconciled the search answer cleanup path so visible prefixes like `짧답:` and embedded JSON wrappers are stripped before rendering.
- Centralized answer normalization across the search parser and structured answer renderer so the visible surface no longer depends on a single UI-only cleanup pass.

### 2026-05-07
- Reworked the guide index map from stacked cards into an Obsidian-style graph board with node circles, connecting lines, and a filterable network view.
- Centered the graph board inside a bounded width and moved page labels below the circles so the graph itself is easier to read.
- Replaced the large support sections with a compact numeric dashboard below the board so the page stays graph-first.

### 2026-05-07
- Added a guide index graph view route that reuses the cached guide corpus to inspect index, child, prerequisite, next, related, orphan, and broken-link structure from a single page.
- Added a guides-category entry link to the new graph view so the structure map is reachable from the app.
- Added helper and page tests for graph grouping and empty-state rendering, then revalidated the web test suite and workspace typecheck.

### 2026-05-07
- Updated the search contract to make index-first candidate selection, guide keyword hints, score tuning, and memory cache invalidation rules explicit.
- Updated the AI prompt guide so search answers now explicitly follow the index-page expansion path before reading detailed pages.

### 2026-05-07
- Removed `ops` document input from AI prompt construction so AI answer generation now uses policy documents only.
- Removed the `ops` prompt payload from the Vite dev API and kept the policy context smaller for faster prompt assembly.

### 2026-05-07
- Strengthened the search contract so it now states the search candidate exclusion rules, including onboarding Q&A pages and the public-only corpus boundary.

### 2026-05-07
- Made the onboarding exclusion explicit in the data spec and AI prompt guide so the read model and prompt rules both state that `s*-***` Q&A pages are not fetched.

### 2026-05-07
- Added a Korean AI answer guideline document so prompt edits now start from a markdown reference instead of only the source file.
- Added a code breadcrumb in `aiAsk.ts` so future prompt changes are nudged to check the guideline first.
- Updated the PRD reading order to include the new AI prompt guide alongside the search-flow contract.

### 2026-05-07
- Reconciled the PRD definition docs with the current implementation so the stable Home, API, data, and search contracts are now reflected outside the progress ledger.
- Locked the current search-flow contract to the answer-first, no-evidence-quote, representative-page-above-related-page behavior used by the app.
- Updated the API and data specs to match the current runtime endpoints, hidden policy targets, and visible-public-page filters.

### 2026-05-06
- Added a query-profile-aware search ranking layer that distinguishes concept, setup, troubleshooting, comparison, planning, and general questions instead of treating `mcp` as a single setup trigger.
- Added doc-type-aware ranking boosts and penalties so broad overview pages can outrank tool-specific setup pages on conceptual questions.
- Tightened index-page expansion so generic guide index tokens no longer leak unrelated pages into the same search family.
- Added regression coverage showing that `mcp가 뭐지?` should prefer a broad overview page over tool-specific setup pages and that planning questions should not be misclassified as setup.
- Revalidated the wiki-core and web test suites after the ranking change.
- Confirmed the live dev API still needs a fresh server/cached-response check before shipping because the running local search endpoint can keep returning earlier cached answers until the process is restarted.

### 2026-05-06
- Verified the `guide-codex-cli-setup` page with Playwright MCP: the guide now shows one visible code frame for the command line, no separate related-page section under the article body, and TOC active highlighting stays in sync on click and at the bottom of the page.
- Fixed Confluence code macro rendering so the guide page now extracts command text from the stored CDATA/comment payload and no longer renders empty `bash` code frames.
- Rechecked the guide page with Playwright MCP and confirmed the `Guide Node.js Setup`, `Guide npm Setup`, and `Guide npx Setup` entries resolve to local wiki links.
- Removed the visible active-selection highlight from the guide-page table of contents so the list behaves as plain navigation without a confusing selected state.
- Removed the separate related-page block from guide/article pages, tightened TOC click behavior so the active heading updates immediately, and made guide callouts recurse through nested content so internal links and code blocks inside panels stay structured.
- Changed guide-page anchor handling so internal Confluence links resolve to local wiki detail routes when possible and otherwise stay inside the wiki app through a local search route rather than exposing raw external URLs.
- Simplified the shared wiki callout component to a Confluence-style bordered panel without the previous icon rail, and unified example commands into one combined shell code frame.
- Extended guide-link resolution and collection to use the same anchor-matching fallback path for local wiki navigation, and moved guide TOC highlighting to a scroll-plus-hash sync model.
- Consolidated code and callout rendering into shared `WikiCodeBlock` and `WikiCallout` components so the search answer surface and guide/article pages use one visual system.
- Strengthened guide-page link resolution with `data-linked-resource-id`, `data-linked-resource-title`, anchor-text, and slug/title fallback matching.
- Fixed the sticky guide TOC so clicking a heading updates the active highlight immediately and hash changes remain in sync.
- Added a unit test for the guide-link resolution path using the `Guide Node.js Setup` example and revalidated the web package plus the workspace.
- Reworked the search and guide rendering surfaces so code blocks now use a plain frame with only a top-right copy button, guide/recommendation cards no longer show `페이지 열기`, and the article link-badge pseudo-label was removed.
- Hardened Confluence-to-wiki link conversion with title/slug fallback matching so embedded guide links are more likely to resolve to local detail routes.
- Converted the search `주의` section into a visible warning callout so caution text does not disappear into a plain list item.
- Revalidated the updated search and guide pages with the web typecheck, workspace typecheck, targeted tests, and a repo-wide scan for removed UI labels.
- Reordered the search result surface so the representative guide card now comes after the support detail sections and before the related-page grid, matching the frozen contract.
- Fixed the article page hook placement so the guide view always evaluates hooks unconditionally before early returns.
- Froze the search and guide-page behavior into a canonical PRD contract so future changes must align with a stable source of truth before code is touched.
- Added the contract review gate to the development plan and recorded that no future search or guide-page change should be coded before the contract is checked.

### 2026-05-06
- Started Phase 1 search completion work for policy-targeting and response-contract cleanup.
- Made policy participation explicit in both AI answer schemas with a visible `policyNotice` field for search and page `AI Ask`.
- Kept policy pages hidden from visible search results while recording that they are part of the hidden Confluence answer-generation target set.
- Removed the duplicated search response field `guideDocuments` and kept `recommendedDocuments` as the single visible recommendation list.
- Verified targeted tests and workspace typecheck after the contract and UI updates.
- Hardened search response parsing so leaked schema-like sections can still recover `policyNotice`, evidence, and recommendations from malformed mixed-format model output.
- Confirmed that parser recovery is now stronger, but the Claude CLI install query can still return a one-line answer, which leaves a separate generation-quality gap open.
- Reworked the search AI contract so actionable results return structured fields for immediate actions, example commands, verification checks, and cautions.
- Confirmed the reproduced Claude CLI install query now returns a detailed actionable result plus bottom guide links instead of relying on a single freeform paragraph.
- Extended actionable search answer items with per-item related page ids and rendered answer evidence plus item-level wiki links directly in the search result surface.
- Confirmed the same live local query now returns structured `relatedPageIds`, but prerequisite environment guides are still missing from the retrieved public Confluence candidate set.
- Reworked the user-facing search flow again so the representative guide card appears after the support detail sections and before the related-page grid, with page-entry cards shown without summaries.
- Removed visible evidence-quote rendering from the search screen and added clearer article code/callout rendering plus bottom related-page navigation on article pages.
- Refined the visible wording and document rendering again: `추천 페이지` / `관련 페이지` labels now match the intended meaning, prefix-like lead-ins such as `짧답:` and `가장 짧게:` are stripped from the visible answer, Confluence internal links now rewrite to wiki detail routes, article summary/title duplication was reduced, and the sticky TOC now highlights the active section.

### 2026-05-06
- Added a dedicated analysis task workspace for the main search, page `AI Ask`, hidden policy context, and Home-page page-linking roadmap.
- Confirmed the current search retrieval path is deterministic lexical scoring with heuristic index expansion, not a verified semantic retrieval stack.
- Confirmed hidden `policy` pages are injected into both AI answer flows, but policy impact is not yet proven with dedicated benchmark cases.
- Confirmed the Home screen still uses static `HOME_CONTENT` lists and does not yet resolve featured sections to concrete wiki pages.
- Defined the next staged roadmap: baseline/contract cleanup, retrieval hardening, policy-grounding verification, wiki-like result UI, then Home-page data wiring.

### 2026-04-28
- Created monorepo scaffold with `apps/web` and `packages/wiki-core`.
- Added React/Vite/Tailwind/TypeScript/React Router stack.
- Implemented Home MVP screen with:
  - theme selector
  - hero search block
  - four main entry cards
  - featured guides list
  - featured projects list
  - project design CTA
- Added placeholder routes for guides, projects, library, FAQ, search, and project design.
- Added shared Home content policy validation in `packages/wiki-core`.
- Verified `pnpm install`, `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-28
- Added shared `WikiDocument` read model in `packages/wiki-core`.
- Added lightweight Confluence normalization helpers for sanitization and heading extraction.
- Replaced placeholder category pages with document-backed category pages.
- Added article detail routes for guides, projects, library, and FAQ.
- Updated search to query shared read-only documents instead of hard-coded strings.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-28
- Replaced direct document fixtures with Confluence-shaped raw snapshot fixtures.
- Routed shared wiki documents through the normalization layer instead of hand-authored final models.
- Exposed source snapshot links in article pages to make the current data lineage visible.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-28
- Realigned the Home screen styling to match the `Development Prompt` prototype more closely.
- Replaced the editorial header with a compact brand-and-theme top area.
- Removed the bottom policy-check block from the user-facing Home screen.
- Added a shared wiki data source layer that can load from either local snapshots or a remote endpoint.
- Switched category, article, and search pages to read through the shared async wiki source provider.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-28
- Reduced the main UI typography into a shared three-level scale for hero, section, and body text.
- Standardized page, panel, and section spacing through shared CSS component classes.
- Applied the same visual rhythm to Home, category, article, search, project-design, and loading/error states.
- Changed search results from static text rows to direct document links.
- Rechecked the `Development Prompt` source and removed the mistaken header navigation interpretation.
- Reworked the search page into grouped result sections for guides, projects, FAQ, and library.
- Corrected the Home lower-section typography, link-row interaction, and project-design CTA contrast.
- Added article-level relation panels for prerequisites, next documents, and related documents.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Promoted the Home top area into a shared site-wide GNB with active section links and theme control.
- Applied the same GNB to internal pages through `AppLayout`.
- Improved category list cards with guide order cues and lightweight metadata chips.
- Reworked the shared GNB into a normal in-flow site header with site name, user info, utility area, and theme control.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Refined the shared site header so the Home top area reads as a compact header rather than a large top section.
- Removed duplicate/non-actionable header elements: user/environment block, disabled settings control, and secondary brand helper text.
- Kept the Home search area in its existing position while reducing competing card and CTA typography.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Realigned the Home page to `docs/prd/sfood_wiki_home.jsx`.
- Replaced the separate stacked panel layout with a prototype-style shell and single rounded surface containing header and Home content.
- Rebuilt Home hero, entry cards, list panels, and project-design CTA with shared CSS component classes.
- Simplified the shared header to the prototype density with brand and theme control, while keeping Home route entry through the four cards.
- Verified `pnpm typecheck`, `pnpm test`, and `pnpm build`.

### 2026-04-29
- Hardened the remote wiki source boundary with payload shape validation, fixed space guard `63111172`, and public/current filtering.
- Kept the existing category, article, and search page contracts unchanged by normalizing remote records into the shared `WikiDocument[]` model.
- Updated the web provider to prefer `VITE_WIKI_REMOTE_ENDPOINT` and use generic user-facing load errors.
- Documented remote source runtime env usage in `README.md`.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Added a Confluence Cloud REST v2 read adapter backed by the env shape in `apps/web/.env.example`.
- Added Vite dev endpoint `GET /api/wiki-pages` so Atlassian credentials stay server-side during local development.
- Local dev now auto-selects `/api/wiki-pages` when `ATLASSIAN_SITE_NAME`, `ATLASSIAN_USER_EMAIL`, `ATLASSIAN_API_TOKEN`, and `CONFLUENCE_SPACE_ID` are configured.
- Verified live Confluence authentication and page listing for space `63111172`.
- Found that the sampled Confluence page properties are empty, so visible remote records remain blocked until `wiki.metadata` content properties are added.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Verified `.env.local` Confluence settings against space `63111172` (`AI Agent Wiki`) without exposing secret values.
- Inspected current Confluence pages and confirmed no existing `wiki.metadata` content properties were present before the update.
- Added or reconciled `wiki.metadata` content properties across all 130 current Confluence pages, using valid `docType`, `visibility`, `audience`, `status`, `prerequisites`, `next`, and `related` fields.
- Final Confluence metadata coverage: 130 with metadata, 0 missing, 96 public, 34 internal, 19 ops.
- Kept Ops, PRD, analysis, API spec, data model, architecture, migration, and development prompt pages non-public unless separately classified as public content.
- Deferred `/api/wiki-pages` and app read-path validation to a separate development/API session.

### 2026-04-29
- Verified `/api/wiki-pages` returning 130 live Confluence-backed records.
- Confirmed live remote data renders in category, article, and search routes.
- Allowed empty Confluence body HTML for valid index/navigation pages.
- Tightened remote visibility to `current`, `public`, `published`, and non-`ops` records.
- Removed user-facing implementation labels from search and article source UI and added a favicon data URL.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Added `packages/serverless` with a Lambda-compatible `wikiPagesHandler` for the production equivalent of the local Vite `/api/wiki-pages` endpoint.
- Reused the shared Confluence adapter and `{ pages }` remote source contract from `wiki-core`.
- Added CORS/preflight handling, method rejection, missing-env errors, and upstream failure mapping.
- Documented production endpoint env and `VITE_WIKI_REMOTE_ENDPOINT` wiring in `README.md`.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Stopped AWS/deployment work and continued with local-only browsing UX improvements.
- Added a shared document list item component for category and search result cards.
- Added category page list search, audience filter, document type filter, sort control, and result counts.
- Updated search results to show grouped counts and suppress empty groups before useful results.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Reworked the shared visual density toward a conventional wiki/documentation surface.
- Reduced page and Home typography scale, section padding, card padding, and oversized rounded corners.
- Replaced pill-like metadata treatment with compact rectangular chips.
- Kept the Home search position intact while making surrounding sections less landing-page-like.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Replaced the text-based theme segmented control with compact icon buttons.
- Further reduced shared title and Home card typography for a denser wiki reading surface.
- Added article HTML block rendering for headings, paragraphs, lists, code blocks, tables, quotes, and fallback fragments.
- Removed direct article body `dangerouslySetInnerHTML` usage from `ArticlePage` in favor of the block renderer boundary.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Converted the article table of contents into a sticky side navigation so it remains useful while reading long documents.
- Reworked article relation links into a single `문서 흐름` graph block for prerequisites, next documents, and related documents.
- Moved Phase 5 Metadata and Graph to In Progress with the first visible graph UX pass.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Unified form/control typography so search inputs and select controls inherit the same body font scale.
- Limited remote-readable Confluence pages to guides, FAQ, and the `Playbook` page.
- Propagated Confluence `parentId` into the read model and added graph reference validation helpers.
- Added a local read-only AI Ask endpoint using OpenAI Responses API structured output.
- Added an article Ask panel that renders AI answer, Confluence evidence, unsupported claims, and suggested documents.
- Verified actual Confluence `/api/wiki-pages`: 78 records, only `faq` and `guides`, `Playbook` included, 0 records outside allowed scope.
- Verified actual Confluence `Playbook` AI Ask call returned the required structured response shape.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Fixed natural-language search misses by scoring title, summary, headings, and body HTML tokens instead of requiring an exact full-query substring.
- Added a search follow-up Ask panel so users can continue the query against the most relevant matched document.
- Verified the query `윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?` against actual Confluence data and confirmed top matches are returned.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Reworked the search page into a chatbot-style result screen with only the shared top navigation above the content.
- Added `/api/wiki/ai/search` to analyze the top Confluence search results with OpenAI structured output.
- Changed search UI to show the user question, a natural-language AI answer, a compact guide-document summary, Confluence evidence, and unsupported claims.
- Removed the previous grouped result sections and follow-up wording from the search page.
- Verified the same real Confluence query returned an AI answer, 6 guide links, 3 evidence items, and structured unsupported claims.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Added in-memory caching for visible Confluence records/documents in the local dev API.
- Added in-memory caching for repeated AI search answers by normalized question.
- Reduced AI search latency by limiting top search context, trimming document text, setting an output token cap, and lowering reasoning effort.
- Added chatbot loading feedback with spinner, progress bar, and status text.
- Improved AI answer readability by rendering paragraphs and bullet/numbered lists as structured UI blocks.
- Cleared the floating search input after submit and replaced the text submit button with an icon button.
- Verified repeated actual AI search calls returned cached responses faster in the active dev session.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Expanded the remote readable/searchable policy to guides, projects, FAQ, and the `Playbook` page.
- Excluded onboarding pages from the remote page cache before search and AI answer generation.
- Changed search recommendations so the answer can show project and FAQ matches as well as guide matches.
- Verified actual Confluence `/api/wiki-pages`: 82 records, categories `faq`, `guides`, and `projects`, `Playbook` included, 0 records outside allowed scope, and 0 onboarding records.
- Verified actual category counts: `faq: 7`, `guides: 69`, and `projects: 6`.
- Verified actual AI search repeated-call cache: first call 42ms and second call 3ms in the active dev session.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Found that onboarding Q&A pages such as `s3-003` were still entering search because they were categorized as `guides` and did not include `onboarding` in title or slug.
- Excluded onboarding Q&A pages matching the `s*-***` title/slug pattern from the remote page cache.
- Restarted the local dev server to clear in-memory Confluence and AI search caches.
- Verified actual Confluence `/api/wiki-pages`: 67 records, `s3-003` count 0, onboarding Q&A count 0, and onboarding title/slug count 0.
- Verified actual AI search for `윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?` no longer returns `s3-003` or onboarding references.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Changed search result recommendation links to internal wiki detail routes instead of Confluence source URLs.
- Removed the visible search evidence section from the chatbot-style search result screen.
- Removed the article page source-document link from the wiki detail header.
- Added AI-selected `recommendedPages` to the search response so displayed recommendations are chosen from the AI-grounded result set rather than raw token rank alone.
- Tightened AI search answer instructions so prose is the default, lists are used only for list-shaped content, and missing exact-target coverage is stated before related setup guidance.
- Verified actual AI search for `윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?`: no `s3-003`, no onboarding references, internal-only recommendation hrefs, no source URLs, prose-first answer, and exact-target gap stated first.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Changed search candidate selection to score matching Confluence index pages first, then expand into detailed documents for AI search context and recommendations.
- Kept index pages out of recommended search results by using them as routing candidates rather than answer documents.
- Added a hidden `ops` policy cache path for Confluence `docType: ops` pages; these pages remain excluded from `/api/wiki-pages`, search results, and recommendations.
- Added AI search prompt context for hidden ops policy documents with instructions not to cite, summarize, recommend, or expose them.
- Verified actual local API search: 67 visible pages, 0 exposed `ops` pages, and no index/ops/sourceUrl values in recommended AI search documents.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Changed search result document links to open internal wiki detail pages in a new tab so the active search page does not disappear.
- Removed the secondary explanatory copy below the search loading progress bar.
- Changed the search page to keep previous question/answer turns in the current session when the user submits another search.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Normalized search input placeholder, user question, assistant answer, loading text, and search summary typography to the compact shared `13px` UI scale.
- Added explicit spacing between each search question and answer turn so chatbot results stay readable.
- Restarted the local dev server on `http://127.0.0.1:5173/`.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Reworked article AI Ask into a fixed bottom conversation dock so document content and generated answers remain visible together.
- Changed article AI Ask submit to an icon-only control and kept previous question/answer turns in the current document session.
- Rendered article AI Ask answers as structured paragraphs/lists and opened recommended internal wiki documents in a new tab.
- Fixed article table-of-contents anchors by applying normalized heading ids to rendered Confluence heading blocks.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Removed explanatory helper copy from the search empty state, search loading state, article AI Ask header, article AI Ask loading state, and document graph header.
- Verified the removed helper phrases no longer appear in app source.

### 2026-05-04
- Preserved search candidate relevance order instead of flattening by category.
- Removed prior AI answer prose from follow-up search query rewriting.
- Narrowed index-first expansion to linked or directly relevant detail pages instead of broad same-category fallbacks.
- Added richer wiki-style answer rendering for inline links, markdown tables, info/warning callouts, and collapsible code blocks.
- Added a visible document-based answer header to the search result screen.
- Verified `pnpm --filter @sfood/wiki-core test -- src/lib/wikiDocuments.test.ts src/lib/aiAsk.test.ts`, `pnpm --filter @sfood/web test -- src/ui/structuredAnswer.test.ts`, `pnpm typecheck`, `pnpm build`, and `pnpm test`.
- Started the local dev server successfully at `http://localhost:5173/`.
- Added staged loading text to the search flow so users can see the current search step instead of only a spinner.
- Strengthened setup/how-to answer prompts so search answers are pushed toward executable blocks rather than one-line summaries.
- Kept the shared markdown-style answer renderer in place so headings, lists, quotes, and code blocks remain readable when the model emits structured output.
- Surfaced the Confluence grounding snippets in search results so users can see which pages supported the answer.
- Renamed the follow-up document section to `추천 페이지` to better match the Confluence-search workflow.
- Removed the `관련 페이지별 요약` instruction from the search prompt so the answer stays focused on synthesis from the retrieved Confluence pages.
- Added a shared structured-answer renderer with copyable code blocks and heading-level styling.
- Changed recommendation ordering so answer-used pages appear ahead of generic fallback matches.
- Normalized JSON-shaped assistant answer payloads so the visible answer body no longer leaks raw schema text.
- Removed the synthetic `핵심` fallback heading and instead pushed the model toward fuller explanatory answers.
- Converted `recommendedPages` to visible `recommendedDocuments` on the search response and removed the raw page-id array from the user-facing payload.
- Normalized the search API cache and server-side answer extraction so stale JSON-shaped answer artifacts no longer leak into the rendered UI for repeated searches.
- Verified in-browser on `http://localhost:5173/search` that `Windows에서 Codex CLI를 설치하는 최소 절차는?` and `윈도우에 codex를 설치하는 방법은?` render without raw JSON leakage and show the structured answer header, warning callout, and recommendation links.
- Hid the visible `핵심 인용` and `지원되지 않는 항목` sections from the search answer surface so those details remain internal to answer generation.
- Adjusted the search answer guidance so relevant wiki page links can appear inline in the answer body when a document directly supports a step or detail, while the detailed page still opens in a new tab.
- Promoted standalone terminal commands in search answers into copyable code blocks so install steps like `npm install -g @openai/codex` are easier to reuse.
- Removed the extra answer explanation header section from the search result screen and tightened the code block component toward a compact GitHub/Notion-style card with improved line-number alignment.
- Removed the visible `문서 근거` section from search results so only the answer body and clickable recommendations remain on screen.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Renamed the article `AI Ask` panel to Korean `문서 질문`.
- Reduced article question dock width, max height, padding, and reserved bottom spacing so it aligns more closely with the article layout and no longer leaves excessive space below document flow.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Removed the article document-flow section because the feature identity was not yet defined.
- Moved the article question panel from viewport-fixed placement into the article panel as full-width sticky bottom content, eliminating the remaining gap below the article body and aligning it with the document width.
- Verified no article graph references remain in the web source.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Explicitly normalized search and article question placeholder font sizing to the shared `13px` input scale.
- Added a draggable top resize handle to the article question component so the answer area can be expanded upward.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Normalized remaining shared site typography away from broad Tailwind `text-sm`/`text-base`/`text-xl` defaults toward fixed compact pixel sizes.
- Added global form-control and placeholder font-size enforcement so search and article question inputs use the same `13px` UI scale.
- Verified no broad `text-sm`/`text-base`/`text-lg`/`text-xl` utilities remain in `apps/web/src/styles.css`.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Reworked the article question component back to bottom-fixed positioning.
- Kept the bottom edge anchored during resize so dragging the handle expands the question/answer area upward instead of pushing page content downward.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Adjusted article question panel width to match the article panel instead of the viewport.
- Verified with Playwright DOM measurement: article question width `698px`, article width `698px`, width delta `0px`, bottom fixed at `12px`, and input/placeholder font size `13px`.
- Deleted Playwright auto-generated snapshot/log artifacts after measurement.

### 2026-04-30
- Changed article question behavior so it starts as a compact 64px input bar and automatically expands to 280px when the user submits a question.
- Added auto-scroll-to-latest behavior for the article question conversation area.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Removed the separate article question resize handle element.
- Made the top border area of the article question panel itself act as the height resize handle so resizing does not consume layout height or push the input row down.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-05-04
- Added a hidden `policy` document path to the Confluence read model and kept it out of visible wiki results.
- Built compact policy summary documents with in-memory relevance scoring so Ask flows can reference policy without loading full page bodies into the prompt.
- Threaded selected policy context into both document Ask and search Ask prompt construction while preserving the separate hidden `ops` context path.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-05-04
- Normalized mixed-language search tokens by stripping common Korean particles from query terms.
- Added a small email/setup synonym expansion layer so `gmail`, `mail`, `outlook`, and `m365` style queries can surface the intended setup guides.
- Boosted slug and docType signals in search scoring and added regression tests for mixed-language queries.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-05-04
- Added a mail-intent ranking boost so Gmail and Microsoft 365 setup guides outrank generic MCP setup documents for mail-focused queries.
- Confirmed in-browser search now surfaces the mail setup guides instead of generic MCP docs for `mail을 보내는 mcp는 어떻게 설정해?`.
- Added a conservative metadata fallback so visible guide-style pages without `wiki.metadata` still enter the searchable corpus.
- Confirmed in-browser search now surfaces the Gmail setup page `84705630` and Microsoft 365 setup page `83919146` as recommendations.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-05-04
- Removed the overly strict search-answer length cap and told the model to use Markdown-style structure for readable answers.
- Added a shared markdown-style answer-block parser so headings, quotes, code blocks, and real step-by-step lists render cleanly in both search and article Ask views.
- Forwarded recent conversation history through search and Ask requests so follow-up questions reuse the previous context.
- Tuned the answer prompt toward practical, action-first guidance so setup questions read like instructions instead of summaries.
- Verified `pnpm --filter @sfood/web test`, `pnpm --filter @sfood/wiki-core test`, `pnpm typecheck`, and `pnpm build`.

### 2026-05-04
- Added a repeatable generic-vs-wiki benchmark script for eight representative questions and recorded a `similarity` score against a 90-point completion target.
- Expanded search retrieval for broad planning questions so the answer context can combine top matches across the corpus instead of staying tied to a single narrow index path.
- Added a typo-aware Gmail/email intent boost so `gamil`-style queries can land on email-related setup guides instead of generic MCP pages.
- Latest benchmark result reached `79.5 / 100` average wiki similarity, which is improved but still below the requested `90 / 100` threshold.
- Verified `pnpm benchmark:search` after the prompt and retrieval tuning.

## Current Working State
- The project is inside Phase 2.
- `wiki.metadata` content properties have been added to every current Confluence page in space `63111172`.
- Public visibility is currently further narrowed by application policy to guide, project, FAQ, and `Playbook` pages, with onboarding pages excluded.
- `/api/wiki-pages` now returns live Confluence-backed guide/project/FAQ/Playbook records and category/article/search routes render from remote data.
- A production serverless handler equivalent to the Vite dev middleware exists in `packages/serverless`, but AWS/deployment work is paused by request.
- The latest local browsing UX pass is complete for category/search result scanning.
- The latest design pass reduces oversized fonts, spacing, and rounded section styling across Home, category, search, and article surfaces.
- Article body rendering now has a first block/component boundary for Confluence HTML.
- Article pages now have sticky table-of-contents navigation.
- Article pages now include a fixed bottom read-only AI Ask conversation panel backed by structured OpenAI responses.
- Search now checks matching index pages before expanding into detailed body-token matches.
- Search results now render as a chatbot-style answer page with recommended document links opening internal wiki detail routes.
- Search result links now open in a new tab and the current search session keeps previous turns while submitting follow-up searches.
- Confluence `ops` pages are cached as hidden policy context for AI search but are not exposed as visible wiki records.
- Confluence `policy` pages are cached as hidden policy context and are selected through compact prompt summaries before AI answer generation.
- Local search now caches Confluence and repeated AI search responses and shows progress while waiting.
- The next implementation target is policy-aware AI Ask quality tuning against actual Confluence pages and parent/ancestor breadcrumb refinement.
- The Home screen should follow `docs/prd/sfood_wiki_home.jsx` as the approved visual baseline unless explicitly redesigned.
- The shared header should match the prototype density: compact brand plus theme control inside the app surface.
- The app is buildable and viewable locally with `pnpm dev` or `pnpm preview`.
- Local Confluence env values are now supported through the Vite dev endpoint; production should use the serverless handler with server-side Atlassian env values.

## Resume Checklist For Next Session
1. Read `architecture.md`, `ui-spec.md`, and this file.
2. Keep the no-separate-DB rule intact.
3. Continue from the shared read-only wiki model rather than rebuilding page fixtures locally.
4. Use the existing snapshot/remote source boundary rather than bypassing it.
5. Keep using `/api/wiki-pages` for local remote-mode verification; use `packages/serverless` for the production endpoint path.
6. Do not break the current Home baseline while replacing fixture-backed category/article data.
7. Keep AWS/deployment work paused unless explicitly resumed.
8. Continue with local AI Ask quality tuning against actual Confluence pages before broader feature expansion.

## Rules For Updating This File
- Update the phase table whenever a phase starts or completes.
- Append a dated entry under `Latest Completed Work` after every meaningful implementation step.
- Keep `Current Working State` aligned with the real next step.
