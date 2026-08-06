# lesson-player-slice-4 Result

## Delivered Scope

- Interactive 컴포넌트 중 Context Window를 구현했다(Screenshot Hotspot·Backend API는 사용자 확정으로 이번 범위에서 제외).
- `wiki.metadata.presentation.scenes[].visual: { kind: "context-window", emphasis?: "overflow" }` 필드를 추가해, 콘텐츠팀이 특정 장면에 이 시각화를 켤 수 있게 했다.
- `ContextWindowVisual` 컴포넌트는 지침/이전 대화/파일/새 요청 4개 항목이 하나의 제한된 컨텍스트 창에 들어간다는 개념을 보여주고, `emphasis: "overflow"`면 가장 오래된 항목이 밀려나는 상태(테두리·색상 변화 + "밀려남" 배지)를 함께 보여준다. 각 항목은 hover/focus로 그 정보가 답변에 미치는 영향을 설명하는 툴팁을 제공한다.

## Changed Files

- `packages/wiki-core/src/lib/lessonSemanticBlocks.ts` — `SceneVisual` 타입
- `packages/wiki-core/src/lib/lessonScenes.ts` — `LessonScene.visual` 전달
- `packages/wiki-core/src/lib/wikiDocuments.ts` — `LessonPresentationMetadata.scenes[].visual`
- `packages/wiki-core/src/lib/confluenceClient.ts` — `readSceneVisual` 파싱·엄격 검증
- `packages/wiki-core/src/lib/confluenceSnapshots.ts` — Context Window 시연 fixture 추가
- `apps/web/src/ui/pages/lessonScenes/ContextWindowVisual.tsx`(신규)
- `apps/web/src/ui/pages/LessonReaderPage.tsx` — `scene.visual` 렌더링 연결
- `apps/web/src/styles.css` — Context Window 시각화 스타일
- 대응 테스트 파일(신규 1개 + 기존 1개 갱신)

## Key Decisions

- **콘텐츠 무관 고정 콘텐츠로 구현**: 이 컴포넌트가 보여주는 4개 항목과 설명 문구는 설계서 원문을 그대로 따른 고정 콘텐츠다. 레슨마다 달라지는 데이터가 아니므로 콘텐츠팀 작업 없이 지금 만들 수 있었다(사용자가 이 방향을 "Context Window만 먼저"로 확정).
- **Screenshot Hotspot·Backend API는 이번에 진행하지 않음**: 둘 다 사용자가 명시적으로 보류/제외를 선택했다 — Hotspot은 실제 스크린샷 콘텐츠가 있어야 의미 있고, Backend API는 Slice 1에서 이미 의도적으로 제외한 범위를 뒤집을 이유가 없다고 판단.
- **Codex 리뷰로 실제 접근성/검증 결함 예방**: `emphasis` 오타가 조용히 통과하던 문제와, opacity 상속으로 정작 확인해야 할 항목의 툴팁이 흐릿해지던 문제를 잡아 수정했다.

## Open Gaps

- 터치/모바일 환경에서의 hover 대체 인터랙션 없음(데스크톱 우선).
- Context Window 외 다른 Interactive 컴포넌트(Comparison hover 강조 등)는 이번 범위 밖.

## Next Steps

- 사용자가 확정한 순서(Scene Type → Motion → Interactive → Backend API)의 네 항목 중 셋(Scene Type, Motion, Interactive-Context Window)을 완료했다. Backend API는 사용자 확정으로 진행하지 않기로 했으므로, 콘텐츠 무관 범위의 설계서 구현은 이것으로 일단락한다.
- 콘텐츠팀이 실제로 HTML 매크로 도식, `wiki.metadata.course`(courseId/order), `presentation.scenes[].visual`을 채워 넣기 시작하면 실제 콘텐츠 기반 재검증이 필요하다.
