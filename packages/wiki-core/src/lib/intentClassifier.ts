export type QuestionIntent =
  | "page-lookup"
  | "concept"
  | "setup"
  | "broad-planning"
  | "comparison"
  | "troubleshooting"
  | "general";

type IntentScores = Record<QuestionIntent, number>;

// Explicit priority when scores tie (page-lookup is handled before scoring)
const TIE_BREAK_ORDER: QuestionIntent[] = [
  "troubleshooting",
  "setup",
  "broad-planning",
  "comparison",
  "concept",
  "general",
];

// Single source of truth for subject tokens
const KNOWN_SUBJECTS = [
  "vibe coding",
  "microsoft 365",
  "mcp",
  "cli",
  "codex",
  "claude",
  "webhook",
  "gmail",
  "outlook",
  "m365",
  "playwright",
  "jira",
  "github",
  "api",
  "cline",
  "cursor",
  "gemini",
  "filesystem",
] as const;

// Short Latin subjects that need word boundary to avoid matching inside longer words
const WORD_BOUNDARY_SUBJECTS = new Set(["mcp", "cli", "api"]);

export function classifyQuestionIntent(question: string): QuestionIntent {
  const normalized = question.trim().toLocaleLowerCase("ko-KR");

  if (!normalized) return "general";

  // Deterministic: page-lookup wins immediately when the shape is clear
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

  // Trouble signals (high priority) — covers 안 돼/안됨/안됩/실패 variants
  if (/(오류|에러|failed|fail|문제|해결|실패|안 되|안되|안 돼|안됨|안 됨|안됩|트러블|troubleshoot)/.test(normalized)) {
    scores.troubleshooting += 5;
  }

  // Comparison signals
  if (/(비교|차이|vs|대신|중에|선택|고를|추천)/.test(normalized)) {
    scores.comparison += 4;
  }

  // Setup action signals — action VERBS only, no tool names
  if (/(설치|설정|구성|세팅|연결|연동|로그인|login|install|configure|setup|enable)/.test(normalized)) {
    scores.setup += 4;
  }
  // Usage/how-to signals — "어떻게 사용하는지", "사용법", "쓰는 법" 등
  // concept만큼 강하지 않지만 실행 가이드 쪽으로 유도
  if (/(사용법|사용하기|어떻게 사용|쓰는 법|활용법|사용 방법)/.test(normalized)) {
    scores.setup += 2;
  }

  // Broad planning signals
  if (/(시작하기 전에|준비|설계|계획|먼저 읽|순서|어떤 흐름|체크리스트|무엇을 해야|무엇부터)/.test(normalized)) {
    scores["broad-planning"] += 4;
  }

  // Concept: explicit colloquial question-word endings (뭐야, 뭐임, 먼지=뭔지 등)
  // 머/먼 단독은 오탐 위험(머신러닝, 먼저)이 있어 제외하고 복합형만 허용
  // 일부는 whitespace tolerant: 뭐\s*지, 뭐\s*하는, 뭔\s*지
  if (/(뭐야|뭐임|뭐죠|뭔데|뭐\s*지|뭔\s*지|먼지|뭐여|뭐에요|뭐예요|뭐가요|뭐인가|뭘까|뭐\s*하는)/.test(normalized)) {
    scores.concept += 3;
  }
  // Concept: formal definition words
  if (/(무엇인지|무엇인가|무엇인가요|정의|개념|뜻|설명|what is|what's|what is this)/.test(normalized)) {
    scores.concept += 3;
  }

  // Bonus: subject-only short question with no action verb → likely concept
  if (isSubjectOnlyQuestion(normalized)) {
    scores.concept += 2;
  }

  return highestScore(scores);
}

export function extractQuestionSubjects(question: string): string[] {
  const normalized = question.trim().toLocaleLowerCase("ko-KR");

  return KNOWN_SUBJECTS.filter((subject) => subjectMatchesIn(normalized, subject));
}

function isPageLookupShape(normalized: string): boolean {
  const pageNounPattern = /(페이지|문서|가이드|자료|링크|page|document|doc|guide|link)/;
  const lookupVerbPattern = /(있|없|찾|어디|위치|보여|알려|열|나와|나옴|있나|있어|있지|찾아|찾아줘|보여줘|where|find|show|open|exist|available)/;

  if (pageNounPattern.test(normalized) && lookupVerbPattern.test(normalized)) return true;

  if (/(관련\s*(페이지|문서|가이드|자료|링크))|((페이지|문서|가이드|자료|링크)\s*(있나|있어|있지|없나|어디|찾아|찾아줘|보여줘))/.test(normalized)) {
    return true;
  }

  // bare "링크" at end → asking for a URL
  if (/링크\s*$/.test(normalized)) return true;

  return false;
}

function isSubjectOnlyQuestion(normalized: string): boolean {
  if (normalized.length > 30) return false;

  const hasSetupAction = /(설치|설정|구성|세팅|연결|install|configure|setup)/.test(normalized);
  const hasTroubleAction = /(오류|에러|실패|안됨|안 됨|안됩|안 되|안 돼|문제|failed)/.test(normalized);
  const hasPlanningSignal = /(준비|설계|계획|순서|체크리스트|흐름|무엇부터)/.test(normalized);
  // 사용법/활용/예시/방법은 how-to에 가까우므로 concept 보너스 부여 안 함
  const hasUsageIntent = /(사용법|활용|예시|방법|사용하기|쓰는|사용하는)/.test(normalized);
  const hasSubjectToken = KNOWN_SUBJECTS.some((s) => subjectMatchesIn(normalized, s));

  return hasSubjectToken && !hasSetupAction && !hasTroubleAction && !hasPlanningSignal && !hasUsageIntent;
}

function subjectMatchesIn(normalized: string, subject: string): boolean {
  if (WORD_BOUNDARY_SUBJECTS.has(subject)) {
    // Require non-alphanumeric boundary on both sides
    const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`).test(normalized);
  }

  return normalized.includes(subject);
}

function highestScore(scores: IntentScores): QuestionIntent {
  let best: QuestionIntent = "general";
  let bestScore = 0;

  for (const intent of TIE_BREAK_ORDER) {
    const score = scores[intent];

    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  return best;
}
