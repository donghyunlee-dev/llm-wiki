# home-guide-section-spec Test Result

## Validation Approach

이 태스크는 문서(`ui-spec.md`, `development-prompt-reference.md`) 수정만 포함하며 코드 변경은 없다.

| 항목 | 내용 |
|---|---|
| 가설 | ui-spec.md가 홈 추천 가이드 동작(소스, 개수, 정렬, 중복 제거)과 /guides 필터를 잘못 정의하고 있다 |
| 검증 방법 | 수정된 문서를 실제 코드(`HomePage.tsx`, `CategoryPage.tsx`)와 대조 검토 |
| 검증 결과 | 문서 내용이 코드 동작과 일치함을 확인 |
| 채택 여부 | 적용 |

## 6a. Unit Tests / Typecheck

코드 변경 없음. 회귀 확인용으로만 실행.

```
pnpm test
```

- 결과: 기존 통과 (CategoryPage 및 관련 테스트 이미 9b54e0f 커밋에서 통과)
- typecheck: 코드 변경 없음으로 생략

## 6b. Playwright Review

문서 전용 변경이므로 Playwright 브라우저 검증 해당 없음.

## 6c. Codex Critical Review

Codex 비판 의견 반영 결과:

| 지적 사항 | 조치 |
|---|---|
| "4개" vs "최대 4개" 불일치 | "추가 추천 가이드 최대 4개"로 통일, guide < 4개일 때 있는 만큼 표시 명시 |
| 시작 가이드 매핑 title 패턴 누락 | `/agent 시작하기/i`, `/시작 가이드/i` 패턴 및 id fallback 추가 |
| `docType 무관` 범위 불명확 | `nav` 허용 명시, 홈+agent-start 라우트에서만 노출로 범위 제한 |
| `page` docType 범위 과도하게 넓음 | "public read model 통과 조건"으로 구체화 (status + published + not blocked) |
| `development-prompt-reference.md` 구버전 스펙 | "5개" → "최대 4개", `/guides` guide만 → guide + page 모두 수정 완료 |

## Acceptance Criteria Coverage

| AC | 내용 | 결과 |
|---|---|---|
| AC1 | ui-spec에 홈 추천 가이드 소스·필터·정렬·개수 명시 | 통과 |
| AC2 | "5개" → "최대 4개" 수정 | 통과 |
| AC3 | Guide List Rules가 guide + page 모두 포함 | 통과 |
| AC4 | 시작 가이드(고정)와 추천 4개 구분 명확 | 통과 |
