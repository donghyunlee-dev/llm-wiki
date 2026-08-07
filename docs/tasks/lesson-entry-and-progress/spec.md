# Lesson 진입점, docType 격리, 학습 진도 — Spec

전체 설계: `docs/superpowers/specs/2026-07-30-lesson-entry-and-progress-design.md`

## 범위

### 포함
- `docType: "lesson"` 스키마 등록(`confluence-metadata.md`, `WikiDocument` 타입, `CLAUDE.md` Frozen 표) 및 snapshot 픽스처
- 홈 하단 Lesson 진입 섹션(카드 1개)
- `/lesson` 인덱스 페이지(레슨 목록, 이어서 학습하기/학습 시작하기)
- `/lesson/:slug` 리더 페이지(H2 기준 장면 분리, 좌우 이동, 장면별 대본 토글)
- Confluence Expand 매크로 → 장면별 "숨겨진 대본" 변환 로직
- `localStorage` 진도 저장/복구
- 검색·가이드·페이지·라이브러리에 영향 없음을 증명하는 회귀 테스트
- Playwright 및 Codex 크리티컬 리뷰

### 제외 (후속 단계)
- ADF 기반 Lesson Compiler, `LessonAst`, `lesson.presentation`/`lesson.course` Content Property 스키마
- Motion Preset 시스템(자유로운 애니메이션), 마우스 휠/스와이프 탐색
- Knowledge Check, Context Window 등 인터랙티브 컴포넌트
- Confluence 실연동(현재는 `snapshot` 픽스처로 개발, 이후 세션에서 실제 페이지 연동)
- 다중 Course 관리(Course Manifest) — 이번 스코프는 단일 고정 course(`ai-foundation`)만 다룸
