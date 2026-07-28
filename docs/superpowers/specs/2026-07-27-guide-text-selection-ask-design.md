# Guide Page Text-Selection-to-Ask Design

## Problem
가이드 문서(`ArticlePage`) 본문에서 사용자가 궁금한 부분을 드래그로 선택했을 때, 그 텍스트를 손으로 복사해 하단 Ask 패널에 붙여넣는 수고 없이 바로 질문으로 이어갈 방법이 없다.

## Goal
Medium/Notion/Google Docs류에서 널리 쓰이는 "텍스트 선택 → 플로팅 버튼 → 액션" 패턴을 그대로 적용해, 본문 텍스트를 선택하면 "질문하기" 플로팅 버튼이 뜨고 클릭 시 하단 고정 Ask 패널의 질문 인풋에 선택 텍스트가 채워지고 포커스가 이동하도록 한다.

## Scope
- 적용 대상: `ArticlePage`에서 렌더링되는 문서 본문(`.article-body` 내부)만. `StartingGuidePage`(`/guides/agent-start`, `/guides/start`)는 Ask 패널 자체가 없으므로 이번 스코프에서 제외한다.
- 코드블록/표를 포함한 본문 내 모든 선택 가능 텍스트에서 동일하게 동작한다(콘텐츠 종류별 예외 처리 없음).
- 여러 문단/헤딩에 걸친 선택도 표준 `Selection`/`Range` API로 그대로 처리한다(추가 파싱/제한 없음).
- 데스크톱(마우스 드래그)과 모바일(터치 롱프레스 네이티브 선택)을 모두 지원하되, 별도의 모바일 전용 UI를 만들지 않고 동일한 컴포넌트를 재사용한다.

## Out Of Scope
- `StartingGuidePage`, 검색 페이지, 홈 등 다른 화면에 동일 기능 확장.
- 선택 텍스트를 AI에 자동 전송(자동 질문 실행)하는 것 — 사용자가 인풋에 채워진 텍스트를 확인/수정 후 직접 전송해야 한다.
- 선택 텍스트에 대한 하이라이트 영구 저장, 코멘트 스레드 등 주석 기능.

## User Scenarios
- 사용자가 가이드 본문에서 한 문장을 드래그하면, 선택 영역 위(공간이 부족하면 아래)에 "질문하기" 버튼이 뜬다.
- 버튼을 클릭하면 하단 Ask 패널의 질문 인풋에 선택한 문장이 채워지고, 인풋에 포커스가 이동해 바로 이어서 타이핑할 수 있다.
- 사용자가 선택을 해제하거나, 페이지를 스크롤하거나, 버튼 바깥을 클릭하거나, `Esc`를 누르면 버튼이 사라진다.
- 사용자가 코드블록이나 표 안의 텍스트를 선택해도 동일하게 버튼이 뜨고 동일하게 동작한다.
- 사용자가 매우 긴 범위(여러 문단)를 선택해도 버튼은 정상 동작하며, 인풋에는 500자를 넘는 부분이 "..."로 잘려 채워진다.

## Architecture

### 새 컴포넌트: `ArticleSelectionAskButton`
- 위치: `apps/web/src/ui/pages/ArticleSelectionAskButton.tsx` (신규 파일).
- Props: `containerRef: RefObject<HTMLElement>`(선택을 감지할 컨테이너, 즉 `.article-body`를 감싸는 `<article>` 요소), `onAsk: (text: string) => void`.
- 내부 동작:
  - `document`에 `selectionchange` 리스너를 등록. 선택이 비어있지 않고, `selection.anchorNode`/`focusNode`가 모두 `containerRef.current` 내부에 있을 때만 버튼을 표시 상태로 전환.
  - 선택된 `Range`의 `getBoundingClientRect()`로 버튼의 `position: fixed` 좌표를 계산 — 선택 영역 상단에서 버튼 높이+8px 위, 뷰포트 상단에 붙어 공간이 없으면 선택 영역 하단으로 전환. 좌우는 뷰포트 안쪽으로 클램프.
  - `window`에 `scroll` 리스너(passive)를 등록해 스크롤 발생 시 즉시 버튼을 숨김(재계산하지 않음 — 단순함 우선).
  - 버튼 바깥 `mousedown`, `Escape` 키 입력 시 숨김.
  - 버튼 클릭 시: `window.getSelection()?.toString()`을 500자로 트렁케이트(초과 시 "..." 접미) 후 `onAsk(text)` 호출, 버튼 숨김.
