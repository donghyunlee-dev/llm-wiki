# lesson-nav-fix-and-pretendard-font Result

## Delivered Scope
1. "이전" 버튼이 레슨 경계를 넘지 못하던 버그 수정 — 이전 레슨의 마지막 씬으로 이동하도록 `getPreviousLessonSlugFrom`(wiki-core) 신규 추가 + `goPrevious()` 수정, 진입 애니메이션 방향(`backward`)도 함께 수정.
2. Pretendard 폰트 적용 — woff2가 설치돼 있지 않음을 확인 후 `pretendard` npm 패키지 설치(가변 폰트 + 유니코드 서브셋 지연 로딩), 본문/코드-인용구 폰트 스택을 앱 레벨 토큰으로 오버라이드.

## Changed Files
- `packages/wiki-core/src/lib/lessonDocuments.ts` / `.test.ts` — `getPreviousLessonSlugFrom` 추가
- `apps/web/src/ui/pages/LessonReaderPage.tsx` / `.test.tsx` — `goPrevious()` 레슨 경계 이동 + 전환 방향
- `apps/web/package.json`, `pnpm-lock.yaml` — `pretendard` 의존성 추가(무관한 `@sfood/ui` lockfile drift는 되돌림)
- `apps/web/src/styles.css` — Pretendard `@import`, `--font-sans`/`--font-mono` 오버라이드, blockquote 모노스페이스

## Key Decisions
- **"Pretendard Variable"(가변 폰트) 사용, 정적 "Pretendard" 미사용** — 가변 폰트 1세트가 모든 굵기(45~920)를 커버하고 유니코드 서브셋 단위로 지연 로딩되어, 굵기별 정적 파일을 쓰는 것보다 훨씬 적은 다운로드로 동일한 결과를 낸다. npm 패키지가 실제로 등록하는 이름이 "Pretendard Variable"이라 토큰 값도 그 이름을 그대로 사용(Codex 리뷰로 확인).
- **`@sfood/ui` lockfile 커밋 해시는 원상 복구** — `pretendard` 설치 중 git `#main` 의존성이 최신 커밋으로 자동 재해석되는 부작용이 있어, 이번 작업과 무관한 디자인 시스템 변경을 함께 끌고 오지 않도록 되돌림.
- **레슨당 씬이 여러 개인 미래 상황도 고려해 "이전 레슨의 마지막 씬"으로 이동** — 단순히 이전 레슨의 첫 씬이 아니라 실제 마지막 씬 인덱스를 계산해서 이동.

## Open Gaps
- `listLessonDocumentsFrom`이 `courseId`/`order`가 없는 레슨을 모든 정렬된 코스 뒤에 이어붙이는 기존 설계상, `getPreviousLessonSlugFrom`/`getNextLessonSlugFrom` 둘 다 마지막 정렬 레슨 ↔ 첫 unordered 레슨을 인접한 것처럼 연결할 수 있음(기존 `getNextLessonSlugFrom`에도 이미 있던 특성). 실 콘텐츠(23개 레슨 모두 courseId/order 보유)에는 영향 없어 이번 스코프에서는 재설계하지 않음 — 향후 메타데이터 누락 레슨이 실제로 생기면 재검토 필요.

## Next Steps
- 없음(위 Open Gap은 실제로 문제가 되는 콘텐츠가 생길 때 재검토).
