# home-hero-ai-copy Result

## Delivered Scope
- 홈 화면 히어로 영역에 기존 미사용 `hero.eyebrow` 필드를 렌더링해 "작은 라벨 + 큰 제목" 2줄 구조로 변경.
- 문구를 "AI 활용 가이드를 찾는 위키"라는 정체성이 드러나도록 교체(`eyebrow`, `title`, `search.placeholder`, `search.examples[0..1]`), "개발" 프레이밍은 배제하고 일반 사용자의 "활용/지식 탐색" 프레이밍으로 최종 결정.
- 사용자 재피드백("Agent라는 단어가 어렵다")을 반영해 "AI Agent" → "AI"로 재조정하고, title을 "AI에게 궁금한 것을 물어보세요"라는 행동 유도 문장으로 최종 확정.
- `BLOCKED_UI_TERMS`에서 `"AI Wiki"`, `"AI "` 제거하고, 관련 PRD 계약 문서(`ui-spec.md`, `development-prompt-reference.md`)를 함께 갱신해 문서-코드 불일치를 없앰.
- `HomePage.test.tsx`의 하드코딩된 구 문구 검증을 새 문구로 교체하고, eyebrow/placeholder 검증을 추가.

## Changed Files
- `packages/wiki-core/src/lib/homeContent.ts`
- `apps/web/src/ui/pages/HomePage.tsx`
- `apps/web/src/ui/pages/HomePage.test.tsx`
- `docs/prd/ui-spec.md`
- `docs/prd/development-prompt-reference.md`
- `docs/tasks/home-hero-ai-copy/{spec,plan,tasks,test-result,result}.md` (신규)

## Key Decisions
- 1줄 대신 2줄(eyebrow+title) 구성 채택 — 기존에 준비돼 있던 `.home-eyebrow`/`.home-title` CSS를 그대로 재사용해 새 스타일 추가 없이 구현.
- "개발/환경설정" 프레이밍 대신 "활용/가이드 탐색" 프레이밍으로 최종 결정 — 일반 사용자(비개발자)도 대상이기 때문.
- `BLOCKED_UI_TERMS`의 "AI" 관련 금지를 해제하는 것은 콘텐츠 상수뿐 아니라 PRD 문서 계약까지 함께 바꿔야 하는 사안임을 확인하고 문서도 동기화.

## Open Gaps
- `HOME_CONTENT.search.examples`는 현재 홈 화면에 실제 렌더링되지 않음(콘텐츠 검증용으로만 사용) — 기존부터의 상태이며 이번 작업 범위에서 화면에 노출시키지는 않음.
- Codex 2차 리뷰에서 "AI에게 궁금한 것을 물어보세요"가 챗봇으로 오해될 수 있다는 의견이 있었으나, 실제로 이 위키는 "최근 대화" 사이드바와 구조화된 AI 답변(AI Ask)을 제공하는 대화형 검색 구조라 문구가 실제 동작과 일치한다고 판단해 반영하지 않음(코드 변경 없음).

## Next Steps
- (선택) 타이틀 문구를 더 좁게 다듬을지 결정.
- (선택) `search.examples`를 실제 화면에 노출할지 별도 논의.