- 스타일: 기존 토큰 재사용 — `rounded-[var(--radius-md)] bg-accent text-white shadow-sm` 등 `.article-ask-form-button`과 통일된 톤의 신규 클래스 `.article-selection-ask-button`을 `styles.css`에 추가(신규 색상/치수 하드코딩 없음).

### `PromptComposer` 확장
- `forwardRef`로 전환하고 `useImperativeHandle`로 `{ focus: () => void }`를 노출 — 내부 `textareaRef.current?.focus()`를 호출.
- 기존 props/동작은 변경하지 않는다(순수 추가).

### `ArticleAskPanel` 확장
- `forwardRef`로 전환하고 `useImperativeHandle`로 `{ fillAndFocus: (text: string) => void }`를 노출:
  - `setQuestion(text)`로 질문 인풋 값을 설정.
  - `setPanelHeight((height) => Math.max(height, EXPANDED_HEIGHT))`로 패널을 충분히 확장(긴 텍스트가 잘리지 않도록, 기존 질문 제출 시와 동일한 패턴 재사용).
  - 내부 `PromptComposer`에 ref를 연결해 `focus()`를 호출.
- 기존 렌더링/제출 로직은 변경하지 않는다.

### `ArticlePage` 연결
- `askPanelRef = useRef<ArticleAskPanelHandle>(null)`를 만들어 `<ArticleAskPanel ref={askPanelRef} ... />`로 전달.
- 본문을 감싸는 `<article className="article-body">`에 `articleRef`를 연결.
- `<ArticleSelectionAskButton containerRef={articleRef} onAsk={(text) => askPanelRef.current?.fillAndFocus(text)} />`를 `<article>` 내부(또는 형제 위치, 어차피 `position: fixed`라 DOM 위치는 스타일에 영향 없음) 마지막에 렌더링.

## Data Flow
```
사용자 텍스트 선택
  → ArticleSelectionAskButton이 selectionchange로 감지, 버튼 표시
  → 버튼 클릭 → onAsk(선택텍스트)
  → ArticlePage → askPanelRef.current.fillAndFocus(선택텍스트)
  → ArticleAskPanel: question 상태 갱신 + 패널 높이 확장 + PromptComposer.focus()
```
컴포넌트 간 결합은 `ArticlePage`가 소유한 두 개의 ref/콜백으로만 이루어지며, `ArticleContentRenderer`(본문 HTML 렌더링)는 이 기능을 전혀 알 필요가 없다 — 콘텐츠 렌더링과 선택-감지 책임이 분리된다.

## Error Handling / Edge Cases
- `window.getSelection()`이 `null`이거나 `rangeCount === 0`이면 버튼을 표시하지 않는다.
- 선택이 `containerRef` 경계를 걸쳐 있으면(예: 본문 밖 TOC까지 함께 드래그) 버튼을 표시하지 않는다(anchorNode/focusNode 둘 다 컨테이너 내부인지 확인).
- `ArticleAskPanel`이 언마운트된 상태에서 `fillAndFocus`가 호출될 일은 구조상 없다(같은 페이지 내 형제 컴포넌트로 항상 함께 마운트).

## Testing
- `ArticleSelectionAskButton.test.tsx`(신규): jsdom에서 `Selection`/`Range` API를 모킹해 (1) 컨테이너 내부 선택 시 버튼 노출, (2) 컨테이너 바깥 선택 시 버튼 미노출, (3) 클릭 시 `onAsk`가 트렁케이트된 텍스트로 호출되는지, (4) 스크롤/Escape/바깥 클릭 시 버튼이 사라지는지 검증.
- `PromptComposer.test.ts`(기존 파일 확장): `ref.current.focus()` 호출 시 내부 textarea가 포커스되는지 검증.
- `ArticleAskPanel.test.tsx`(기존 파일 확장): `ref.current.fillAndFocus(text)` 호출 시 질문 인풋 값이 갱신되고 패널이 확장되는지 검증.
- Playwright MCP로 실제 브라우저에서 드래그 선택 → 버튼 노출 → 클릭 → 인풋 채워짐/포커스 이동을 데스크톱 뷰포트에서 확인(터치 이벤트는 Playwright 시뮬레이션 한계로 로직 동일성만 코드 리뷰로 확인, 실제 기기 QA는 범위 외로 문서화).

## Assumptions
- "질문하기" 버튼 노출 조건은 데스크톱 마우스 드래그와 모바일 네이티브 텍스트 선택(롱프레스) 모두 `selectionchange` 이벤트로 충분히 감지된다고 가정한다(두 플랫폼 모두 표준 Selection API를 갱신함).
- 500자 트렁케이트 길이는 인풋 사용성을 위한 잠정 값이며, 필요 시 이후 조정 가능하다.
