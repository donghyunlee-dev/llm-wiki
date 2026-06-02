# 자가 개선 프롬프트 시스템 — 구현 결과

## 완료 범위

### 신규 파일
| 파일 | 역할 |
|---|---|
| `packages/wiki-core/src/lib/promptRulesLoader.ts` | Confluence "Prompt Rules" 페이지 파싱 및 로드 |
| `packages/wiki-core/src/lib/playbookAnalyzer.ts` | Playbook 일별 테이블에서 실패 패턴 집계 |
| `packages/wiki-core/src/lib/promptRulesLoader.test.ts` | HTML 파싱 단위 테스트 (9개) |
| `packages/wiki-core/src/lib/playbookAnalyzer.test.ts` | 테이블 파싱 + 패턴 집계 단위 테스트 (11개) |

### 수정 파일
| 파일 | 변경 내용 |
|---|---|
| `packages/wiki-core/src/lib/aiAsk.ts` | `DynamicPromptRules` import, `AiSearchPromptContext.dynamicRules` 필드 추가, `buildAiSearchInstructionsForIntent` 동적 규칙 주입 |
| `apps/web/vite.config.ts` | `promptRulesCache` 추가, `loadDevPromptRulesCache()` 추가, 검색 핸들러에 동적 규칙 주입 |
| `packages/wiki-core/src/index.ts` | 신규 모듈 re-export |
| `apps/web/.env.example` | `CONFLUENCE_PROMPT_RULES_PAGE_ID` 추가 |

## 검증 결과

- `pnpm typecheck`: 전체 통과
- `pnpm test`: 202개 전체 통과 (기존 182개 + 신규 20개)

## Claude schedule 루틴

- 루틴명: Playbook 분석 및 AI 프롬프트 자동 개선
- 루틴 ID: `trig_018dn6jkaABXrxrkHpKhcriL`
- 스케줄: 매일 20:00 KST (11:00 UTC, cron: `0 11 * * *`)
- 루틴 URL: https://claude.ai/code/routines/trig_018dn6jkaABXrxrkHpKhcriL

## 운영 설정 필요 사항

Confluence에 "Prompt Rules - Search" 페이지를 생성하고 해당 페이지 ID를 `.env.local`에 추가해야 한다:

```
CONFLUENCE_PROMPT_RULES_PAGE_ID=<페이지 ID>
```

페이지가 없으면 루틴이 첫 실행 시 자동으로 생성한다.
페이지 ID가 설정되지 않으면 서비스는 기존 하드코딩 프롬프트로 정상 동작한다.

## 시스템 동작 흐름

```
[사용자 검색] → [AI 답변] → [Playbook 기록]
                                    ↓ (누적)
                      [매일 20시 Claude 루틴]
                      Playbook 7일치 읽기
                      부족 패턴 분석
                      Prompt Rules 페이지 갱신
                                    ↓ (다음 캐시 TTL 30분 후)
                      [API 서버가 새 규칙 로드]
                      [검색 프롬프트에 자동 주입]
```
