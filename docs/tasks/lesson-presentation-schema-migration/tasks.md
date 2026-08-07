# lesson-presentation-schema-migration Tasks

- [x] wiki-core: `lessonSemanticBlocks.ts`에 `LessonPresentationDocument`/`Scene`/`Block` 타입 + 공유 파서(`readLessonPresentationValue`) 추가
- [x] wiki-core: `confluenceReadModel.ts`/`wikiDocuments.ts` 타입 평탄화 + `presentation` 최상위 이동
- [x] wiki-core: `confluenceClient.ts` — `lesson.presentation` 별도 fetch, 공유 파서 사용
- [x] wiki-core: `wikiDataSource.ts` — 원격 JSON 재검증 계층에 신규 필드 반영(Codex 리뷰로 발견한 Critical 버그 수정)
- [x] wiki-core: 신규 `lessonPresentation.ts` 컴파일러(TDD)
- [x] wiki-core: `lessonScenes.ts`(레거시 H2 파서) 및 테스트 삭제
- [x] wiki-core: `lessonDocuments.ts` courseId/order 전용 재작성
- [x] wiki-core: `courseOutline.ts` chapter 그룹 + estimatedMinutes 우선순위
- [x] wiki-core: `confluenceSnapshots.ts` 레슨 픽스처 신규 스키마로 교체
- [x] apps/web: `CustomHtmlDiagramBlock.tsx` css prop + style 브레이크아웃 방어
- [x] apps/web: `LessonReaderPage.tsx` 신규 파이프라인 연결, Reveal 상태 기계 제거, transitionToNext 배너
- [x] apps/web: `LessonOutlineDrawer.tsx` chapter 그룹 헤더
- [x] docs: `confluence-metadata.md` 신규 스키마 문서화
- [x] 전체 `pnpm typecheck`/`pnpm test` 통과 확인
- [x] snapshot 모드 + remote 모드(실 Confluence) Playwright 검증, 참고 사이트 대조
- [x] Codex 비판 리뷰 및 발견 사항 수정(Critical 1건, Medium 3건)
- [x] test-result.md/result.md 작성
