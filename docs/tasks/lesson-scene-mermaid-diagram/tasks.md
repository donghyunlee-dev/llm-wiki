# lesson-scene-mermaid-diagram Tasks

- [x] `mermaid` 패키지를 `apps/web` 의존성에 추가
- [x] `lessonSemanticBlocks.ts`: `visual` 블록의 `mermaid` 필드 파싱 + html/mermaid 상호 배타 처리 + 테스트
- [x] `lessonPresentation.ts`: `mermaidDiagram` semantic block 컴파일 + 테스트
- [x] `MermaidDiagramBlock.tsx` 신규 작성(동적 import, 테마 연동, 폴백 처리, 보안 설정 잠금, 렌더 직렬화)
- [x] `SemanticBlockRenderer.tsx`에 `mermaidDiagram` 분기 + 테스트
- [x] `SceneShell.tsx`의 `hasVisualBlock`에 `mermaidDiagram` 포함 + 테스트
- [x] `pnpm typecheck` / `pnpm test` 통과
- [x] Playwright로 라이트/다크 테마에서 실제 다이어그램 렌더링 + 커스텀 스타일 확인(다크 테마 color-mix 버그 발견 및 수정 포함)
- [x] Codex 크리티컬 리뷰(보안 중점) — 4건 접수, 전부 반영
- [x] `test-result.md` / `result.md` 작성
- [x] `implementation-status.md` 갱신
