# wiki-lambda-memory-latency-fix Test Result

## Local Model-Swap Experiment (실험 스크립트, 비커밋)
`packages/wiki-core`의 실제 Stage1/Stage2 로직을 재사용해 실제 OpenAI/Confluence에 직접 호출, 4개 질문(`MCP가 뭐야?`, `Filesystem MCP 설정 방법 알려줘`, `Gemini CLI로 뭘 할 수 있어?`, `Claude Code와 Gemini CLI의 차이가 뭐야?`) × 4개 Stage2 구성으로 측정.

| 구성 | Stage2 소요(4문항 범위) | 판정 |
|---|---|---|
| o4-mini / low / 2800 (현재 운영값) | 6.1~7.4초 | 기준값, 가장 빠름 |
| o4-mini / low / 1400 (토큰 축소) | 6.3~8.5초 | 차이 없음 — 토큰 예산은 병목 아님 |
| gpt-5-mini / low | 12.5~17.7초 | 기준 대비 2배 이상 느림 → 폐기 |
| gpt-5-mini / minimal | 11.2~19.2초 | effort를 낮춰도 여전히 느림 → 폐기 |
| gpt-4.1-mini(비추론) | 502 에러 | 코드가 `reasoning.effort`를 고정 전송, 즉시 실패 → 시도 불가 |

품질 확인: `gpt-5-mini`(low)는 `왜 중요할까요?`를 지침이 요구하는 `[괄호형 소제목]` 형식 없이 흘려 써 스타일 가이드를 살짝 벗어남. 현재 값(o4-mini)은 규칙 준수. 즉 느리면서 품질도 낫지 않음 — 교체 근거 없음.

## Production Before/After (ax-wiki.s-food.ai, Playwright)

### AI 검색 (`sfood-ax-ai-search`)
| 시점 | 응답 시간 |
|---|---|
| 변경 전(256MB) | 29~36초 |
| 변경 후(1024MB), 콜드스타트 | 15.4초 |
| 변경 후(1024MB), 웜 인스턴스 | **9.8초** |

로컬 baseline(9~12초)과 거의 일치 — Lambda 메모리(CPU 배분)가 실제 병목이었음을 확인.

### 위키 데이터 (`sfood-ax-wiki-pages`, 기존 캐시 수정과 결합)
| 시점 | 응답 시간 |
|---|---|
| 256MB, 콜드(참고: 이전 작업 실측) | 12.9초 |
| 1024MB, 콜드 | 7.1초 |
| 1024MB, 웜(캐시 히트) | **0.54초** |

메모리 상향이 콜드 경로(Confluence 전체 재수집)에도 추가로 도움이 됨을 확인 — 캐시 히트 시에는 이미 매우 빨라 개선폭이 크지 않음(0.8초대 → 0.54초).

## AWS 설정 변경 확인
```
$ aws lambda get-function-configuration --function-name sfood-ax-ai-search --query MemorySize
1024
```
(`sfood-ax-ai-ask`, `sfood-ax-wiki-pages`, `sfood-ax-wiki-documents` 동일하게 확인, `LastUpdateStatus: Successful`)

## Skipped / Not Applicable Checks
- **CloudWatch Logs Insights로 Duration/Init Duration 직접 확인** — 조직 AWS 정책(permissions boundary)이 `logs:FilterLogEvents`를 차단해 접근 불가(`AccessDeniedException`). 대신 메모리 상향 후 재실측하는 실험적 검증으로 대체.
- `pnpm test`/`pnpm typecheck` — 이번 변경은 코드 수정이 없어 해당 없음.
- Codex 크리티컬 리뷰 — 코드 diff가 없어 해당 없음(순수 AWS 설정 변경).

## Retest Outcomes
- 해당 없음(최초 조사 및 적용, 재테스트 이력 없음).
