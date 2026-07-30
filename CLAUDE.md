# CLAUDE.md — SFOOD-LLM-WIKI

## Required Reads Before Any Work

Read these files at the start of every session, in order:

1. `docs/prd/implementation-status.md` — session-to-session progress source of truth; always continue from the recorded next step
2. `docs/prd/development-plan.md` — phase order and next implementation target
3. `docs/ops/development-rules.md` — coding, design, naming, and safety rules
4. `docs/ops/spec-driven-workflow.md` — required workflow for non-trivial work
5. `docs/ops/testing-strategy.md` — required validation approach and result recording
6. `docs/ops/done-criteria.md` — completion gates

Additional references:
- `docs/ops/development-index.md` — local map of the Confluence development guide set
- `docs/prd/architecture.md` — fixed stack and deployment constraints
- `docs/tasks/_template/` — starter files for task documentation

---

## Spec-Driven Workflow (Mandatory for Non-Trivial Work)

Apply this workflow for any feature, bug fix, integration, interface change, persistence change, or behavior-affecting request.

### Task Workspace

Create `docs/tasks/{work-scope}/` using a descriptive folder name. Keep these files current:

| File | Purpose |
|---|---|
| `spec.md` | Problem, scope, out-of-scope, scenarios, acceptance criteria, edge cases, assumptions |
| `plan.md` | Impacted areas, approach, validation plan, risks |
| `tasks.md` | Implementation, test, and documentation work items |
| `test-result.md` | Executed commands, pass/fail results, skipped checks, retest outcomes |
| `result.md` | Delivered scope summary, decisions, gaps |

### Phases and Gates

1. **Specify** → write `spec.md` with full scope and acceptance criteria
2. **Clarify** → resolve ambiguity before planning
3. **Plan** → write `plan.md` with technical approach and validation plan
4. **Task Breakdown** → track work in `tasks.md`
5. **Implement** → only after `spec.md` and `plan.md` are sufficient
6. **Validate** → record all checks in `test-result.md`
   - 6a. `pnpm test` and `pnpm typecheck` must pass
   - 6b. **Playwright review**: verify actual browser behavior for affected UI paths using Playwright MCP
   - 6c. **Codex critical review**: send the diff to Codex and collect critical feedback
7. **Report** → summarize in `result.md` and report completion to the user

**Do not implement before `spec.md` and `plan.md` are complete.**
**Do not mark work done before `test-result.md` and `result.md` are updated.**
**Do not expand scope beyond what is documented and confirmed.**
**Do not report completion before steps 6b (Playwright) and 6c (Codex review) are done.**

After each meaningful change, update both the task workspace and `docs/prd/implementation-status.md`.

---

## Build and Development Commands

```bash
pnpm install        # install workspace dependencies
pnpm dev            # run the Vite web app
pnpm build          # build the web app
pnpm test           # run workspace tests
pnpm typecheck      # run workspace type checks
git status          # inspect local changes
rg --files          # list tracked files quickly
```

Validate commands are reproducible before requesting review.

---

## Confirm Before Editing

**Never modify code or files without first explaining what was found and asking for confirmation.**

When asked to investigate or fix something:
1. Read and analyze the relevant code
2. Explain what was found and what would need to change
3. Ask "수정할까요?" or equivalent before touching any file

This applies to all edits — including small fixes, prompt changes, and config updates.

---

## UI/UX 변경은 항상 Playwright로 확인 후 완료 응답

**UI/UX(레이아웃, 색상, 타이포그래피, 컴포넌트 스타일, 인터랙션 등) 관련 수정은 크기와 상관없이 항상 Playwright MCP로 실제 브라우저 렌더링을 확인한 뒤에만 완료(done)로 응답한다.**

- 이 규칙은 `spec-driven-workflow.md`의 6b(Playwright review)가 적용되는 "non-trivial" 작업뿐 아니라, 한 줄짜리 CSS 수정이나 클래스 하나 교체처럼 작아 보이는 변경에도 예외 없이 적용된다.
- 코드만 보고 "의도대로 렌더링될 것"이라고 추정하지 않는다 — 상위 레이아웃(공유 wrapper, 전역 스타일 등)이 의도한 변경을 가리거나 무효화할 수 있으므로, 실제 화면을 열어 확인한다.
- 변경이 여러 화면/테마(라이트·다크)·뷰포트(데스크톱·모바일)에 영향을 줄 수 있으면 해당 조합을 모두 확인한다.
- 사용자가 "아직도 ~하게 보인다"고 재지적하면, 직전 수정이 완전하지 않았다는 뜻이므로 관련된 상위/공유 컴포넌트까지 다시 추적해 원인을 찾는다.

---

## Frozen Behaviors — 사용자 승인 없이 변경 금지

아래 동작은 반복적으로 수정 시도가 발생한 이력이 있는 핵심 UX 계약이다.  
**수정 요청이 오더라도 즉시 구현하지 않고, 반드시 사용자에게 의도를 확인하고 승인을 받아야 한다.**

### Surface별 docType 노출 규칙

아래 표는 각 화면(surface)에서 `guide` / `page` docType 문서의 노출 여부를 정의한다.  
**이 규칙은 동결되어 있으며, 어느 한 면을 수정할 때 다른 면의 규칙을 유추하거나 맞추려 하지 않는다.**

