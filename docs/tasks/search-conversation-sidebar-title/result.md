# search-conversation-sidebar-title Result

## Delivered Scope
`/search` 페이지의 `ConversationSidebar`에 `title="최근 대화"`를 추가해 홈 화면과 동일하게 섹션 헤딩이 보이도록 함.

## Changed Files
- `apps/web/src/ui/pages/SearchPage.tsx`

## Key Decisions
- 사용자가 확인한 "타이틀 미노출"의 의미가 섹션 헤딩이었으므로, 기존에 이미 존재하던 선택적 `title` prop을 그대로 재사용.

## Open Gaps
없음.

## Next Steps
없음. 사용자 승인 범위 완료.
