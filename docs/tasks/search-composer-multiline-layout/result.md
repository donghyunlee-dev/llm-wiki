# search-composer-multiline-layout Result

## Delivered
- `PromptComposer` 공통 컴포넌트를 추가해 textarea 자동 높이, `Enter` 전송, `Shift+Enter` 줄바꿈 규칙을 한 곳에 모았다.
- 홈 검색, 검색 결과 검색, 가이드 목록 검색, 문서 상세 Ask 패널을 모두 multiline composer로 교체했다.
- 홈 hero를 더 압축해 검색과 추천 가이드가 같은 viewport 안에서 바로 읽히도록 폭, 라디우스, 간격, 상하 여백을 재조정했다.
- 후속 수정으로 홈/검색 결과/가이드 검색 버튼을 모두 같은 검색 아이콘과 같은 공통 버튼 CSS로 통일하고, 버튼 위치를 우측 정렬로 맞췄다.
- 가이드 목록 검색 composer의 회색 배경 박스가 버튼 때문에 아래로 깨지던 레이아웃을 공통 2-column composer grid로 정리했다.
- 추가 조정으로 `/guides` 목록 검색만 일반 웹페이지형 single-line 검색으로 되돌리고, 라벨 `통합 검색`과 상단 안내 문구를 제거했다.

## Key Decisions
- 벤치마크 방향은 ChatGPT, Claude, Perplexity 계열의 공통 패턴에 맞췄다.
  - 한 줄 input 대신 넓은 composer
  - 우하단 전송 버튼
  - plain `Enter` 전송, `Shift+Enter` 개행
- 가이드 목록 검색은 live filter 대신 `Enter` 확정형으로 바꿔 multiline 입력과 전송 규칙을 자연스럽게 맞췄다.
- 시작 가이드 전용 페이지는 일반 문서 상세와 다른 라우트 구조라 Ask panel 검증 대상에서 제외하고 일반 가이드 상세로 Playwright를 수행했다.

## Remaining Gaps
- `Shift+Enter`의 실제 줄바꿈 삽입은 브라우저 기본 동작에 의존하며, 자동 높이 확장과 함께 수동 브라우저 동작 및 unit helper로 검증했다.
