# lesson-scene-mermaid-diagram Spec

## Problem

레슨 씬의 `visual` 블록은 현재 콘텐츠팀이 직접 저작한 `html`+`css`만 지원한다. Mermaid는 문서 간 변환·재사용이 쉬운 다이어그램 표기법이라 콘텐츠팀이 이 방식을 쓰고 싶어 하지만, 지금 스키마는 `mermaid` 필드를 인식하지 못해 조용히 버려진다(실측 확인 완료 — 파서를 직접 실행해 blocks 배열에서 사라짐을 확인).

## Scope

- `visual` 블록이 `html`+`css` 대신 `mermaid`(다이어그램 정의 텍스트)를 가질 수 있도록 스키마 확장.
- Mermaid 정의를 실제 SVG로 렌더링하는 컴포넌트 추가.
- 기본 Mermaid 테마가 아니라, 이 앱의 디자인 토큰(브랜드 컬러, 폰트, 배경 등 — `@sfood/ui` 유래)을 반영한 커스텀 테마 적용. 라이트/다크 테마 전환 시 다이어그램도 함께 전환.
- `SceneShell`의 "이미 도식이 있으면 interaction.steps 리스트를 억제" 로직에 새 mermaid 블록도 포함.

## Out of Scope

- 기존 `html`+`css` 방식의 `visual` 블록 지원 제거(계속 지원).
- 레슨이 아닌 다른 docType(guide/page)에 Mermaid 지원 추가(요청 범위 밖).
- Mermaid 다이어그램에 팬/줌 등 인터랙션 추가.

## Acceptance Criteria

- AC1: `visual` 블록에 `mermaid` 필드가 있고 `html`/`css`가 없어도 파서가 이를 버리지 않고 살린다.
- AC2: 씬 화면에서 Mermaid 정의가 실제 다이어그램(SVG)으로 렌더링된다.
- AC3: 렌더링된 다이어그램이 Mermaid 기본 테마(민트/회색 각진 스타일)가 아니라 이 앱의 브랜드 톤(강조색, 폰트, 카드 배경 등)을 반영한다.
- AC4: 다크 테마로 전환하면 다이어그램의 색상도 함께 바뀐다(라이트 전용으로 고정되지 않음).
- AC5: `mermaid` 블록이 있는 씬에서는 `interaction.steps` 텍스트 리스트가 중복 표시되지 않는다(기존 `customHtml` 블록과 동일하게 취급).
- AC6: 기존 19개 `html`+`css` 기반 `visual` 씬은 회귀 없이 그대로 동작한다.
- AC7: 다이어그램 정의 텍스트에 악의적인 내용(예: `click` 이벤트로 스크립트 URL 연결)이 있어도 실행되지 않는다(Mermaid `securityLevel: "strict"` 유지).

## Assumptions

- Mermaid 렌더링은 클라이언트 사이드(브라우저)에서 `mermaid` npm 패키지로 수행한다(서버/빌드 타임 사전 렌더링은 이번 범위 밖).
- 씬 하나에 `mermaid` 다이어그램은 최대 1개로 가정한다(현재 관측된 요청 사례가 1개).
- 번들 크기 영향을 줄이기 위해 `mermaid` 패키지는 동적 import(코드 스플리팅)로 불러온다 — 레슨 리더를 아예 안 쓰는 페이지의 초기 로드에는 영향 없음.
