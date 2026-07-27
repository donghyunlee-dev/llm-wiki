import { buildSearchFollowUpQuestion, stripTitleTypePrefix } from "@sfood/wiki-core";
import { startTransition, useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { getPolicyNoticeMessage, shouldShowPolicyNotice } from "../../lib/policyNotice";
import { StructuredAnswerView } from "../StructuredAnswerView";
import { PromptComposer } from "../PromptComposer";
import {
  buildFallbackRecommendedDocuments,
  buildFaqRecommendations,
  isFullyUnsupportedSearchAnswer,
  resolveSearchDocumentSections,
  resolveSearchRecommendedDocuments,
  type SearchDocumentSummary,
} from "../searchRecommendations";
import { WikiStatePanel } from "./WikiStatePanel";

type SearchAnswer = {
  answer: string;
  policyNotice: {
    isPolicyRelated: boolean;
    message: string;
    sources?: Array<{
      id: string;
      title: string;
      href: string;
    }>;
  };
  immediateActions: Array<{
    text: string;
    relatedPageIds: string[];
  }>;
  exampleCommands: string[];
  verificationChecks: Array<{
    text: string;
    relatedPageIds: string[];
  }>;
  cautions: Array<{
    text: string;
    relatedPageIds: string[];
  }>;
  confluenceData: Array<{
    pageId: string;
    title: string;
    quote: string;
  }>;
  unsupportedClaims: string[];
  recommendedDocuments?: SearchDocumentSummary[];
  relatedDocuments?: SearchDocumentSummary[];
};

type SearchConversationItem = {
  id: string;
  question: string;
  status: "loading" | "complete" | "error";
  answer?: SearchAnswer;
  errorMessage?: string;
  fallbackDocuments: SearchDocumentSummary[];
};

const SEARCH_LOADING_STAGES = [
  "문서를 찾는 중",
  "관련 문서를 추리는 중",
  "맥락을 정리하는 중",
  "답변을 구성하는 중",
] as const;

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q")?.trim() ?? "";
  const { documents, errorMessage, isLoading } = useWikiData();
  const [draftQuestion, setDraftQuestion] = useState(query);
  const [conversation, setConversation] = useState<SearchConversationItem[]>([]);
  const [showEmptyHint, setShowEmptyHint] = useState(false);
  const emptyHintTimerRef = useRef<number | null>(null);
  const requestedQuestionsRef = useRef(new Set<string>());
  const turnRefs = useRef(new Map<string, HTMLDivElement>());
  const lastScrolledTurnRef = useRef<{ id: string; status: SearchConversationItem["status"] } | null>(null);

  useEffect(() => {
    setDraftQuestion("");
  }, [query]);

  useEffect(() => {
    if (!query || isLoading || errorMessage) {
      return;
    }

    const history = conversation
      .filter((item) => item.status === "complete" && item.answer)
      .slice(-3)
      .map((item) => ({
        question: item.question,
        answer: item.answer?.answer,
      }));
    const searchQuestion = buildSearchFollowUpQuestion(query, history);
    const normalizedQuery = normalizeQuestionKey(searchQuestion);

    if (requestedQuestionsRef.current.has(normalizedQuery)) {
      return;
    }

    requestedQuestionsRef.current.add(normalizedQuery);

    const requestId = `${Date.now()}-${requestedQuestionsRef.current.size}`;
    const fallbackDocuments = buildFallbackRecommendedDocuments(documents, searchQuestion);

    setConversation((items) => [
      ...items,
      {
        id: requestId,
        question: query,
        status: "loading",
        fallbackDocuments,
      },
    ]);

    void fetch("/api/wiki/ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
        body: JSON.stringify({
          question: query,
          history,
        }),
      })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("검색 답변을 생성하지 못했습니다.");
        }

        return response.json() as Promise<SearchAnswer>;
      })
      .then((payload) => {
        startTransition(() => {
          setConversation((items) =>
            items.map((item) =>
              item.id === requestId
                ? { ...item, status: "complete", answer: payload }
                : item,
            ),
          );
        });
      })
      .catch((error) => {
        setConversation((items) =>
          items.map((item) =>
            item.id === requestId
              ? {
                ...item,
                status: "error",
                errorMessage: error instanceof Error ? error.message : "검색 답변을 생성하지 못했습니다.",
              }
              : item,
          ),
        );
      });
  }, [documents, errorMessage, isLoading, query]);

  useEffect(() => {
    const lastItem = conversation[conversation.length - 1];
    if (!lastItem) {
      return;
    }

    const alreadyScrolled =
      lastScrolledTurnRef.current?.id === lastItem.id &&
      lastScrolledTurnRef.current?.status === lastItem.status;
    if (alreadyScrolled) {
      return;
    }

    lastScrolledTurnRef.current = { id: lastItem.id, status: lastItem.status };
    const turnElement = turnRefs.current.get(lastItem.id);
    turnElement?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [conversation]);

  const triggerEmptyHint = useCallback(() => {
    setShowEmptyHint(true);
    if (emptyHintTimerRef.current !== null) {
      window.clearTimeout(emptyHintTimerRef.current);
    }
    emptyHintTimerRef.current = window.setTimeout(() => {
      setShowEmptyHint(false);
    }, 2500);
  }, []);

  const submitDraftQuestion = () => {
    const nextQuestion = draftQuestion.trim();

    if (!nextQuestion) {
      triggerEmptyHint();
      return;
    }

    startTransition(() => {
      navigate(`/search?q=${encodeURIComponent(nextQuestion)}`);
      setDraftQuestion("");
    });
  };

  if (isLoading) {
    return (
      <WikiStatePanel
        title="검색 데이터를 불러오는 중"
        body="검색 대상 문서를 준비하는 중입니다."
      />
    );
  }

  if (errorMessage) {
    return (
      <WikiStatePanel
        title="검색을 준비하지 못했습니다"
        body={errorMessage}
        tone="error"
      />
    );
  }

  return (
    <div className="page-shell">
      <div className="chat-search-shell">
        {!query && conversation.length === 0 ? (
          <div className="chat-empty-hint">
            <p>궁금한 내용을 입력하면 관련 가이드와 함께 답변을 드립니다.</p>
          </div>
        ) : null}

        {conversation.map((item) => {
          const recommendedDocuments = resolveSearchRecommendedDocuments(item.answer ?? null, item.fallbackDocuments);
          const directFaqDocuments = isFullyUnsupportedSearchAnswer(item.answer ?? null)
            ? []
            : buildFaqRecommendations(documents, item.question);
          const { faqDocuments: aiFaqDocuments, recommendedDocuments: primaryRecommendations, relatedDocuments } = resolveSearchDocumentSections(
            item.answer ?? null,
            item.fallbackDocuments,
          );
          const faqSeenIds = new Set(aiFaqDocuments.map((d) => d.id));
          const faqDocuments = [...aiFaqDocuments, ...directFaqDocuments.filter((d) => !faqSeenIds.has(d.id))];

          return (
            <div
              className="chat-turn"
              key={item.id}
              ref={(element) => {
                if (element) {
                  turnRefs.current.set(item.id, element);
                } else {
                  turnRefs.current.delete(item.id);
                }
              }}
            >
              <div className="chat-message chat-message-user">
                <p>{item.question}</p>
              </div>

              <section className="chat-message chat-message-assistant">
                {item.status === "loading" ? (
                  <SearchLoadingState />
                ) : item.status === "complete" && item.answer ? (
                  <SearchAnswerView
                    answer={item.answer}
                    faqDocuments={faqDocuments}
                    recommendedDocuments={primaryRecommendations}
                    relatedDocuments={relatedDocuments}
                  />
                ) : (
                  <div>
                    <p>{item.errorMessage ?? "답변을 준비하지 못했습니다."}</p>
                    {recommendedDocuments.length ? (
                      <SearchResultSummary documents={recommendedDocuments} />
                    ) : null}
                  </div>
                )}
              </section>
            </div>
          );
        })}

      </div>
      <div className="chat-input-dock">
        <div className="chat-input-dock-inner">
          <div className="chat-input-area">
            <PromptComposer
              value={draftQuestion}
              onValueChange={(value) => {
                setDraftQuestion(value);
                if (showEmptyHint) setShowEmptyHint(false);
              }}
              onSubmit={submitDraftQuestion}
              placeholder="궁금한 내용을 입력하세요"
              ariaLabel="검색 질문"
              ariaDescribedBy={showEmptyHint ? "chat-empty-input-hint" : undefined}
              buttonAriaLabel="질문 전송"
              buttonTitle="질문 전송"
              className="chat-input-bar"
              textareaClassName="chat-input-bar-textarea prompt-composer-textarea"
              buttonClassName="chat-input-bar-button prompt-composer-button"
              minRows={2}
              maxRows={8}
              buttonIcon={(
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                  <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M13 13L16.5 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}
            />
            {showEmptyHint ? (
              <p id="chat-empty-input-hint" className="chat-input-hint" role="alert">
                검색어를 입력해 주세요.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchAnswerView({
  answer,
  faqDocuments,
  recommendedDocuments,
  relatedDocuments,
}: {
  answer: SearchAnswer;
  faqDocuments: SearchDocumentSummary[];
  recommendedDocuments: SearchDocumentSummary[];
  relatedDocuments: SearchDocumentSummary[];
}) {
  const supplementalAnswerText = buildSupplementalAnswerText(answer);

  return (
    <div className="chat-answer">
      <StructuredAnswerView text={answer.answer} variant="chat" />
      {supplementalAnswerText ? (
        <StructuredAnswerView text={supplementalAnswerText} variant="chat" />
      ) : null}

      {answer.unsupportedClaims.length ? (
        <section>
          <h2>확인 필요</h2>
          <ul className="chat-action-list">
            {answer.unsupportedClaims.map((claim) => (
              <li key={claim} className="chat-action-item">{claim}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {shouldShowPolicyNotice(answer.policyNotice) ? (
        <PolicyNoticeView policyNotice={answer.policyNotice} />
      ) : null}

      {faqDocuments.length ? (
        <section>
          <h2>자주 묻는 질문</h2>
          <SearchResultSummary documents={faqDocuments} />
        </section>
      ) : null}

      {recommendedDocuments.length ? (
        <section>
          <h2>추천 페이지</h2>
          <SearchResultSummary documents={recommendedDocuments} />
        </section>
      ) : null}

      {relatedDocuments.length ? (
        <section>
          <h2>관련 페이지</h2>
          <SearchResultSummary documents={relatedDocuments} />
        </section>
      ) : null}
    </div>
  );
}

export function buildSupplementalAnswerText(answer: SearchAnswer) {
  const answerKey = normalizeAnswerTextForComparison(answer.answer);
  const lines: string[] = [];
  const actions = answer.immediateActions
    .map((item) => item.text.trim())
    .filter((text) => text && !answerKey.includes(normalizeAnswerTextForComparison(text)));
  const checks = answer.verificationChecks
    .map((item) => item.text.trim())
    .filter((text) => text && !answerKey.includes(normalizeAnswerTextForComparison(text)));
  const cautions = answer.cautions
    .map((item) => item.text.trim())
    .filter((text) => text && !answerKey.includes(normalizeAnswerTextForComparison(text)));
  const commands = answer.exampleCommands
    .map((item) => item.trim())
    .filter((text) => text && !answer.answer.includes(text));

  if (actions.length) {
    lines.push("이어서 보면 좋은 흐름은 아래처럼 정리할 수 있어요.");
    lines.push(...actions.map((item) => `- ${item}`));
  }

  if (checks.length) {
    if (lines.length) lines.push("");
    lines.push("마지막에는 아래 항목만 가볍게 확인하면 됩니다.");
    lines.push(...checks.map((item) => `- ${item}`));
  }

  if (cautions.length) {
    if (lines.length) lines.push("");
    lines.push("진행 전에 놓치기 쉬운 점도 함께 보면 좋아요.");
    lines.push(...cautions.map((item) => `- ${item}`));
  }

  if (commands.length) {
    if (lines.length) lines.push("");
    lines.push("문서에 있는 예시는 아래처럼 확인할 수 있습니다.");
    lines.push("```shell");
    lines.push(...commands);
    lines.push("```");
  }

  return lines.join("\n").trim();
}

function normalizeAnswerTextForComparison(text: string) {
  return text
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function PolicyNoticeView({
  policyNotice,
}: {
  policyNotice: {
    isPolicyRelated: boolean;
    message: string;
    sources?: Array<{
      id: string;
      title: string;
      href: string;
    }>;
  };
}) {
  return (
    <div className="answer-policy-notice" role="note" aria-label="정책 반영 안내">
      <strong>정책 반영</strong>
      <p>{getPolicyNoticeMessage(policyNotice)}</p>
      {policyNotice.sources?.length ? (
        <div className="answer-policy-sources" aria-label="정책 원천 페이지">
          {policyNotice.sources.map((source) => (
            <a key={source.id} href={source.href} target="_blank" rel="noreferrer">
              {stripTitleTypePrefix(source.title)}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SearchLoadingState() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    setStageIndex(0);

    const timers = SEARCH_LOADING_STAGES.slice(1).map((_, index) =>
      window.setTimeout(() => {
        setStageIndex(index + 1);
      }, 800 * (index + 1)),
    );

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const stageText = SEARCH_LOADING_STAGES[stageIndex] ?? SEARCH_LOADING_STAGES[0];

  return (
    <div className="chat-loading" role="status" aria-live="polite" aria-atomic="true">
      <div className="chat-loading-row">
        <span className="chat-spinner" aria-hidden="true" />
        <span className="chat-loading-stage">{stageText}</span>
      </div>
      <div className="chat-loading-bar" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}

function SearchResultSummary({
  documents,
}: {
  documents: SearchDocumentSummary[];
}) {
  if (!documents.length) {
    return null;
  }

  return (
    <ul className="chat-guide-list">
      {documents.map((document) => (
        <li key={document.id}>
          <Link className="chat-guide-card" to={document.href} target="_blank" rel="noreferrer">
            <strong>{stripTitleTypePrefix(document.title)}</strong>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function normalizeQuestionKey(question: string) {
  return question.trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");
}
