# Intent Classifier Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two fragile regex-based intent classifiers with a single score-based classifier that separates subject (mcp, cli, webhook) from action intent (setup, concept, troubleshooting), and strengthen hallucination prevention when the retrieved documents don't match the query subject.

**Architecture:** Extract a shared `intentClassifier.ts` module that scores multiple intent signals independently and picks the highest scorer — no early-return regex chains. Subject tokens (mcp, cli, codex, webhook) are extracted separately and never influence intent scores. Both `aiAsk.ts` and `wikiDocuments.ts` import from this single module. Hallucination prevention is added via a subject-relevance check in the AI prompt.

**Tech Stack:** TypeScript, Vitest, existing wiki-core package conventions.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `packages/wiki-core/src/lib/intentClassifier.ts` | **Create** | Single score-based classifier + subject extractor |
| `packages/wiki-core/src/lib/intentClassifier.test.ts` | **Create** | Comprehensive vibe-coding test suite (30+ cases) |
| `packages/wiki-core/src/lib/aiAsk.ts` | **Modify** | Replace `classifySearchQuestionIntent` import + strengthen hallucination prompt |
| `packages/wiki-core/src/lib/wikiDocuments.ts` | **Modify** | Replace `inferSearchQuestionMode` with shared classifier |
| `packages/wiki-core/src/index.ts` | **Modify** | Export new public API if needed |

---

## Task 1: Create `intentClassifier.ts` with score-based logic

**Files:**
- Create: `packages/wiki-core/src/lib/intentClassifier.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/wiki-core/src/lib/intentClassifier.test.ts
import { describe, expect, it } from "vitest";
import { classifyQuestionIntent, extractQuestionSubjects } from "./intentClassifier";

describe("classifyQuestionIntent — concept detection", () => {
  it.each([
    ["MCP가 뭐야?", "concept"],
    ["CLI가 뭔데?", "concept"],
    ["vibe coding이 뭐임?", "concept"],
    ["Codex가 먼지 알고 싶어", "concept"],
    ["MCP란 무엇인가요?", "concept"],
    ["webhook이 뭐야", "concept"],
    ["MCP 개념이 뭐야", "concept"],
    ["CLI 뜻이 뭐야", "concept"],
  ])("%s → %s", (question, expected) => {
    expect(classifyQuestionIntent(question)).toBe(expected);
  });
});

describe("classifyQuestionIntent — setup detection", () => {
  it.each([
    ["MCP 설정 방법", "setup"],
    ["Codex CLI 설치 어떻게 해?", "setup"],
    ["MCP 연결은 어떻게 하나요?", "setup"],
    ["Gmail MCP 설정하기", "setup"],
    ["Claude Code를 설치하고 싶어", "setup"],
    ["MCP를 configure 하려면?", "setup"],
  ])("%s → %s", (question, expected) => {
    expect(classifyQuestionIntent(question)).toBe(expected);
  });
});

describe("classifyQuestionIntent — page-lookup detection", () => {
  it.each([
    ["MCP 설정 페이지 있어?", "page-lookup"],
    ["Claude Code 가이드 어디 있어?", "page-lookup"],
    ["MCP 관련 문서 찾아줘", "page-lookup"],
    ["Codex 설치 가이드 링크", "page-lookup"],
  ])("%s → %s", (question, expected) => {
    expect(classifyQuestionIntent(question)).toBe(expected);
  });
});

describe("classifyQuestionIntent — troubleshooting detection", () => {
  it.each([
    ["MCP 연결이 안 돼", "troubleshooting"],
    ["Codex 설치 오류가 나", "troubleshooting"],
    ["MCP 설정이 실패해", "troubleshooting"],
    ["Claude Code가 안 됨", "troubleshooting"],
  ])("%s → %s", (question, expected) => {
    expect(classifyQuestionIntent(question)).toBe(expected);
  });
});

describe("classifyQuestionIntent — broad-planning detection", () => {
  it.each([
    ["vibe coding 시작하기 전에 뭘 준비해야 해?", "broad-planning"],
    ["AI 코딩 프로젝트 설계 순서가 어떻게 돼?", "broad-planning"],
    ["MCP 도입 전에 체크리스트가 뭐야?", "broad-planning"],
  ])("%s → %s", (question, expected) => {
    expect(classifyQuestionIntent(question)).toBe(expected);
  });
});

describe("extractQuestionSubjects", () => {
  it.each([
    ["MCP가 뭐야?", ["mcp"]],
    ["Claude Code CLI 설치 방법", ["claude", "cli"]],
    ["Gmail webhook 사용법", ["gmail", "webhook"]],
    ["vibe coding이 뭔지", ["vibe coding"]],
  ])("%s → %s", (question, expected) => {
    const subjects = extractQuestionSubjects(question);
    for (const s of expected) {
      expect(subjects).toContain(s);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/donghyunlee/projects/SFOOD-LLM-WIKI
pnpm test --filter wiki-core -- intentClassifier
```

