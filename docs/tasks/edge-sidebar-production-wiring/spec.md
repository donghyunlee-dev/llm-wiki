# edge-sidebar-production-wiring Spec

## Problem Statement
`apps/edge-sidebar`(브라우저 사이드패널 확장)는 `{baseUrl}/api/wiki/ai/search`와 `{baseUrl}/api/wiki/documents`를 호출하는데, 둘 다 로컬 `pnpm dev`의 Vite 미들웨어 상대 경로다. 실제 배포된 정적 사이트(`https://ax-wiki.s-food.ai`)에는 이 경로가 존재하지 않는다 — `apps/web`은 이미 Lambda Function URL을 직접 호출하도록 마이그레이션했지만, 이 확장은 그 이전 방식 그대로다. `/api/wiki/documents`는 대응하는 Lambda가 아예 없다(이전 AWS 배포 작업에서 "웹앱 미사용"으로 확인하고 제외했으나, 이 확장에서 쓰고 있음을 이번에 발견).

## Scope
1. `/api/wiki/documents` 로직을 `packages/wiki-core`의 트랜스포트-비의존 함수로 추출 (기존 AI ask/search 추출과 동일한 패턴).
2. `vite.config.ts`의 해당 미들웨어를 추출된 함수를 호출하는 얇은 어댑터로 리팩터링(로컬 dev 동작 불변).
3. `packages/serverless`에 신규 Lambda 핸들러(`wikiDocumentsHandler`) 추가 + esbuild 엔트리포인트/빌드 스크립트에 반영.
4. `.github/workflows/deploy.yml`에 4번째 함수 코드 업데이트 단계 추가.
5. `docs/tasks/aws-static-site-and-ai-api-deployment/aws-setup-guide.md`에 4번째 함수 1회성 생성 절차 추가.
6. `apps/edge-sidebar`의 `wikiClient.ts`를 실제 Lambda Function URL(ai-search, wiki-documents)을 호출하도록 수정 — 빌드 시점에 실제 URL을 주입.
7. 확장 빌드(`pnpm --filter @sfood/edge-sidebar build`) 후 `dist` 산출물 확인.

## Out of Scope
- 확장의 다른 기능(사이드패널 토글, 콘텐츠 스크립트) 변경.
- 확장 스토어 배포/패키징 — 로컬 "Load unpacked" 검증까지만.
- `wiki-pages`/`ai-ask` Lambda 재설계 — 그대로 유지.

## Acceptance Criteria
- AC1: 신규 Lambda가 로컬에서 검증했던 `/api/wiki/documents`와 동일한 응답 형태(`{pages: [{id, slug, title, summary, href, docType, contentHtml, related}]}`)를 반환한다.
- AC2: `vite.config.ts` 리팩터링 후에도 로컬 `pnpm dev` 기준 `/api/wiki/documents` 동작이 기존과 동일하다(회귀 없음).
- AC3: `apps/edge-sidebar`가 프로덕션 빌드 시 실제 Lambda Function URL 2개(ai-search, wiki-documents)를 호출하도록 설정되고, 로컬 개발 시엔 기존처럼 `localhost:5173` 기준 상대 경로 폴백을 유지한다.
- AC4: 실제 배포된 Lambda에 대해 라이브로 호출 검증한다.
- AC5: `pnpm test`/`typecheck`/`build` 통과.
