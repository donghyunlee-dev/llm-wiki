import { classifyQuestionIntent, extractQuestionSubjects } from "../packages/wiki-core/src/lib/intentClassifier";
import { buildAiSearchInput, buildAiSearchPromptContext } from "../packages/wiki-core/src/lib/aiAsk";
import type { WikiDocument } from "../packages/wiki-core/src/lib/wikiDocuments";

function doc(id: string, title: string, slug: string): WikiDocument {
  return {
    id,
    slug,
    title,
    summary: `${title} 요약`,
    updatedAt: "2026-05-21",
    metadata: { docType: "guide", audience: "beginner", status: "published", prerequisites: [], next: [], related: [] },
    headings: [],
    contentHtml: `<h1>${title}</h1><p>${title} 내용입니다.</p>`,
  };
}

const TEST_CASES: Array<{
  question: string;
  expectedIntent: string;
  expectedSubjects: string[];
  checkPrompt?: (sys: string, user: string) => { label: string; pass: boolean }[];
}> = [
  {
    question: "MCP가 뭐야?",
    expectedIntent: "concept",
    expectedSubjects: ["mcp"],
    checkPrompt: (sys) => [
      { label: "concept/definition hint in system", pass: sys.includes("concept or definition questions") },
      { label: "RELEVANCE CHECK present", pass: sys.includes("RELEVANCE CHECK") },
      { label: "No SUBJECT COVERAGE GATE", pass: !sys.includes("SUBJECT COVERAGE GATE") },
    ],
  },
  {
    question: "Codex CLI 설치 어떻게 해?",
    expectedIntent: "setup",
    expectedSubjects: ["codex", "cli"],
    checkPrompt: (sys) => [
      { label: "brief explanation hint in system", pass: sys.includes("brief explanation of what the page family is for") },
      { label: "RELEVANCE CHECK present", pass: sys.includes("RELEVANCE CHECK") },
    ],
  },
  {
    question: "코덱스와 클로드의 skill이 뭐가 다르지?",
    expectedIntent: "comparison",
    expectedSubjects: ["codex", "claude"],
    checkPrompt: (sys, user) => [
      { label: "COMPARISON question in system", pass: sys.includes("COMPARISON question") },
      { label: "combining pages is correct in system", pass: sys.includes("combining two relevant pages is correct and expected") },
      { label: "questionIntent=comparison in user", pass: user.includes('"questionIntent":"comparison"') },
      { label: "No SUBJECT COVERAGE GATE", pass: !sys.includes("SUBJECT COVERAGE GATE") },
    ],
  },
  {
    question: "MCP 설정 페이지 있어?",
    expectedIntent: "page-lookup",
    expectedSubjects: ["mcp"],
    checkPrompt: (sys, user) => [
      { label: "finding whether page exists in system", pass: sys.includes("finding whether a relevant page exists in searchResults") },
      { label: "questionIntent=page-lookup in user", pass: user.includes('"questionIntent":"page-lookup"') },
    ],
  },
  {
    question: "MCP 연결이 안 돼",
    expectedIntent: "troubleshooting",
    expectedSubjects: ["mcp"],
    checkPrompt: (_sys, user) => [
      { label: "questionIntent=troubleshooting in user", pass: user.includes('"questionIntent":"troubleshooting"') },
    ],
  },
  {
    question: "vibe coding 시작하기 전에 뭘 준비해야 해?",
    expectedIntent: "broad-planning",
    expectedSubjects: ["vibe coding"],
    checkPrompt: (sys, user) => [
      { label: "practical checklist in system", pass: sys.includes("practical checklist") },
      { label: "questionIntent=broad-planning in user", pass: user.includes('"questionIntent":"broad-planning"') },
    ],
  },
  {
    question: "Claude Code랑 Cursor 중에 뭐가 달라?",
    expectedIntent: "comparison",
    expectedSubjects: ["claude", "cursor"],
    checkPrompt: (sys, user) => [
      { label: "COMPARISON question in system", pass: sys.includes("COMPARISON question") },
      { label: "combining pages is correct in system", pass: sys.includes("combining two relevant pages is correct and expected") },
      { label: "questionIntent=comparison in user", pass: user.includes('"questionIntent":"comparison"') },
    ],
  },
  {
    question: "Codex에서 Jira 이슈를 읽으려면?",
    expectedIntent: "setup",
    expectedSubjects: ["codex", "jira"],
    checkPrompt: (sys, user) => [
      { label: "questionIntent=setup in user", pass: user.includes('"questionIntent":"setup"') },
      { label: "RELEVANCE CHECK present", pass: sys.includes("RELEVANCE CHECK") },
    ],
  },
  {
    question: "claude webhook 사용법",
    expectedIntent: "setup",
    expectedSubjects: ["claude", "webhook"],
    checkPrompt: (sys, user) => [
      { label: "COMPOUND TOPIC in system", pass: sys.includes("COMPOUND TOPIC question") },
      { label: "do NOT together satisfy in system", pass: sys.includes("do NOT together satisfy") },
      { label: "questionIntent=setup in user", pass: user.includes('"questionIntent":"setup"') },
    ],
  },
  {
    question: "클로드 코드 설치 방법",
    expectedIntent: "setup",
    expectedSubjects: ["claude"],
    checkPrompt: (_sys, user) => [
      { label: "questionIntent=setup in user", pass: user.includes('"questionIntent":"setup"') },
    ],
  },
];