Expected: FAIL — `intentClassifier` module not found.

- [ ] **Step 3: Implement `intentClassifier.ts`**

```typescript
// packages/wiki-core/src/lib/intentClassifier.ts

export type QuestionIntent =
  | "page-lookup"
  | "concept"
  | "setup"
  | "broad-planning"
  | "comparison"
  | "troubleshooting"
  | "general";

type IntentScores = Record<QuestionIntent, number>;

export function classifyQuestionIntent(question: string): QuestionIntent {
  const normalized = question.trim().toLocaleLowerCase("ko-KR");

  if (!normalized) return "general";

  // Deterministic: page-lookup wins immediately
  if (isPageLookupShape(normalized)) return "page-lookup";

  const scores: IntentScores = {
    "page-lookup": 0,
    concept: 0,
    setup: 0,
    "broad-planning": 0,
    comparison: 0,
    troubleshooting: 0,
    general: 0,
  };

  // Trouble signals (strongest)
  if (/(오류|에러|failed|fail|문제|해결|안 되|안되|트러블|troubleshoot)/.test(normalized)) {
    scores.troubleshooting += 5;
  }

  // Comparison signals
  if (/(비교|차이|vs|대신|중에|선택|고를|추천)/.test(normalized)) {
    scores.comparison += 4;
  }

  // Setup action signals — only VERBS/ACTIONS, no tool names
  if (/(설치|설정|구성|세팅|연결|연동|로그인|login|install|configure|setup|enable)/.test(normalized)) {
    scores.setup += 4;
  }

  // Broad planning signals
  if (/(시작하기 전에|준비|설계|계획|먼저 읽|순서|어떤 흐름|체크리스트|무엇을 해야|무엇부터)/.test(normalized)) {
    scores["broad-planning"] += 4;
  }

  // Concept shape — question words (broad pattern, no fixed list enumeration)
  // Matches: 뭐야, 뭐임, 뭐죠, 뭔데, 뭐여, 먼지, 머야, 뭘까 등 구어체 전체
  if (/(뭐|머|무엇|뭔|먼).{0,5}(지|야|임|죠|가요|에요|예요|인가|뭘까|하는|하는 거|뜻|개념)?/.test(normalized)) {
    scores.concept += 3;
  }
  // Formal concept words
  if (/(무엇인지|무엇인가|정의|개념|뜻|설명|what is|what's|what is this)/.test(normalized)) {
    scores.concept += 3;
  }

  // Subject-only shape bonus: short question with no action verb → likely concept
  if (isSubjectOnlyQuestion(normalized)) {
    scores.concept += 2;
  }

  const winner = highestScore(scores);
  return winner;
}

export function extractQuestionSubjects(question: string): string[] {
  const normalized = question.trim().toLocaleLowerCase("ko-KR");
  const subjects: string[] = [];

  const knownSubjects: string[] = [
    "mcp", "cli", "codex", "claude", "webhook",
    "gmail", "outlook", "microsoft 365", "m365",
    "playwright", "jira", "github", "vibe coding",
    "api", "cline", "cursor", "gemini", "filesystem",
  ];

  for (const subject of knownSubjects) {
    if (normalized.includes(subject)) {
      subjects.push(subject);
    }
  }

  return subjects;
}

function isPageLookupShape(normalized: string): boolean {
  const pageNounPattern = /(페이지|문서|가이드|자료|링크|page|document|doc|guide|link)/;
  const lookupVerbPattern = /(있|없|찾|어디|위치|보여|알려|열|연결|나와|나옴|있나|있어|있지|찾아|찾아줘|보여줘|where|find|show|open|exist|available)/;

  if (pageNounPattern.test(normalized) && lookupVerbPattern.test(normalized)) {
    return true;
  }

  return /(관련\s*(페이지|문서|가이드|자료|링크))|((페이지|문서|가이드|자료|링크)\s*(있나|있어|있지|없나|어디|찾아|찾아줘|보여줘))/.test(normalized);
}

function isSubjectOnlyQuestion(normalized: string): boolean {
  // Short question (≤30 chars) containing a subject token but no setup/trouble action verb
  if (normalized.length > 30) return false;

  const hasSetupAction = /(설치|설정|구성|세팅|연결|install|configure|setup)/.test(normalized);
  const hasTroubleAction = /(오류|에러|안됨|문제|failed)/.test(normalized);
  const hasSubjectToken = /(mcp|cli|codex|claude|webhook|gmail|api|vibe coding)/.test(normalized);

  return hasSubjectToken && !hasSetupAction && !hasTroubleAction;
}

function highestScore(scores: IntentScores): QuestionIntent {
  let best: QuestionIntent = "general";
  let bestScore = 0;

  for (const [intent, score] of Object.entries(scores) as [QuestionIntent, number][]) {
    if (score > bestScore) {
      bestScore = score;
      best = intent as QuestionIntent;
    }
  }

  return best;
}
```

