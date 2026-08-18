export type EntryCard = {
  title: string;
  description: string;
  href: string;
};

export type HomeContent = {
  hero: {
    eyebrow: string;
    title: string;
    body: string;
  };
  search: {
    placeholder: string;
    examples: [string, string, string];
  };
  entryCards: [EntryCard, EntryCard, EntryCard, EntryCard];
  projectDesign: {
    title: string;
    body: string;
    cta: string;
    href: string;
  };
};

export const BLOCKED_UI_TERMS = [
  "Confluence",
  "컨플루언스",
  "DB",
  "데이터베이스",
  "대시보드",
  "로그",
  "개인",
  "진행률",
  "AI Wiki",
  "AI ",
] as const;

export const HOME_CONTENT: HomeContent = {
  hero: {
    eyebrow: "사내 지식 위키",
    title: "궁금한 것을 검색해보세요",
    body: "궁금한 내용을 입력하면 관련 문서와 사례, FAQ를 함께 확인할 수 있습니다.",
  },
  search: {
    placeholder: "예: 업무 자동화는 어떻게 시작하나요?",
    examples: [
      "업무 자동화 시작 방법",
      "프로젝트 사례 찾기",
      "자주 묻는 질문 확인",
    ],
  },
  entryCards: [
    {
      title: "시작 가이드",
      description: "처음이라면 여기서 시작하세요.",
      href: "/guides",
    },
    {
      title: "프로젝트 사례",
      description: "완성된 결과를 참고하세요.",
      href: "/projects",
    },
    {
      title: "자료실",
      description: "기본 지침서와 템플릿입니다.",
      href: "/library",
    },
    {
      title: "FAQ",
      description: "자주 묻는 질문을 확인하세요.",
      href: "/faq",
    },
  ],
  projectDesign: {
    title: "만들고 싶은 방향이 정리되었나요?",
    body: "가이드와 사례를 확인한 뒤 만들고 싶은 내용을 설계로 정리하세요.",
    cta: "시작하기",
    href: "/project-design/start",
  },
};

export function collectVisibleText(content: HomeContent) {
  // content.projectDesign is intentionally excluded — HomePage.tsx currently hides that CTA
  // (unfinished feature), so its copy isn't actually rendered anywhere. Re-add it here if that
  // CTA is un-hidden.
  return [
    content.hero.eyebrow,
    content.hero.title,
    content.hero.body,
    content.search.placeholder,
    ...content.search.examples,
    ...content.entryCards.flatMap((card) => [card.title, card.description]),
    "LLM Wiki",
  ].join(" ");
}

function containsBlockedText(text: string) {
  return BLOCKED_UI_TERMS.some((term) => text.includes(term));
}

export function validateHomePageContent(content: HomeContent) {
  const visibleText = collectVisibleText(content);

  return [
    {
      name: "main entry cards stay fixed at four",
      pass: content.entryCards.length === 4,
    },
    {
      name: "search examples stay fixed at three",
      pass: content.search.examples.length === 3,
    },
    {
      name: "visible copy avoids blocked user-facing terms",
      pass: !containsBlockedText(visibleText),
    },
  ];
}