const PASS = "✅";
const FAIL = "❌";
const WARN = "⚠️ ";

let totalPass = 0;
let totalFail = 0;

console.log("=".repeat(80));
console.log("GATE 제거 후 검색 동작 검증 — 10개 질문 테스트 결과");
console.log("=".repeat(80));
console.log();

for (let i = 0; i < TEST_CASES.length; i++) {
  const tc = TEST_CASES[i];
  const num = String(i + 1).padStart(2, " ");
  console.log(`Q${num}. "${tc.question}"`);

  // 1. Intent classification
  const intent = classifyQuestionIntent(tc.question);
  const intentPass = intent === tc.expectedIntent;
  const intentIcon = intentPass ? PASS : FAIL;
  intentPass ? totalPass++ : totalFail++;
  console.log(`    ${intentIcon} Intent: ${intent} (예상: ${tc.expectedIntent})`);

  // 2. Subject extraction
  const subjects = extractQuestionSubjects(tc.question);
  const subjectsPass = tc.expectedSubjects.every((s) => subjects.includes(s));
  const subjectsIcon = subjectsPass ? PASS : FAIL;
  subjectsPass ? totalPass++ : totalFail++;
  console.log(`    ${subjectsIcon} Subjects: [${subjects.join(", ")}] (예상: [${tc.expectedSubjects.join(", ")}])`);

  // 3. Prompt checks
  if (tc.checkPrompt) {
    const fakeDocs = [doc("page-1", "Guide", "guide")];
    const context = buildAiSearchPromptContext(fakeDocs, tc.question);
    const input = buildAiSearchInput(context);
    const sys = (input[0]?.content as string) ?? "";
    const user = (input[1]?.content as string) ?? "";

    const checks = tc.checkPrompt(sys, user);
    for (const check of checks) {
      const icon = check.pass ? PASS : FAIL;
      check.pass ? totalPass++ : totalFail++;
      console.log(`    ${icon} Prompt: ${check.label}`);
    }
  }

  console.log();
}

console.log("=".repeat(80));
const total = totalPass + totalFail;
const pct = Math.round((totalPass / total) * 100);
const summary = totalFail === 0 ? PASS : WARN;
console.log(`${summary} 결과: ${totalPass}/${total} 통과 (${pct}%)`);
if (totalFail > 0) {
  console.log(`   FAIL 항목 ${totalFail}개 — 위 ${FAIL} 항목을 확인해 주세요.`);
}
console.log("=".repeat(80));
