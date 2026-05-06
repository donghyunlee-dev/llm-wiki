import React from "react";

const navItems = ["가이드", "프로젝트", "자료실", "FAQ"];

const quickMenus = [
  { title: "시작 가이드", desc: "처음이라면 여기서 시작하세요." },
  { title: "프로젝트 사례", desc: "완성된 결과를 참고하세요." },
  { title: "자료실", desc: "기본 지침서와 템플릿입니다." },
  { title: "FAQ", desc: "자주 묻는 질문을 확인하세요." },
];

const guideItems = ["Agent 시작하기", "사내 위키 활용 방법", "프로젝트 설계 시작하기"];
const projectExamples = ["업무 승인 요청 도구", "주간 보고서 자동화", "내부 문의 챗봇"];
const searchExamples = ["업무 자동화 시작 방법", "프로젝트 사례 찾기", "자주 묻는 질문 확인"];

const themeOptions = [
  { value: "light", label: "라이트" },
  { value: "dark", label: "다크" },
  { value: "system", label: "시스템" },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function hasKorean(text) {
  return new RegExp("[가-힣]").test(text);
}

function containsBlockedFeature(text) {
  return new RegExp("대시보드|로그|개인|진행률").test(text);
}

function containsImplementationStorage(text) {
  return new RegExp("Confluence|컨플루언스|DB|데이터베이스").test(text);
}

function containsExplicitAiLabel(text) {
  return new RegExp("AI Wiki|AI\\s").test(text);
}

function getVisibleText() {
  return [
    ...navItems,
    ...quickMenus.map((item) => item.title),
    ...quickMenus.map((item) => item.desc),
    ...guideItems,
    ...projectExamples,
    ...searchExamples,
    "LLM Wiki",
    "사내 지식 위키",
    "사내 지식을 쉽게 찾아보세요",
    "궁금한 내용을 입력하면 관련 문서와 사례, FAQ를 함께 확인할 수 있습니다.",
    "예: 업무 자동화는 어떻게 시작하나요?",
    "추천 가이드",
    "프로젝트 사례",
    "만들고 싶은 방향이 정리되었나요?",
    "가이드와 사례를 확인한 뒤 만들고 싶은 내용을 설계로 정리하세요.",
  ].join(" ");
}

function runHomeDataTests() {
  const visibleText = getVisibleText();

  return [
    { name: "main navigation has four items", pass: navItems.length === 4 },
    { name: "quick menu has four entry points", pass: quickMenus.length === 4 },
    { name: "recommended guide list has three items", pass: guideItems.length === 3 },
    { name: "project example list has three items", pass: projectExamples.length === 3 },
    {
      name: "navigation labels are Korean or approved acronyms",
      pass: navItems.every((item) => hasKorean(item) || item === "FAQ"),
    },
    {
      name: "navigation does not expose private dashboard features",
      pass: navItems.every((item) => !containsBlockedFeature(item)),
    },
    { name: "search examples are limited to three", pass: searchExamples.length === 3 },
    {
      name: "no quick menu requires private user data",
      pass: quickMenus.every((item) => !containsBlockedFeature(item.title + item.desc)),
    },
    {
      name: "homepage keeps focused content groups",
      pass: quickMenus.length + guideItems.length + projectExamples.length <= 10,
    },
    {
      name: "homepage does not mention implementation storage",
      pass: !containsImplementationStorage(visibleText),
    },
    {
      name: "homepage avoids explicit AI wording in visible labels",
      pass: !containsExplicitAiLabel(visibleText),
    },
    {
      name: "search examples replace quick action chips",
      pass: searchExamples.length === 3 && !visibleText.includes("가이드 추천"),
    },
    {
      name: "theme control supports light dark and system",
      pass:
        themeOptions.length === 3 &&
        themeOptions.some((option) => option.value === "light") &&
        themeOptions.some((option) => option.value === "dark") &&
        themeOptions.some((option) => option.value === "system"),
    },
    {
      name: "theme options have visible Korean labels",
      pass: themeOptions.every((option) => hasKorean(option.label)),
    },
    {
      name: "blueprint section has dedicated theme tokens",
      pass: Boolean(styles(false).blueprintTitle && styles(false).blueprintBody && styles(true).blueprintTitle && styles(true).blueprintBody),
    },
  ];
}

const testResults = runHomeDataTests();
const hasFailedTest = testResults.some((test) => !test.pass);

function styles(isDark) {
  return {
    page: cn("min-h-screen", isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"),
    shell: "mx-auto max-w-6xl px-6 py-6",
    surface: cn(
      "overflow-hidden rounded-3xl border shadow-sm",
      isDark ? "border-slate-800 bg-slate-900 shadow-none" : "border-slate-200 bg-white"
    ),
    header: cn("flex h-14 items-center justify-between border-b px-7", isDark ? "border-slate-800" : "border-slate-100"),
    logoText: cn("text-lg font-bold tracking-tight", isDark ? "text-white" : "text-slate-950"),
    section: "px-7 py-8",
    sectionCompact: "px-7 pb-8",
    content: "mx-auto max-w-5xl",
    card: cn("rounded-2xl border", isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"),
    cardHover: isDark ? "hover:border-blue-900 hover:bg-slate-800" : "hover:border-blue-200 hover:bg-blue-50",
    cardPadding: "p-5",
    eyebrow: cn("text-sm font-semibold", isDark ? "text-blue-400" : "text-blue-600"),
    title: cn("text-3xl font-bold leading-tight tracking-tight md:text-4xl", isDark ? "text-white" : "text-slate-950"),
    sectionTitle: cn("text-base font-bold", isDark ? "text-white" : "text-slate-900"),
    body: cn("text-sm leading-6", isDark ? "text-slate-400" : "text-slate-500"),
    searchBox: cn(
      "mx-auto mt-7 max-w-2xl rounded-2xl border p-3 text-left shadow-lg",
      isDark ? "border-slate-800 bg-slate-950 shadow-none" : "border-slate-200 bg-white shadow-slate-100"
    ),
    input: cn(
      "h-11 flex-1 border-0 bg-transparent text-sm outline-none",
      isDark ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"
    ),
    tag: cn(
      "rounded-lg px-3 py-2 text-sm font-bold",
      isDark ? "bg-blue-950 text-blue-300" : "bg-blue-50 text-blue-600"
    ),
    primaryButton: cn(
      "rounded-xl px-5 py-2.5 text-sm font-bold text-white",
      isDark ? "bg-blue-500 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
    ),
    secondaryButton: cn("text-sm font-semibold", isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"),
    mutedText: isDark ? "text-slate-500" : "text-slate-400",
    listItem: cn(
      "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm",
      isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
    ),
    blueprint: cn(
      "mx-auto flex max-w-5xl items-center justify-between rounded-2xl border px-5 py-5",
      isDark ? "border-slate-200 bg-slate-100 text-slate-950" : "border-slate-900 bg-slate-900 text-white"
    ),
    blueprintTitle: cn("text-base font-bold", isDark ? "text-slate-950" : "text-white"),
    blueprintBody: cn("mt-1 text-sm leading-6", isDark ? "text-slate-600" : "text-slate-300"),
    blueprintButton: cn(
      "rounded-xl px-4 py-2 text-sm font-bold",
      isDark ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-white text-slate-900 hover:bg-blue-50"
    ),
    themeGroup: cn(
      "flex rounded-xl border p-1",
      isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"
    ),
  };
}

function DataTestPanel() {
  if (!hasFailedTest) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="rounded-2xl border border-red-200 bg-white p-5 text-red-700 shadow-sm">
        <h1 className="text-base font-bold">화면 데이터 테스트 실패</h1>
        <ul className="mt-4 list-disc pl-5 text-sm">
          {testResults.map((test) => (
            <li key={test.name} className={test.pass ? "text-slate-500" : "text-red-700"}>
              {test.pass ? "PASS" : "FAIL"}: {test.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ThemeSegmentedControl({ theme, onThemeChange, isDark }) {
  const s = styles(isDark);

  return (
    <div className={s.themeGroup} role="group" aria-label="테마 선택">
      {themeOptions.map((option) => {
        const isSelected = theme === option.value;
        return (
          <button
            key={option.value}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              isSelected
                ? isDark
                  ? "bg-slate-950 text-white shadow-sm"
                  : "bg-white text-slate-900 shadow-sm"
                : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-500 hover:text-slate-900"
            )}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onThemeChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Header({ theme, onThemeChange, isDark }) {
  const s = styles(isDark);

  return (
    <header className={s.header}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">W</div>
        <span className={s.logoText}>LLM Wiki</span>
      </div>
      <ThemeSegmentedControl theme={theme} onThemeChange={onThemeChange} isDark={isDark} />
    </header>
  );
}

function Hero({ isDark }) {
  const s = styles(isDark);

  return (
    <section className="px-7 pb-10 pt-12 md:pb-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className={cn(s.eyebrow, "mb-3")}>사내 지식 위키</p>
        <h1 className={s.title}>사내 지식을 쉽게 찾아보세요</h1>
        <p className={cn(s.body, "mx-auto mt-3 max-w-xl")}>
          궁금한 내용을 입력하면 관련 문서와 사례, FAQ를 함께 확인할 수 있습니다.
        </p>

        <div className={s.searchBox}>
          <div className="flex items-center gap-3">
            <span className={s.tag}>질문</span>
            <input className={s.input} placeholder="예: 업무 자동화는 어떻게 시작하나요?" />
            <button className={s.primaryButton} aria-label="질문하기" type="button">
              검색
            </button>
          </div>
        </div>

        <p className={cn("mx-auto mt-3 max-w-xl text-xs leading-5", s.mutedText)}>
          예시: {searchExamples.join(" · ")}
        </p>
      </div>
    </section>
  );
}

function EntrySection({ isDark }) {
  const s = styles(isDark);

  return (
    <section className={cn(s.section, isDark ? "border-t border-slate-800" : "border-t border-slate-100")}>
      <div className={cn(s.content, "grid gap-4 md:grid-cols-4")}>
        {quickMenus.map((item) => (
          <button key={item.title} className={cn(s.card, s.cardPadding, s.cardHover, "text-left")} type="button">
            <h2 className={s.sectionTitle}>{item.title}</h2>
            <p className={cn(s.body, "mt-2")}>{item.desc}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function ListPanel({ title, actionLabel, items, external = false, isDark }) {
  const s = styles(isDark);

  return (
    <div className={cn(s.card, s.cardPadding)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className={s.sectionTitle}>{title}</h2>
        <button className={s.secondaryButton} type="button">
          {actionLabel}
        </button>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <button key={item} className={s.listItem} type="button">
            <span>{item}</span>
            <span className={s.mutedText}>{external ? "↗" : "→"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CompactContentSection({ isDark }) {
  const s = styles(isDark);

  return (
    <section className={s.sectionCompact}>
      <div className={cn(s.content, "grid gap-4 md:grid-cols-2")}>
        <ListPanel title="추천 가이드" actionLabel="전체 보기" items={guideItems} isDark={isDark} />
        <ListPanel title="프로젝트 사례" actionLabel="전체 보기" items={projectExamples} external={true} isDark={isDark} />
      </div>
    </section>
  );
}

function BlueprintSection({ isDark }) {
  const s = styles(isDark);

  return (
    <section className={s.sectionCompact}>
      <div className={s.blueprint}>
        <div>
          <h2 className={s.blueprintTitle}>만들고 싶은 방향이 정리되었나요?</h2>
          <p className={s.blueprintBody}>가이드와 사례를 확인한 뒤 만들고 싶은 내용을 설계로 정리하세요.</p>
        </div>
        <button className={s.blueprintButton} type="button">
          시작하기
        </button>
      </div>
    </section>
  );
}

export default function LlmWikiHomeConcept() {
  const [theme, setTheme] = React.useState("system");
  const [systemPrefersDark, setSystemPrefersDark] = React.useState(false);
  const isDark = theme === "dark" || (theme === "system" && systemPrefersDark);
  const s = styles(isDark);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemPrefersDark(mediaQuery.matches);

    updateSystemTheme();
    mediaQuery.addEventListener("change", updateSystemTheme);

    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  if (hasFailedTest) return <DataTestPanel />;

  return (
    <div className={s.page}>
      <div className={s.shell}>
        <div className={s.surface}>
          <Header theme={theme} onThemeChange={setTheme} isDark={isDark} />
          <main>
            <Hero isDark={isDark} />
            <EntrySection isDark={isDark} />
            <CompactContentSection isDark={isDark} />
            <BlueprintSection isDark={isDark} />
          </main>
        </div>
      </div>
    </div>
  );
}