- [ ] **Step 4: Run tests and make them pass**

```bash
cd /home/donghyunlee/projects/SFOOD-LLM-WIKI
pnpm test --filter wiki-core -- intentClassifier
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/wiki-core/src/lib/intentClassifier.ts packages/wiki-core/src/lib/intentClassifier.test.ts
git commit -m "Add score-based intent classifier separating subject from action intent"
```

---

## Task 2: Send classifier design to Codex for critique and iterate

**Files:** None (dialogue only)

- [ ] **Step 1: Call Codex MCP with the classifier implementation**

Send the full `intentClassifier.ts` source to Codex and ask:
- Does the scoring logic correctly separate subject from intent?
- Are there edge cases in the `isSubjectOnlyQuestion` heuristic?
- Is the broad concept regex `(뭐|머|무엇|뭔|먼).{0,5}...` too loose or too narrow?
- Any structural concerns?

- [ ] **Step 2: Apply Codex feedback**

Address each concern raised. Re-run tests after each change:
```bash
pnpm test --filter wiki-core -- intentClassifier
```

- [ ] **Step 3: Repeat until Codex raises no new blocking concerns**

Document the iteration log in `docs/tasks/intent-classifier-redesign/codex-dialogue.md`.

- [ ] **Step 4: Commit final agreed version**

```bash
git add packages/wiki-core/src/lib/intentClassifier.ts packages/wiki-core/src/lib/intentClassifier.test.ts docs/tasks/intent-classifier-redesign/codex-dialogue.md
git commit -m "Refine intent classifier based on Codex review"
```

---

## Task 3: Replace `classifySearchQuestionIntent` in `aiAsk.ts`

**Files:**
- Modify: `packages/wiki-core/src/lib/aiAsk.ts`

- [ ] **Step 1: Update existing test to cover the new classifier contract**

In `aiAsk.test.ts`, find the test `"tailors search instructions for concept questions"` (line 143). Add a case for "뭐야":

```typescript
it("classifies 'MCP가 뭐야?' as concept (not setup)", () => {
  const context = buildAiSearchPromptContext([document()], "MCP가 뭐야?");
  const input = buildAiSearchInput(context);
  expect(input[1]?.content).toContain('"questionIntent":"concept"');
});
```

Run to confirm it FAILS currently:
```bash
pnpm test --filter wiki-core -- aiAsk
```

- [ ] **Step 2: Replace `classifySearchQuestionIntent` in `aiAsk.ts`**

At the top of `aiAsk.ts`, add import:
```typescript
import { classifyQuestionIntent } from "./intentClassifier";
export type { QuestionIntent as SearchQuestionIntent } from "./intentClassifier";
```

Then delete the entire `classifySearchQuestionIntent` function (lines 623–655) and replace every call site:
```typescript
// Before:
const questionIntent = classifySearchQuestionIntent(searchQuestion);
// After:
const questionIntent = classifyQuestionIntent(searchQuestion);
```

Also update `buildAiSearchInput` (line 275) which calls `classifySearchQuestionIntent(context.question)`:
```typescript
const questionIntent = classifyQuestionIntent(context.question);
```

- [ ] **Step 3: Run tests**

```bash
pnpm test --filter wiki-core -- aiAsk
```

Expected: All tests PASS including new concept case.

- [ ] **Step 4: Commit**

```bash
git add packages/wiki-core/src/lib/aiAsk.ts packages/wiki-core/src/lib/aiAsk.test.ts
git commit -m "Replace classifySearchQuestionIntent with shared intentClassifier"
```

---

## Task 4: Replace `inferSearchQuestionMode` in `wikiDocuments.ts`

**Files:**
- Modify: `packages/wiki-core/src/lib/wikiDocuments.ts`

- [ ] **Step 1: Add failing regression test in `wikiDocuments.test.ts`**

