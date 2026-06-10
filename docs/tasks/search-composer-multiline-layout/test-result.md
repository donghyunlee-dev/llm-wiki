# search-composer-multiline-layout Test Result

## Executed Checks
- `pnpm --filter @sfood/web test`
  - PASS
- `pnpm typecheck`
  - PASS
- Playwright MCP browser verification on `http://localhost:5175`
  - PASS
  - 홈 `/`: 검색 textarea 존재, `searchWidth=896`, `guidesWidth=896`, `searchRadius=8px`, `guidesRadius=8px`, `pageScrollHeight=viewportHeight=1024`
  - 검색 `/search`: textarea 존재, plain `Enter` 후 URL이 `/search?q=claude%20worktree`로 변경, `Shift+Enter` 후 URL 유지
  - 가이드 `/guides`: textarea 존재, 입력만으로는 결과 수 유지, `Enter` 후 `전체 40개 중 0개 표시`로 갱신
  - 문서 `/guides/guide-mcp-설정하기`: textarea 존재, `Enter` 시 mocked fetch 1회 호출, `Shift+Enter` 추가 호출 없음
- Follow-up Playwright MCP browser verification on `http://localhost:5175`
  - PASS
  - 홈 `/`: 검색 버튼이 textarea 우측에 정렬됨
  - 검색 `/search`: 검색 버튼이 textarea 우측에 정렬되고 공통 회색 버튼 톤 적용
  - 가이드 `/guides`: 검색 회색 composer 내부에 버튼이 깨지지 않고 포함되며 우측 정렬 유지
- Follow-up web-only adjustment for `/guides`
  - PASS
  - 가이드 목록 검색은 다시 single-line composer(`minRows=1`)로 조정
  - `통합 검색` 라벨 제거
  - 가이드 소개 문구 제거

## Acceptance Criteria Coverage
- AC1. 충족
  - 홈, 검색 결과, 가이드 목록, 문서 내 질문 입력 모두 `<textarea>` 기반 composer로 교체됨
- AC2. 충족
  - unit test와 Playwright에서 plain `Enter` 전송, `Shift+Enter` 비전송 확인
- AC3. 충족
  - 홈 검색과 추천 가이드 프레임 폭 모두 `896px`, 라디우스 모두 `8px`
- AC4. 충족
  - 홈 첫 화면이 `1024px` viewport에서 추가 스크롤 없이 보였고 hero 높이가 `310px`로 축소됨
  - 후속 수정에서 세 검색 버튼 아이콘/버튼 톤/정렬을 공통 composer CSS로 재통일함
  - `/guides`는 AI 검색이 아닌 일반 목록 검색이라는 요구에 맞게 single-line 입력으로 재조정함

## Retest Notes
- 최초 검증에서 문서 상세 `/guides/agent-start`는 커스텀 시작 페이지라 Ask panel이 없어, 일반 가이드 상세 `/guides/guide-mcp-설정하기`로 재검증했다.

## Skipped Checks
- Codex critical review
  - 현재 실행 주체가 Codex 세션이므로 별도 외부 Codex 비판 리뷰는 수행하지 못했다. 이 사실을 명시적으로 기록한다.
