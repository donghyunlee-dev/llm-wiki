# 검색 화면(`/search`) 3단 레이아웃 설계

> 문서 상태: 개발 기준안
> 대상 화면: `/search` (AI 검색 결과 화면)
> 관련 문서: `docs/prd/search-flow-contract.md`(답변 내용·문서 선정 계약), `docs/tasks/search-three-pane-layout/`(구현 작업 스펙·계획)

## 문서 목적

이 문서는 검색 결과 화면의 **레이아웃과 화면 구조**를 정의한다. 답변 내용의 문구·톤·문서 선정 규칙은 `search-flow-contract.md`가 계약이며, 이 문서는 그 결과물을 화면에 어떻게 배치하는지(대화 목록, 3단 구성, 컨텍스트 패널 구성)만 다룬다.

두 문서가 겹치는 부분(예: 추천 페이지/관련 페이지 노출 순서)은 `search-flow-contract.md`가 원칙을, 이 문서가 화면 배치를 정의한다. 둘이 다르면 이 문서를 갱신해 일치시킨다.

## 핵심 설계 결정

| 항목 | 결정 |
|---|---|
| 화면 구조 | 좌(대화 목록) / 중(연속 답변 스트림) / 우(컨텍스트 패널) 3단 |
| 사이트 헤더 | 기존 `SiteHeader` 그대로 유지 (다른 페이지와 톤 통일, 별도 축소 없음) |
| 대화 저장소 | 별도 DB 없이 브라우저 `localStorage` |
| 대화 목록 정렬 | 최신 대화(`updatedAt`) 순 |
| 대화 보관 개수 | 최대 20개, 초과 시 가장 오래된 대화부터 자동 삭제 |
| 대화 제목 | AI 검색 응답의 `title` 필드(첫 턴에서만 설정), 없으면 첫 질문 텍스트로 대체 |
| 새 대화 시작 | 홈/검색창에서 질문 시 항상 새 대화, `/search` 내 이어서 질문은 기존 대화에 턴 추가 |
| 대화 삭제 | 확인 다이얼로그를 거쳐야 실행 |
| 컨텍스트 패널 구성 | 추천 페이지 → 관련 페이지 → FAQ, 세로 스택 + 섹션 헤더로 구분 |
| 컨텍스트 패널 범위 | 현재 대화의 **모든 턴 누적**(단일 턴이 아님), 문서 중복 시 최신 턴 기준으로 재배치 |
| 모바일/좁은 화면 | 중앙 답변 스트림만 기본 노출, 좌/우 패널은 드로어(토글)로 전환 |
| 홈 화면 진입점 | 홈(`/`)도 `/search`와 동일한 좌측 고정 사이드바 구조를 사용 — 저장된 대화가 있을 때만 좌측에 "최근 대화" 패널(`ConversationSidebar` 재사용, 최대 20개) 노출, 나머지 홈 콘텐츠(검색창/추천 가이드/레슨 카드)는 우측 메인 컬럼에서 내부 스크롤. 클릭 시 `/search?c=<대화ID>`로 이동해 해당 대화가 바로 열림 |

## 화면 구조

```
┌─────────────────────────────────────────────────────────┐
│ SiteHeader (기존 그대로)                                  │
├───────────────┬───────────────────────────┬───────────────┤
│ 대화 목록      │ 질문–답변 스트림           │ 컨텍스트 패널  │
│ (좌측 사이드바)│ (중앙, 기존 chat-turn 재사용)│ (우측 사이드바)│
│               │                           │ 추천 페이지    │
│ · 대화 1       │ [질문]                    │ 관련 페이지    │
│ · 대화 2       │ [AI 답변]                 │ FAQ           │
│ · 대화 3 (삭제)│ [질문]                    │               │
│ ...           │ [AI 답변]                 │               │
│               │ [하단 입력창]              │               │
└───────────────┴───────────────────────────┴───────────────┘
```

- 좌/중/우 3단은 `SiteHeader` 아래 `site-main` 영역 전체 높이(`calc(100vh - 헤더 높이)`)를 사용한다.
- 중앙 답변 스트림의 턴 렌더링(질문/답변/로딩 상태 등)은 기존 `SearchPage.tsx`의 `chat-turn`/`chat-message`/`SearchAnswerView` 구조를 그대로 재사용한다.
- 모바일/좁은 화면에서는 좌/우 컬럼이 기본적으로 숨겨지고, 버튼으로 여닫는 드로어(슬라이드 패널)로 전환된다. 중앙 답변 스트림은 항상 기본 노출된다.

