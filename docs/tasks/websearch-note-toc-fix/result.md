# Result

## 전달 범위

1. **note 콜아웃 이중 표시 해결** — Confluence ADF 확장(`<ac:adf-extension>`) 패널을
   두 렌더러 모두에서 단일 콜아웃으로 변환.
   - `packages/wiki-core/src/lib/confluenceCleanHtml.ts` (검색/사이드바 등 cleaned HTML 경로)
   - `apps/web/src/ui/pages/ArticleContentRenderer.tsx` (웹 아티클 경로)
2. **목차(TOC) 가독성 개선** — `apps/web/src/styles.css`에서 마커(`•`/`—`/`·`) 완전 제거,
   레벨은 들여쓰기로 구분, 항목 간격 축소.

## 주요 결정

- 마커는 사용자 결정에 따라 **완전 제거** (다른 기호로 교체하지 않음).
- ADF `panel-type`은 신뢰할 수 없는 문서 콘텐츠로 취급, 화이트리스트로 정규화하여
  속성 인젝션 및 미지원 클래스 유입을 차단.
- ADF 이외의 `ac:adf-extension`(비패널)은 변경하지 않음 (범위 밖, 기존 동작 유지).

## 검증

- `pnpm test`, `pnpm typecheck` 전체 통과. ADF 변환 단위 테스트 3건 추가.
- Playwright로 실제 가이드 문서에서 note 단일 렌더 및 목차 마커 제거/간격 축소 확인.
- Codex 크리티컬 리뷰 2건(속성 인젝션, 정규식 중첩 절단) 반영 완료.

## 남은 갭 / 리스크

- 웹 아티클 렌더러 DOM 로직은 jsdom 부재로 단위테스트 미적용 (Playwright로 대체 검증).
- ADF `success`/`error` 패널은 라벨/전용 스타일이 없어 제목 없이 렌더될 수 있음
  (현재 데이터에는 note/info 위주, 실사용 영향 없음).
