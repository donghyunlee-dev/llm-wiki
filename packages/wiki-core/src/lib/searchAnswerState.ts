type SearchAnswerStateLike = {
  answer?: string;
  confluenceData?: Array<{
    pageId: string;
  }>;
  unsupportedClaims?: string[];
};

const NO_PAGE_ANSWER_PATTERNS = [
  /^현재 위키에 해당 주제에 대한 페이지가 없습니다/,
  /^관련 문서를 찾지 못했습니다/,
] as const;

export function isNoPageStyleSearchAnswer(answer: SearchAnswerStateLike | null | undefined) {
  const visibleAnswer = answer?.answer?.trim() ?? "";
  return NO_PAGE_ANSWER_PATTERNS.some((pattern) => pattern.test(visibleAnswer));
}

export function isFullyUnsupportedSearchAnswerState(answer: SearchAnswerStateLike | null | undefined) {
  // confluenceData is a structured field the AI can only populate with real page citations — unlike
  // unsupportedClaims (which the model sometimes leaves empty) or the visible answer text (whose
  // exact wording varies run to run), an empty confluenceData reliably means the AI had no page to
  // answer from, since it is instructed to answer only from Confluence content.
  return Boolean(answer && (answer.confluenceData?.length ?? 0) === 0);
}
