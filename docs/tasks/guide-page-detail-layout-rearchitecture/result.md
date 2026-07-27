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
