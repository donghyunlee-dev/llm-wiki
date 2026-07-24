# Spec — 웹 검색/문서 note 이중 표시 및 목차 정리

## 문제

1. **note 콜아웃 이중 표시**: Confluence ADF 확장 형식(`<ac:adf-extension>`)으로 저장된
   패널이 웹 아티클/검색 결과에서 두 번 렌더된다. `ac:adf-content`(본문)와
   `ac:adf-fallback`(HTML `.panel` 박스)이 둘 다 출력되고, `ac:adf-attribute`의
   `note` 텍스트도 라벨처럼 새어나온다.
2. **목차(TOC) 가독성**: 항목 마커(`•`/`—`)가 항목 박스 세로 중앙에 절대배치되어
   여러 줄 항목에서 첫 줄과 어긋나 보이고, 항목 간격이 넓어 목차가 세로로 길어진다.

## 범위 (In Scope)

- `packages/wiki-core/src/lib/confluenceCleanHtml.ts`: `ac:adf-extension` 패널을
  단일 `wiki-callout` div로 변환 (fallback 제거, panel-type을 tone으로).
- `apps/web/src/ui/pages/ArticleContentRenderer.tsx`: `ac:adf-extension` 패널을
  단일 blockquote 콜아웃으로 변환.
- `apps/web/src/styles.css`: 목차 마커(`•`/`—`/`·`) 완전 제거, 레벨은 들여쓰기로
  구분, 항목 간격 축소.

## 범위 밖 (Out of Scope)

- 검색 랭킹/AI 답변 생성 로직 변경 없음.
- Surface별 docType 노출 규칙(동결 동작) 변경 없음.
- 마커를 다른 기호로 교체하지 않는다 (사용자 결정: 완전 제거).

## 시나리오 / 인수 기준

- ADF 패널(`panel-type="note"`)이 포함된 문서에서 본문이 **정확히 1회**만
  렌더되고, `.panel`/`panelContent` fallback과 `note` 라벨 텍스트가 남지 않는다.
- 기존 `ac:structured-macro` 콜아웃/코드/링크 변환은 그대로 동작한다.
- 목차에 `•`/`—`/`·` 마커가 나타나지 않고, 레벨별 들여쓰기가 유지되며,
  항목 간 세로 간격이 이전보다 좁아진다.

## 가정

- ADF 패널의 `panel-type` 값은 info/note/success/warning/error/tip 범주.
  라벨이 없는 값은 제목 없이 콜아웃만 렌더한다.
- 웹 아티클 렌더러의 DOM 로직은 jsdom 부재로 단위테스트 대신 Playwright로 검증한다.
