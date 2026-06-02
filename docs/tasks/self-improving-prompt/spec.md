# 자가 개선 프롬프트 시스템 스펙

## 개요

Playbook에 누적된 검색 실패 데이터를 분석해 AI 검색 프롬프트를 자동으로 개선하고,
서비스 재배포 없이 Confluence를 통해 즉시 반영하는 자가 개선 루프를 구축한다.

## 배경

- Playbook 일별 페이지에 검색 결과의 `sufficiency(충분/부족)`와 `missingKeywords`가 누적됨
- 현재 프롬프트는 `aiAsk.ts`에 하드코딩 → 개선 시 코드 수정 + 재배포 필요
- 실패 패턴이 쌓여도 자동 활용 경로가 없음

## 범위

### 포함

- `promptRulesLoader.ts`: Confluence "Prompt Rules" 페이지를 읽고 동적 규칙 파싱
- `playbookAnalyzer.ts`: Playbook 일별 페이지에서 "부족" 패턴 추출
- `aiAsk.ts` 수정: 동적 규칙을 `AiSearchPromptContext`에 포함, 검색 instruction에 주입
- `vite.config.ts` 수정: 검색 요청 시 Confluence에서 프롬프트 규칙 로드 (TTL 캐시)
- Claude schedule 루틴: 매일 Playbook 분석 → Prompt Rules 페이지 갱신

### 제외

- 프롬프트 규칙의 사람 승인 단계 (자동 적용)
- 신규 Confluence 위키 페이지 자동 생성 (패턴 리포팅만)
- Serverless(Lambda) 핸들러 수정 (개발 서버와 동일 패턴으로 별도 적용 가능)

## 요구 사항

- [ ] Confluence "Prompt Rules" 전용 페이지에서 추가 지침과 키워드 힌트를 파싱
- [ ] Playbook 최근 7일 데이터에서 "부족" 항목 패턴을 집계
- [ ] `AiSearchPromptContext`에 `dynamicRules` 필드 추가 (하위 호환, 선택적)
- [ ] `buildAiSearchInstructionsForIntent`에서 동적 규칙을 기본 프롬프트 뒤에 주입
- [ ] `vite.config.ts`에서 검색 요청마다 캐시된 프롬프트 규칙 사용
- [ ] 프롬프트 규칙 캐시 TTL: 30분 (위키 캐시와 동일 주기)
- [ ] `CONFLUENCE_PROMPT_RULES_PAGE_ID` 환경 변수가 없으면 빈 규칙으로 동작
- [ ] Claude schedule 루틴이 매일 Prompt Rules 페이지를 분석 결과로 갱신

## 수용 기준

### Happy Path
- Given: Playbook에 "부족" 항목이 3개 이상 누적되고 Prompt Rules 페이지가 존재
- When: 루틴이 실행됨
- Then: 실패 패턴 분석 → Prompt Rules 페이지 갱신 → 다음 캐시 만료 후 검색 요청에 새 규칙 반영

### Failure Case
- Given: `CONFLUENCE_PROMPT_RULES_PAGE_ID` 환경 변수 미설정
- When: 검색 요청이 들어옴
- Then: 기존 하드코딩 프롬프트로 정상 동작, 오류 없음

### Graceful Degradation
- Given: Confluence 프롬프트 규칙 페이지 로드 실패
- When: 검색 요청이 들어옴
- Then: 빈 규칙(`EMPTY_PROMPT_RULES`)으로 폴백, 서비스 중단 없음
