# search-three-pane-layout Plan

## Summary
- `/search` 페이지를 3단(대화 목록/답변 스트림/컨텍스트 패널) 레이아웃으로 재구성한다. 새 localStorage 훅으로 대화 CRUD·정렬·용량 제한을 관리하고, `SearchPage`의 기존 턴 렌더링 로직은 최대한 재사용한다. 서버 응답 스키마에 `title` 필드를 추가해 대화 제목을 자동 생성한다.

## Impacted Modules
- `apps/web/src/ui/pages/SearchPage.tsx` — 3단 셸로 감싸고 conversation state를 localStorage 훅 기반으로 교체
- `apps/web/src/ui/pages/search/` (신규 디렉터리) — `ConversationSidebar.tsx`, `SearchContextPanel.tsx`, `useSearchConversations.ts`, 관련 테스트
- `apps/web/src/ui/searchRecommendations.ts` — 우측 패널 누적/중복 제거 로직에 필요한 유틸 추가(또는 신규 파일 `searchContextAccumulation.ts`)
- `apps/web/src/styles.css` — 3단 그리드, 사이드바, 드로어(모바일) 스타일 추가
- 서버 측 AI 검색 핸들러(`aiAsk.ts` 등, 정확한 경로는 구현 시 확인) — 응답 스키마에 `title` 필드 추가
- `docs/prd/ai-ask-prompt-guide.md`, `docs/prd/search-flow-contract.md` — `title` 필드 추가와 우측 패널 순서(추천→관련→FAQ)가 기존 계약과 충돌하지 않는지 확인, 필요 시 문서 갱신

## Architecture Approach
- 대화 영속성은 순수 클라이언트 훅(`useSearchConversations`)으로 분리해 `SearchPage`는 UI 조합에만 집중하게 한다. localStorage 접근은 이 훅 내부에만 두고, 나머지 컴포넌트는 훅이 반환하는 데이터/함수만 사용한다(persistence와 UI 분리).
- 기존 `SearchAnswer`, `SearchDocumentSummary` 타입과 `searchRecommendations.ts`의 선택 로직은 그대로 재사용하고, 우측 패널 누적/중복 제거는 별도 순수 함수로 구현해 단위 테스트하기 쉽게 한다.
- 3단 레이아웃은 CSS Grid로 구성(`grid-template-columns: 대화목록 1fr 컨텍스트`), 모바일 breakpoint에서는 좌/우 컬럼을 `position: fixed` 드로어로 전환하고 중앙만 기본 flow에 남긴다.
- `title` 필드는 기존 AI 응답 스키마에 옵셔널 필드로 추가 — 스키마/프롬프트 변경 전 `docs/prd/ai-ask-prompt-guide.md` 절차를 따른다.

## Data And API Impact
- **localStorage 스키마** (신규, 키 예: `sfood-wiki:search-conversations:v1`):
  ```ts
  interface StoredConversation {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    turns: StoredTurn[];
  }
  interface StoredTurn {
    id: string;
    question: string;
    status: "complete" | "error";
    answer?: SearchAnswer;
    errorMessage?: string;
  }
  ```
  - 쓰기 시점: 턴이 `complete` 또는 `error`로 확정될 때만. `loading` 상태는 저장하지 않는다.
  - 정렬: `updatedAt` 내림차순. 20개 초과 시 가장 오래된 항목부터 제거.
  - `localStorage` 접근 실패(quota, 프라이빗 모드 등)는 try/catch로 흡수하고 현재 세션 동작은 계속 진행(저장만 실패).
- **서버 API 응답 스키마**: 기존 필드에 `title: string` (옵셔널, 하위 호환) 추가. 클라이언트는 없으면 첫 질문 텍스트로 폴백.
- 기존 `recommendedDocuments`/`relatedDocuments`/FAQ 산정 로직은 변경 없음 — 클라이언트가 여러 턴의 결과를 합치는 방식만 새로 추가.

## Validation Plan
- `useSearchConversations` 단위 테스트: 생성/갱신/삭제/정렬/20개 초과 시 정리/저장 실패 시 폴백
- 우측 패널 누적 유틸 단위 테스트: 중복 제거, 최신 턴 기준 섹션 재배치, 빈 섹션 미노출
- `SearchPage` 통합 테스트: 새 대화 생성 흐름, 대화 전환, 삭제 확인 다이얼로그
- Playwright: 데스크톱 3단 레이아웃 스크린샷, 모바일 드로어 토글, 대화 생성→전환→삭제 실사용 흐름, 라이트/다크 테마
- `pnpm test`, `pnpm typecheck` 전체 통과 확인
- Codex 크리티컬 리뷰(diff 기준) 진행 후 지적 사항 반영

## Risks
- `title` 필드 추가가 AI 프롬프트 출력 형식에 영향을 줘 기존 답변 파싱이 깨질 가능성 — 스키마 검증과 폴백으로 완화.
- localStorage 용량/브라우저 정책 차이로 저장이 실패할 수 있음 — try/catch로 기능 저하 없이 흡수.
- 우측 패널 누적 로직이 복잡해질 경우 성능/가독성 저하 가능 — 순수 함수 + 단위 테스트로 범위 제한.
- 모바일 드로어 추가로 기존 `chat-*` CSS와 겹치는 회귀 가능 — Playwright로 라이트/다크/모바일 조합 실측.

## Rollback Considerations
- 신규 컴포넌트/훅은 기존 `SearchPage` 로직을 대체하는 게 아니라 감싸는 구조이므로, 문제 발생 시 이전 커밋으로 되돌리면 기존 단일 컬럼 챗 UI로 즉시 복귀 가능.
- `title` 필드는 옵셔널 추가이므로 서버만 롤백해도 클라이언트는 폴백 제목으로 정상 동작.