```typescript
it("ranks concept/overview document above setup document for 'MCP가 뭐야?'", () => {
  const conceptDoc = document({
    id: "mcp-overview",
    title: "MCP란 무엇인가 — 종합 가이드",
    summary: "MCP의 개념과 목적을 설명합니다",
    contentHtml: "<p>MCP는 AI가 외부 도구에 연결하는 방식입니다. 개념 정의와 개요.</p>",
  });
  const setupDoc = document({
    id: "mcp-setup",
    title: "MCP 설정하기",
    summary: "MCP를 설치하고 연결하는 방법",
    contentHtml: "<p>MCP를 설치합니다. 설정하고 연결합니다.</p>",
  });

  const results = getTopSearchWikiDocumentsIn([conceptDoc, setupDoc], "MCP가 뭐야?", 2);
  expect(results[0]?.id).toBe("mcp-overview");
});
```

Run to confirm FAILS:
```bash
pnpm test --filter wiki-core -- wikiDocuments
```

- [ ] **Step 2: Update `wikiDocuments.ts`**

Add import at top:
```typescript
import { classifyQuestionIntent } from "./intentClassifier";
```

Replace the entire `inferSearchQuestionMode` function and its type with:
```typescript
function inferSearchQuestionMode(normalizedQuestion: string): SearchQuestionMode {
  // Delegate to shared classifier; map to local SearchQuestionMode type
  const intent = classifyQuestionIntent(normalizedQuestion);
  switch (intent) {
    case "concept": return "concept";
    case "setup": return "setup";
    case "troubleshooting": return "troubleshooting";
    case "comparison": return "comparison";
    case "broad-planning": return "planning";
    default: return "general";
  }
}
```

Delete the old `inferSearchQuestionMode` body entirely.

- [ ] **Step 3: Run tests**

```bash
pnpm test --filter wiki-core -- wikiDocuments
```

Expected: All tests PASS including new ranking test.

- [ ] **Step 4: Commit**

```bash
git add packages/wiki-core/src/lib/wikiDocuments.ts packages/wiki-core/src/lib/wikiDocuments.test.ts
git commit -m "Replace inferSearchQuestionMode with shared intentClassifier in wikiDocuments"
```

---

## Task 5: Strengthen hallucination prevention in AI prompt

**Problem:** "claude 기능 중 webhook을 어떻게 사용하는지 알고 싶어" → no docs about "claude webhook", but AI returns unrelated webhook content (Teams, Playwright, etc.).

**Files:**
- Modify: `packages/wiki-core/src/lib/aiAsk.ts`

- [ ] **Step 1: Add failing test for subject-mismatch instruction**

In `aiAsk.test.ts`:
```typescript
it("includes subject-mismatch hallucination guard in search instructions", () => {
  const context = buildAiSearchPromptContext([document()], "claude webhook 사용법");
  const input = buildAiSearchInput(context);

  expect(input[0]?.content).toContain("subject of the user's question does not appear");
  expect(input[0]?.content).toContain("unsupportedClaims");
});
```

Run to confirm FAILS:
```bash
pnpm test --filter wiki-core -- aiAsk
```

- [ ] **Step 2: Add subject-mismatch guard to `buildAiSearchInstructions`**

In `aiAsk.ts`, inside the instructions array in `buildAiSearchInstructionsForIntent`, add after the existing "Use only the supplied Confluence context" line:

```typescript
"If the core subject of the user's question (e.g. 'claude webhook', 'codex api') does not appear in any of the supplied searchResults, do NOT answer using documents about a different subject. Instead: set the answer to a short Korean sentence saying the wiki does not currently have a page for that exact subject, and add the missing subject to unsupportedClaims.",
"Never substitute a related-but-different subject (e.g. answering 'Teams webhook' when asked about 'claude webhook'). Subject substitution is a hallucination.",
```

- [ ] **Step 3: Run tests**

```bash
pnpm test --filter wiki-core -- aiAsk
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/wiki-core/src/lib/aiAsk.ts packages/wiki-core/src/lib/aiAsk.test.ts
git commit -m "Add subject-mismatch hallucination guard to AI search instructions"
```

---

## Task 6: Vibe-coding scenario test suite + Codex validation

**Files:**
- Modify: `packages/wiki-core/src/lib/intentClassifier.test.ts`

- [ ] **Step 1: Add full vibe-coding test scenarios**

Add to `intentClassifier.test.ts`:

