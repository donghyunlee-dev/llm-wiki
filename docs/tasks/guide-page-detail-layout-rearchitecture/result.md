# guide-page-detail-layout-rearchitecture Result

## Delivered Scope
1. `ArticlePage`/`StartingGuidePage`를 `CardLayout`(공용 `site-shell`) 밖, `AppLayout`의 직계 자식으로 재배치(`SearchPage`와 동일 패턴) — TOC를 공용 max-width 컨테이너에서 구조적으로 분리.
2. 순수 flex 2단 레이아웃(`.guide-detail-shell` > `.guide-detail-row` > 본문/TOC)으로 재구성 — `position:fixed`/뷰포트 계산식을 전면 제거해 스크롤바 폭 오차의 근본 원인을 제거.
3. "목차" 라벨을 내부 스크롤 박스(`.guide-detail-toc-scroll`) 밖의 별도 헤더(`.guide-detail-toc-header`)로 분리 — 긴 목차 스크롤 시 라벨이 사라지는 버그를 구조적으로 수정.
4. Ask 도크/뒤로가기 버튼 위치를 새 레이아웃에 맞춰 재계산(양쪽 anchor 명시 + mx-auto 중앙 정렬 패턴 재사용).
5. 홈 화면 미완성 blueprint 섹션 숨김 처리(렌더 제거 + 데드 코드/텍스트 헬퍼 정리).
6. `[Type]` 대괄호 접두어 제거 필터를 문서 내 인라인 링크, 그래프 포커스바, 정책 출처 링크에 추가 적용(표시 텍스트만, href/매칭 로직 불변).

## Changed Files
- `apps/web/src/router.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/ui/pages/ArticlePage.tsx`
- `apps/web/src/ui/pages/GuidesPage.tsx`
- `apps/web/src/ui/pages/HomePage.tsx`, `HomePage.test.tsx`
- `apps/web/src/ui/pages/ArticleContentRenderer.tsx`
- `apps/web/src/ui/pages/GuideIndexGraphPage.tsx`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`
- `packages/wiki-core/src/lib/homeContent.ts`
- `docs/tasks/guide-page-detail-layout-rearchitecture/`(신규)

## Key Decisions
- **왜 flex인가**: 이전 2차례의 `position:fixed`+`calc(50%±...)` 접근은 뷰포트 폭(스크롤바 포함)과 실제 문서 폭(스크롤바 제외) 간의 불일치를 반복적으로 유발했다(Codex가 두 차례 모두 발견). 순수 flexbox는 컨테이너 상대적으로 동작해 이 문제가 원천적으로 발생하지 않는다.
- **왜 CardLayout 밖으로 빼는가**: `site-shell`의 `max-w-6xl`이 유지되는 한, TOC를 아무리 구조적으로 분리해도 "화면 우측 끝"이 될 수 없다(최대 1152px 폭 안에서만 움직임). `SearchPage`가 이미 검증한 선례(CardLayout 우회)를 그대로 재사용.
- **목차 라벨 분리는 sticky보다 안전**: `position: sticky`를 스크롤 박스 안에서 쓰는 대신, 라벨을 완전히 별도 요소로 분리 — "항상 보임"이 CSS 특수 케이스가 아니라 DOM 구조 자체로 보장됨.
- **넓은 화면의 여백은 의도된 결과**: 1920px에서 본문-TOC 간 447px 여백이 발생하지만, 이는 "TOC는 화면 끝에 고정, 본문은 그와 무관하게 자체 영역에서 중앙 정렬"이라는 사용자의 명시적 요구를 문자 그대로 구현한 결과 — 별도 완화 조치를 추가하지 않고 투명하게 문서화.

## Open Gaps
- 없음 — 요청된 5개 항목 모두 구현·검증 완료.

## Next Steps
- 없음.

## 추가 수정 (2026-07-27) — Ask 패널 전송 버튼이 컨테이너 밖으로 삐져나오는 버그

사용자가 검색창 스크린샷을 다시 제시하며 지적 — 실측 결과 전송 버튼이 `.article-ask` 바깥 둥근 컨테이너 아래로 5px 튀어나와 있었음(`getBoundingClientRect()`로 확인). 원인: `.article-ask-form-textarea`의 `min-h-[56px]`가 이전 `minRows=2`/도크 92px 시절 값 그대로 남아 있었음 — `min-height`는 JS가 계산한 인라인 `height`보다 항상 우선 적용되는 하한선이라, `minRows`를 1로, 도크 높이를 68px로 줄인 이후에도 텍스트영역이 56px로 강제되어 폼 전체가 도크보다 커져 버튼이 밀려 나옴.

## 추가 수정 (2026-07-27) — 목차 간격 축소, 검색 버튼 스타일 사이트 전체 통일

- **목차 간격**: `.article-toc`의 `space-y-1.5`→`space-y-0.5`, `.article-toc-link`의 `py-1.5/leading-6`→`py-1/leading-5`로 축소 — 항목당 세로 폭이 약 42px→30px로 줄어 같은 뷰포트 높이에서 더 많은 목차 항목이 스크롤 없이 보임(실측: 900px 높이에서 기존에 넘치던 목차가 더 이상 내부 스크롤 불필요, `scrollHeight === clientHeight`로 확인).
- **검색 버튼 통일**: `ArticleAskPanel`(문서 상세 페이지 하단 Ask 패널)의 전송 버튼만 유일하게 실심 accent 배경(`bg-accent text-white`)과 종이비행기 아이콘을 쓰고 있어, 홈/`/guides` 목록/검색 페이지가 공유하는 중립 스타일(`prompt-composer-button`의 `bg-page-bg`/`border-panel-border`, 돋보기 아이콘)과 달랐음. `.article-ask-form-button`에서 색상 override를 제거하고 아이콘을 동일한 돋보기 SVG로 교체 — 이제 사이트 내 모든 "검색/전송" 버튼이 동일한 스타일. `SearchHero`/`CategoryPage`/`SearchPage`는 이미 이 중립 스타일을 쓰고 있어 변경 불필요했음(감사 완료). `ArticleSelectionAskButton`(텍스트 선택 시 뜨는 "질문하기" 필 버튼)은 입력창에 붙은 아이콘 버튼이 아니라 별도의 텍스트+아이콘 컨텍스트 액션이라 이번 통일 대상에서 제외.
- 검증: `pnpm typecheck`/`test`(68)/`build` 통과. Playwright로 목차 밀도, 버튼 스타일(라이트·다크), `/guides` 목록 페이지와의 시각적 일치 확인.

- 수정: `min-h-[56px]` → `min-h-[36px]`(minRows=1 기준: leading-6 24px + py-1.5 12px)로 정정.
- 검증: `pnpm typecheck`/`test`(68)/`build` 통과. Playwright로 버튼-컨테이너 겹침 재측정(`overflow: -11`, 더 이상 넘치지 않음) + 데스크톱/모바일/다크 모드 스크린샷 확인.
