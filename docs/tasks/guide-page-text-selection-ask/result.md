# guide-page-text-selection-ask Result

## Delivered Scope
- `ArticlePage`의 가이드 문서 본문에서 텍스트를 드래그 선택하면 "질문하기" 플로팅 버튼이 뜨고, 클릭 시 하단 Ask 패널 인풋에 선택 텍스트가 채워지고 포커스가 이동하는 기능을 구현.
- `PromptComposer`/`ArticleAskPanel`을 `forwardRef`로 전환해 각각 `focus()`/`fillAndFocus(text)` imperative handle 노출.
- 신규 `ArticleSelectionAskButton` 컴포넌트: 선택 감지, 위치 계산(위/아래 자동 전환, 좌우 클램프), 500자 트렁케이트, 스크롤/바깥클릭/Escape/선택해제 시 자동 dismiss.

## Changed Files
- `apps/web/src/ui/PromptComposer.tsx`, `apps/web/src/ui/PromptComposer.test.ts`
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`, `apps/web/src/ui/pages/ArticleAskPanel.test.tsx`
- `apps/web/src/ui/pages/ArticleSelectionAskButton.tsx`(신규), `apps/web/src/ui/pages/ArticleSelectionAskButton.test.tsx`(신규)
- `apps/web/src/ui/pages/ArticlePage.tsx`
- `apps/web/src/styles.css`
- `docs/tasks/guide-page-text-selection-ask/`(spec/plan/tasks/test-result/result)

## Key Decisions
- 컴포넌트 간 결합은 `ArticlePage`가 소유한 ref/콜백만으로 처리 — 전역 이벤트나 컨텍스트 없이, `ArticleContentRenderer`는 이 기능을 전혀 몰라도 되도록 책임을 분리.
- `useImperativeHandle`은 빈 의존성 배열(`[]`)로 고정 — code-quality 리뷰에서 확정된 패턴을 `PromptComposer`/`ArticleAskPanel` 양쪽에 일관 적용.
- 버튼 바깥 클릭 감지는 CSS 클래스 문자열이 아닌 `buttonRef.contains()` 기반으로 구현 — code-quality 리뷰에서 클래스명 변경 시 깨질 수 있는 취약점으로 지적되어 수정.
- Codex 크리티컬 리뷰에서 발견된 두 가지 실제 버그(버튼 클릭 유실 가능성, 내부 스크롤 컨테이너 dismiss 누락)를 구현 완료 후 발견해 즉시 수정 — 이는 사전 설계 단계에서는 예상하지 못했던, 실제 브라우저 동작(mousedown의 선택 collapse 부작용, scroll 이벤트의 non-bubbling 특성)에 기반한 지적이었다.

## Open Gaps
- 키보드만으로 텍스트를 드래그 선택해 이 기능을 트리거하는 경로는 없음(스펙에서 아웃오브스코프로 명시, 하단 Ask 패널이 대체 경로로 항상 존재).
- `StartingGuidePage`에는 적용하지 않음(Ask 패널이 없어 대상 자체가 아님).

## Next Steps
- 없음 — 승인된 스코프 내에서 구현·검증·문서화 완료.