```typescript
describe("vibe-coding real-world scenarios", () => {
  // Concept: tool-name + question word (the original bug)
  it.each([
    ["MCP가 뭐야?", "concept"],
    ["CLI가 뭐야?", "concept"],
    ["vibe coding이 뭐임?", "concept"],
    ["Codex가 먼지 알고 싶어", "concept"],
    ["webhook이 뭐야", "concept"],
    ["API가 뭔데?", "concept"],
    ["claude code 그게 뭐야", "concept"],
    ["MCP 뜻이 뭐야", "concept"],
  ])("concept: %s → %s", (q, intent) => {
    expect(classifyQuestionIntent(q)).toBe(intent);
  });

  // Setup: explicit action verb required
  it.each([
    ["MCP 설정 방법", "setup"],
    ["Codex CLI 설치 어떻게 해?", "setup"],
    ["claude code 설치하고 싶어", "setup"],
    ["MCP 연결 방법 알려줘", "setup"],
    ["Gmail MCP 어떻게 설정해?", "setup"],
    ["claude code configure 하는 법", "setup"],
  ])("setup: %s → %s", (q, intent) => {
    expect(classifyQuestionIntent(q)).toBe(intent);
  });

  // Troubleshooting
  it.each([
    ["MCP 연결이 안 돼", "troubleshooting"],
    ["Codex 설치 오류 났어", "troubleshooting"],
    ["MCP 설정이 자꾸 실패해", "troubleshooting"],
    ["claude code 실행이 안됨", "troubleshooting"],
  ])("troubleshooting: %s → %s", (q, intent) => {
    expect(classifyQuestionIntent(q)).toBe(intent);
  });

  // Page lookup
  it.each([
    ["MCP 설정 페이지 있어?", "page-lookup"],
    ["Claude Code 가이드 어디 있어?", "page-lookup"],
    ["vibe coding 관련 문서 찾아줘", "page-lookup"],
    ["Codex 설치 가이드 링크 알려줘", "page-lookup"],
  ])("page-lookup: %s → %s", (q, intent) => {
    expect(classifyQuestionIntent(q)).toBe(intent);
  });

  // Broad planning
  it.each([
    ["vibe coding 시작하기 전에 뭘 준비해야 해?", "broad-planning"],
    ["AI 코딩 프로젝트 설계 순서가 어떻게 돼?", "broad-planning"],
    ["MCP 도입 순서 체크리스트가 뭐야?", "broad-planning"],
  ])("broad-planning: %s → %s", (q, intent) => {
    expect(classifyQuestionIntent(q)).toBe(intent);
  });
});
```

- [ ] **Step 2: Run full test suite**

```bash
cd /home/donghyunlee/projects/SFOOD-LLM-WIKI
pnpm test --filter wiki-core
```

Expected: All tests PASS.

- [ ] **Step 3: Send test cases + classifier to Codex for final validation**

Ask Codex:
- Do the test cases cover the important real-world vibe coding scenarios?
- Are there missing edge cases?
- Does the classifier correctly handle all the provided cases?

- [ ] **Step 4: Apply Codex feedback, rerun tests until green**

```bash
pnpm test --filter wiki-core
```

- [ ] **Step 5: Final typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 6: Commit final state**

```bash
git add packages/wiki-core/src/lib/intentClassifier.test.ts
git commit -m "Add comprehensive vibe-coding scenario tests for intent classifier"
```

---

## Task 7: Export from package index + full test run

**Files:**
- Modify: `packages/wiki-core/src/index.ts`

- [ ] **Step 1: Check current exports**

```bash
grep -n "classifySearch\|inferSearch\|intentClass" packages/wiki-core/src/index.ts
```

- [ ] **Step 2: Update exports if `classifySearchQuestionIntent` was exported**

If the old function was exported, replace with:
```typescript
export { classifyQuestionIntent, extractQuestionSubjects } from "./lib/intentClassifier";
export type { QuestionIntent } from "./lib/intentClassifier";
```

Remove any export of `classifySearchQuestionIntent` or `SearchQuestionIntent` from `aiAsk.ts` if they were re-exported.

- [ ] **Step 3: Run full workspace tests**

```bash
cd /home/donghyunlee/projects/SFOOD-LLM-WIKI
pnpm test
pnpm typecheck
```

Expected: All tests PASS, no type errors.

- [ ] **Step 4: Final commit**

```bash
git add packages/wiki-core/src/index.ts
git commit -m "Export classifyQuestionIntent from wiki-core public API"
```

---

## Codex Iteration Log

After each major task, results are recorded in:
`docs/tasks/intent-classifier-redesign/codex-dialogue.md`

Format per round:
```
## Round N — [date]
**Sent:** [summary of what was shown]
**Codex feedback:** [key points]
**Changes made:** [what was adjusted]
**Still open:** [anything not yet resolved]
```