| Surface | guide | page | 비고 |
|---|---|---|---|
| 홈 추천 가이드 | ✅ | ❌ | `buildFeaturedGuides` — guide only |
| `/guides` 목록 | ✅ | ❌ | intro 페이지 제외, guide only |
| 검색 답변 내 추천 페이지 | ✅ | ✅ | AI 선정 추천 문서 |
| 검색 답변 내 관련 페이지 | ✅ | ✅ | 랭킹 기반 관련 문서 |
| 답변 본문 내 인라인 링크 | ✅ | ✅ | 답변 중 연결되는 페이지 링크 |

**핵심 구분**: 홈과 `/guides`는 `guide` only. 검색 답변 영역(추천/관련/인라인 링크)은 `page` 포함.  
이 두 영역은 의도적으로 다르며, 어느 쪽도 상대방에 맞춰 바꾸지 않는다.

`lesson` docType은 위 표의 어떤 Surface에도 해당하지 않는 완전히 별도의 비노출 docType이다 — 홈 하단 진입 카드(레슨 문서가 1개 이상 있을 때만 노출되는 카드 자체)와 `/lesson`, `/lesson/:slug` 전용 화면에서만 노출되며, guide/page 노출 규칙과는 무관하다.

이 동작을 수정하는 태스크를 계획할 경우:
1. 변경 이유와 예상 영향을 사용자에게 명확히 설명한다
2. 사용자가 명시적으로 승인한 뒤에만 `spec.md`를 작성한다
3. 승인 없이 관련 코드(`buildFeaturedGuides`, `CategoryPage` guides 필터, `isIntroGuideDocument` 적용 범위)를 수정하지 않는다

---

## AI Behavior Changes — Mandatory Pre-Check

**AI 동작이 위키 설계 의도와 다르게 작동한다는 수정 요청을 받으면, 코드보다 문서를 먼저 읽는다.**

수정 전 필수 확인 순서:

1. `docs/prd/search-flow-contract.md` — 검색·답변·페이지 노출의 설계 계약 확인
2. `docs/prd/ai-ask-prompt-guide.md` — AI 프롬프트 설계 의도 및 수정 절차 확인
3. 문제가 설계 계약 위반인지, 구현 버그인지, 설계 한계인지 구분한다
4. 설계 변경이 필요하면 문서를 먼저 수정하고 코드를 맞춘다

**금지 패턴 — AI 동작 수정 시 다음 방식을 사용하지 않는다:**

- 하드코딩된 도구 목록(`KNOWN_SUBJECTS` 스타일) 추가 — 배포 후 매번 코드 수정 필요
- 한국어→영어 수동 매핑 배열 확장 — 새 도구 등록마다 코드 변경 발생
- 텍스트 매칭 기반의 단일 페이지 필수 Gate — 비교 질문 등 정상 케이스를 차단함
- AI 판단을 우회하는 규칙 기반 차단 로직 — 유지보수 불가 케이스 증가

**올바른 방향 — AI 판단에 위임한다:**

- 관련성 판단, 주제 커버리지 판단은 AI 프롬프트 지침으로 처리한다
- 잘못된 페이지 사용 방지는 "관련 없는 문서로 답하지 말라"는 프롬프트 수준에서 처리한다
- 어휘 검색 개선이 필요하면 lexical scorer의 다중 토큰 커버리지 점수를 보완한다
- 한국어 질문의 주제 추출은 AI 키워드 추출로 대체를 고려한다 (Stage 1 조건부 도입)

---

## Coding Rules

- Change only what the task requires. Prefer the smallest effective implementation.
- Reuse existing patterns before introducing new ones.
- Prefer guard clauses over deep nesting.
- Keep functions and classes focused on one responsibility.
- Separate input/output handling from decision logic.
- Keep orchestration separate from persistence and transport details.
- Keep domain rules separate from infrastructure-specific code.
- Validate external input at the boundary; treat it as untrusted.
- Do not hide failures with broad exception handling or silent fallback logic.
- Limit edits to the minimum set of files needed.
- Avoid unnecessary abstraction or speculative generalization.

### Naming

- Use purpose-driven names: verbs for actions, nouns for concepts.
- Use `kebab-case` for Markdown and config files (e.g., `docs/ops/testing-strategy.md`).
- Avoid abbreviations unless already standard in the repository.

### Formatting

- 2-space indentation in Markdown, YAML, and JSON.
- Keep secrets out of source control.

---

## Testing Rules

- Write tests early enough to lock expected behavior.
- Prefer behavior-focused tests over implementation-coupled tests.
- Keep tests deterministic, isolated, and repeatable.
- Use the smallest test scope that still proves the change (unit → flow → integration → interface/API).
- Structure checks as `Given / When / Then`.
- Name tests after observable behavior, not implementation details.
- One test verifies one main behavior.

**Avoid:** hidden shared state, flaky timing-based checks, excessive mocking, production changes made only to satisfy weak tests.

Record validation for every non-trivial task in `docs/tasks/{work-scope}/test-result.md` with commands, pass/fail results, skipped checks, retest outcomes, and acceptance criteria coverage.

---

## Done Criteria

Work is done only when **behavior, validation, and documentation all align**.

### Required Checks

- Requested behavior works as specified.
- Important success and failure paths are handled.
- Validation is repeatable and clearly recorded.
- Boundaries remain understandable and maintainable.
- Errors are not hidden and safety risks were considered.

### Not Done If

- A non-trivial change started without task documents.
- Validation is missing or only happy paths were checked.
- Documentation no longer matches repository behavior.
- The change introduced avoidable unrelated scope.

Once approved scope is complete, stop — do not add optional improvements.

---

## Commit and PR Guidelines

- Commit subjects: short, imperative form — e.g., `Add task document templates`, `Fix search ranking logic`
- PRs must include: task scope summary, validation evidence, remaining gaps or risks.