## 대화 데이터 모델 (localStorage)

- 저장 키: `sfood-wiki:search-conversations:v1`
- 저장 시점: 질문 제출 후 대화 생성, 각 턴이 `complete` 또는 `error`로 확정될 때 갱신 저장. `loading` 상태는 저장하지 않는다(새로고침 시 응답 대기 중이던 마지막 질문은 유실될 수 있음 — 허용된 트레이드오프).

```ts
interface StoredConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number; // 정렬 기준
  turns: StoredTurn[];
}

interface StoredTurn {
  id: string;
  question: string;
  status: "complete" | "error";
  answer?: SearchAnswer; // 화면에 쓰는 것과 동일한 구조
  errorMessage?: string;
}
```

- localStorage 접근이 실패(quota, 프라이빗 모드 등)해도 검색 기능 자체는 계속 동작해야 한다 — 저장 실패만 흡수하고 조용히 넘어간다.

## 컨텍스트 패널 누적 규칙

- 열려 있는 대화의 모든 턴에서 나온 추천 페이지/관련 페이지/FAQ 문서를 섹션별로 누적한다.
- 같은 문서 id가 여러 턴에 걸쳐 나오면 **가장 최근 턴 기준**으로 섹션과 위치를 재산정한다(오래된 턴에서만 나온 카드는 아래로 밀림).
- 완전 미지원 응답(턴의 `confluenceData`가 비어 있어 해당 턴의 추천/관련/FAQ가 전부 빈 경우)은 다른 턴에서 이미 쌓인 문서를 지우지 않는다.
- 섹션이 비어 있으면 그 섹션 자체를 렌더링하지 않는다(기존 규칙 유지).
- 턴별 출처 표시(어느 질문에서 나온 카드인지)는 포함하지 않는다.

## 관련 파일 맵

| 파일 | 역할 |
|---|---|
| `apps/web/src/ui/pages/SearchPage.tsx` | 3단 셸 조합, 기존 턴 렌더링 로직 유지 |
| `apps/web/src/ui/pages/search/ConversationSidebar.tsx` | 좌측 대화 목록 (선택/삭제) |
| `apps/web/src/ui/pages/search/SearchContextPanel.tsx` | 우측 컨텍스트 패널 (추천/관련/FAQ 세로 스택) |
| `apps/web/src/ui/pages/search/useSearchConversations.ts` | localStorage 기반 대화 CRUD/정렬/용량 제한 훅 |
| `apps/web/src/ui/searchRecommendations.ts` | 턴 단위 추천/관련/FAQ 선정 (기존, 변경 없음) |
| `apps/web/src/ui/pages/search/searchContextAccumulation.ts` | 다중 턴 누적/중복 제거/재배치 순수 함수 (신규) |
| `apps/web/src/styles.css` | 3단 그리드, 사이드바, 모바일 드로어 스타일 |
| 서버 AI 검색 핸들러 | 응답 스키마에 `title` 필드 추가 |
| `apps/web/src/ui/pages/HomePage.tsx` | `/search`와 동일한 `search-shell`/`search-sidebar-left`/`search-main-column` 구조 재사용, 좌측에 `ConversationSidebar`("최근 대화") 배치 |

구현 진행 상황, 테스트 결과, 결정 근거는 `docs/tasks/search-three-pane-layout/`(spec/plan/tasks/test-result/result)에 기록한다.

## 이 문서와 다른 계약의 관계

- `docs/prd/search-flow-contract.md`: 답변 문구, 문서 선정/제외 규칙, `recommendedDocuments`/`relatedDocuments`/FAQ 산정 방식의 계약. 이 문서의 컨텍스트 패널 누적 규칙은 위 산정 결과를 **화면에서 어떻게 합치는지**만 다루며, 산정 로직 자체를 바꾸지 않는다.
- Surface별 docType 노출 규칙(CLAUDE.md 동결 항목): 검색 답변 내 추천/관련 페이지는 `guide`+`page` 노출 대상이며, 이 화면 개편은 그 규칙을 바꾸지 않는다.
