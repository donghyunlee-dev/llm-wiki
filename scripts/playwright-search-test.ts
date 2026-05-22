/**
 * Playwright-based search pipeline test for 10 representative questions.
 * Tests the 3-stage AI search pipeline (Stage 1: query understanding,
 * Stage 2: lexical search, Stage 3: AI answer).
 */
import { chromium } from "playwright";

const BASE_URL = "http://localhost:5173";

const TEST_QUESTIONS = [
  // concept
  "MCP가 뭐야?",
  "vibe coding이 뭔지 알고 싶어",
  // setup
  "Codex CLI 설치 어떻게 해?",
  "MCP 연결 방법 알려줘",
  // troubleshooting
  "MCP 연결이 안 돼",
  // comparison — the key test case that motivated this work
  "클로드와 코덱스의 스킬 차이점이 뭐지?",
  // page-lookup
  "Claude Code 가이드 어디 있어?",
  // broad-planning
  "vibe coding 시작하기 전에 뭘 준비해야 해?",
  // Korean-only concept (tests Stage 1 keyword bridging)
  "스킬이 뭐야?",
  // compound subject
  "claude code skill 어떻게 써?",
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results: Array<{
    question: string;
    hasAnswer: boolean;
    answerPreview: string;
    hasRecommendedDocs: boolean;
    recommendedDocTitles: string[];
    searchKeywordsLogged?: string;
  }> = [];

  for (const question of TEST_QUESTIONS) {
    console.log(`\n▶ Testing: "${question}"`);
    try {
      await page.goto(`${BASE_URL}/search`, { waitUntil: "domcontentloaded" });

      // Find the search input and type the question
      const input = page.locator("input[type='text'], input[type='search']").first();
      await input.fill(question);
      await page.keyboard.press("Enter");

      // Wait for answer to appear (up to 30s for AI response)
      const answerSelector = "[data-testid='search-answer'], .search-answer, article, main p";
      try {
        await page.waitForSelector(answerSelector, { timeout: 30000 });
      } catch {
        // Try waiting a bit more for content
        await page.waitForTimeout(5000);
      }

      // Grab answer text
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasAnswer = bodyText.length > 200 && !bodyText.includes("관련 문서를 찾지 못했");
      const answerPreview = bodyText.slice(0, 300).replace(/\s+/g, " ").trim();

      // Check for recommended docs
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href]"))
          .map((a) => (a as HTMLAnchorElement).textContent?.trim() ?? "")
          .filter((t) => t.length > 3 && !t.startsWith("http")),
      );
      const recommendedDocTitles = links.slice(0, 5);
      const hasRecommendedDocs = links.length > 0;

      results.push({ question, hasAnswer, answerPreview, hasRecommendedDocs, recommendedDocTitles });
      console.log(`  ✓ hasAnswer=${hasAnswer}, docs=${links.length}`);
      if (answerPreview) {
        console.log(`  Preview: ${answerPreview.slice(0, 150)}…`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        question,
        hasAnswer: false,
        answerPreview: `ERROR: ${msg}`,
        hasRecommendedDocs: false,
        recommendedDocTitles: [],
      });
      console.log(`  ✗ ERROR: ${msg}`);
    }
  }

  await browser.close();

  console.log("\n\n═══════════════════════════════════════════════");
  console.log("RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════════");
  let passed = 0;
  let failed = 0;
  for (const r of results) {
    const status = r.hasAnswer ? "PASS" : "FAIL";
    if (r.hasAnswer) passed++;
    else failed++;
    console.log(`\n[${status}] ${r.question}`);
    console.log(`  Answer: ${r.answerPreview.slice(0, 200)}`);
    console.log(`  Docs:   ${r.recommendedDocTitles.join(", ") || "(none)"}`);
  }
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`TOTAL: ${passed} passed, ${failed} failed out of ${results.length}`);
  console.log(`═══════════════════════════════════════════════`);
}

main().catch(console.error);
