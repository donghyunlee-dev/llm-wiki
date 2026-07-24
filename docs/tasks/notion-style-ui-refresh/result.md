# notion-style-ui-refresh Result

> 상태: Task 1-6(구현) 완료. Task 8(최종 검증: `pnpm test`/`typecheck`/`build`, Playwright 라이트+다크, Codex 비판 리뷰)은 아직 실행되지 않았다. 이 문서는 구현 범위에 대한 초안이며, 검증 결과는 Task 8 완료 후 별도로 채워진다.

## Delivered Scope
- `apps/web`의 시각 톤을 Notion/Linear 스타일로 개편(브랜드 컬러 토큰 체계는 유지, `@sfood/ui` semantic 토큰만 참조):
  - **패널/카드 플랫화**: `.page-panel`/`.page-panel-soft`, `.empty-card`, `.list-row-link`, `.document-list-item`, `.home-card`, `.article-aside`(TOC), `.chat-guide-spotlight`, `.home-guide-card`에서 `border`/`box-shadow`를 제거하고 배경 톤 차이만으로 구분. 버튼/입력/페이지네이션 등 기능 컨트롤은 기존 테두리를 그대로 유지(계획서 명시 가드레일).
  - **좌측 액센트 바/브랜드 틴트 제거**: 홈 "시작 가이드" 카드(`.home-guide-card-featured`)를 브랜드 색 배경/테두리 대신 중립 톤(`bg-card-hover-bg`)만으로 구분하도록 재작성.
  - **타이포그래피/여백 확대**: `.page-shell` 패딩 확대, `.article-content`/`.article-paragraph` 본문 폰트 13px→14px·`leading-6`→`leading-7`, `.article-toc`/`.article-toc-link` 간격 확대(긴 제목 2줄 줄바꿈 여유 확보).
  - **`/guides` 카드→구분선 리스트 전환**: 신규 `.document-list` 클래스(`divide-y`)를 `CategoryPage.tsx`에 적용하고 `.document-list-item`을 divider row 스타일로 재작성. 공용 `.section-stack`(다른 페이지가 재사용)은 건드리지 않아 회귀 범위를 격리.
  - **TOC 활성 헤딩 표시(scroll-spy)**: `ArticlePage.tsx`에 `IntersectionObserver` 기반 `activeHeadingId` 상태를 추가하고 `.article-toc-link-active`(텍스트 색상 + semibold만, 막대/배경 없음)로 표시. 2026-05-06에 기록된 "TOC 활성 하이라이트 제거" 결정을 이번 세션의 명시적 요청으로 대체.
  - **검색 사용자 질문 pill 말풍선**: `.chat-message-user`를 솔리드 브랜드 배경 블록에서 `rounded-full bg-accent-soft text-page-fg` 연한 pill로 교체.
- 다크모드는 기존 `[data-theme="dark"]` 토글 메커니즘 위에서 동일한 플랫/좌측-바-금지 원칙을 적용.

## Changed Files
- `apps/web/src/styles.css` — 위 모든 컴포넌트 클래스 재작성/신규 추가(`.document-list`, `.article-toc-link-active`)
- `apps/web/src/ui/pages/CategoryPage.tsx` — `section-stack` → `document-list` 클래스 교체
- `apps/web/src/ui/pages/ArticlePage.tsx` — TOC scroll-spy(`IntersectionObserver`, `activeHeadingId`) 추가
- `apps/web/src/ui/pages/ArticlePage.test.tsx` — 신규, TOC 활성 클래스 클릭 동작 테스트
- `docs/tasks/notion-style-ui-refresh/{spec,plan,tasks,test-result,result}.md` — 이 태스크 문서(현재 커밋)

## Key Decisions
- `@sfood/ui` React 컴포넌트는 직전 세션에서 확인된 이 실행 환경의 dist 빌드 산출물 미반영 제약이 해소되지 않아, 이번 개편도 CSS 토큰 레벨(`@apply` + 기존 semantic 변수)에서만 진행했다.
- `.section-stack`을 직접 수정하지 않고 `/guides` 전용 `.document-list` 클래스를 신설한 것은, `StaticPageShell.tsx`/`ProjectsPage.tsx`/`ArticlePage.tsx` 메타데이터 칩 행 등 다른 화면이 `.section-stack`을 공유하기 때문 — 회귀 범위를 `/guides`로 격리하기 위한 의도적 선택이다.
- TOC 활성 표시를 텍스트 굵기(semibold)만으로 제한한 것은, 사용자가 명시적으로 거부한 "좌측 액센트 바" 패턴(`feedback_no_ai_cliche_accent_bar` 메모리)을 다시 도입하지 않기 위한 설계 원칙 준수다.

## Open Gaps
- **Task 8(최종 검증) 미실행**: `pnpm test`/`pnpm typecheck`/`pnpm --filter @sfood/web build`, Playwright MCP 라이트+다크 4개 화면 확인, Codex 비판 리뷰가 아직 수행되지 않았다. 이 문서와 `test-result.md`는 Task 8 완료 후 실제 결과로 갱신되어야 한다.
- `@sfood/ui` React 컴포넌트(Button/Card 등)는 여전히 이 실행 환경의 dist 빌드 미반영 제약으로 사용하지 못했다(직전 태스크에서 이미 기록된 Open Gap과 동일) — 정상 환경 재검증 후 컴포넌트 단위 교체를 후속 과제로 남긴다.
- `/guides` 카드→리스트 전환이 기존 `CategoryPage.test.tsx`의 구조 의존 assertion을 깨지 않았는지는 Task 8의 자동화 테스트 실행으로 확정되어야 한다.

## Next Steps
- Task 8을 별도 세션에서 수행: 전체 테스트/타입체크/빌드 실행, Playwright MCP로 4개 화면 라이트+다크 확인, Codex 비판 리뷰 후 `test-result.md`/`result.md`를 실제 결과로 갱신.
- Task 8 완료 후 `docs/prd/implementation-status.md`의 이번 세션 기록도 "구현 완료, 최종 검증 진행 중" → "검증 완료" 상태로 후속 갱신이 필요하다.
