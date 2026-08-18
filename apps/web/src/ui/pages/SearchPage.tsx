import { buildSearchFollowUpQuestion, stripTitleTypePrefix } from "@sfood/wiki-core";
import { startTransition, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { getPolicyNoticeMessage, shouldShowPolicyNotice } from "../../lib/policyNotice";
import { StructuredAnswerView } from "../StructuredAnswerView";
import { PromptComposer } from "../PromptComposer";
import {
  buildFallbackRecommendedDocuments,
  buildFaqRecommendations,
  isFullyUnsupportedSearchAnswer,
  resolveSearchDocumentSections,
} from "../searchRecommendations";
import { WikiStatePanel } from "./WikiStatePanel";
import type { SearchAnswer } from "./SearchPage.types";
import { ConversationSidebar } from "./search/ConversationSidebar";
import { SearchContextPanel } from "./search/SearchContextPanel";
import { accumulateSearchContext } from "./search/searchContextAccumulation";
import { useSearchConversations } from "./search/useSearchConversations";

const SEARCH_LOADING_STAGES = [
  "문서를 찾는 중",
  "관련 문서를 추리는 중",
  "맥락을 정리하는 중",
  "답변을 구성하는 중",
] as const;

type LiveTurn = {
  id: string;
  question: string;
  status: "loading" | "complete" | "error";
  answer?: SearchAnswer;
  errorMessage?: string;
};

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q")?.trim() ?? "";
  const { documents, errorMessage, isLoading } = useWikiData();
  const [draftQuestion, setDraftQuestion] = useState(query);
  const [liveTurns, setLiveTurns] = useState<LiveTurn[]>([]);
  const [showEmptyHint, setShowEmptyHint] = useState(false);
  const [isConversationDrawerOpen, setIsConversationDrawerOpen] = useState(false);
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const emptyHintTimerRef = useRef<number | null>(null);
  const requestedQuestionsRef = useRef(new Set<string>());
  const turnRefs = useRef(new Map<string, HTMLDivElement>());
  const lastScrolledTurnRef = useRef<{ id: string; status: LiveTurn["status"] } | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const deletedConversationIdsRef = useRef(new Set<string>());
  const currentConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    const element = shellRef.current;
    if (!element) {
      return;
    }

    const updateOffset = () => {
      const top = element.getBoundingClientRect().top;
      element.style.setProperty("--search-shell-offset", `${top}px`);
    };

    updateOffset();
    window.addEventListener("resize", updateOffset);
    return () => window.removeEventListener("resize", updateOffset);
  }, []);

  const {
    conversations,
    activeConversationId,
    startNewConversation,
    selectConversation,
    deleteConversation,
    commitTurn,
  } = useSearchConversations();

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    setDraftQuestion("");
  }, [query]);

  useEffect(() => {
    const conversationId = searchParams.get("c");
    if (!conversationId || currentConversationIdRef.current !== null) {
      return;
    }

    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) {
      return;
    }

    currentConversationIdRef.current = conversationId;
    selectConversation(conversationId);
    setLiveTurns(conversation.turns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversations]);

  useEffect(() => {
    if (!query || isLoading || errorMessage) {
      return;
    }

    const isNewConversation = currentConversationIdRef.current === null;
    const targetConversationId = currentConversationIdRef.current ?? startNewConversation();
    currentConversationIdRef.current = targetConversationId;

    const history = liveTurns
      .filter((item) => item.status === "complete" && item.answer)
      .slice(-3)
      .map((item) => ({
        question: item.question,
        answer: item.answer?.answer,
      }));
    const searchQuestion = buildSearchFollowUpQuestion(query, history);
    const requestKey = `${targetConversationId}::${normalizeQuestionKey(searchQuestion)}`;

    if (requestedQuestionsRef.current.has(requestKey)) {
      return;
    }

    requestedQuestionsRef.current.add(requestKey);

    const turnId = `${Date.now()}-${requestedQuestionsRef.current.size}`;

    setLiveTurns((items) => [
      ...(isNewConversation ? [] : items),
      { id: turnId, question: query, status: "loading" as const },
    ]);

    void fetch(import.meta.env.VITE_AI_SEARCH_ENDPOINT?.trim() || "/api/wiki/ai/search", {
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
          const completedTurn = { id: turnId, question: query, status: "complete" as const, answer: payload };
          if (activeConversationIdRef.current === targetConversationId) {
            setLiveTurns((items) => upsertLiveTurn(items, completedTurn));
          }
          if (!deletedConversationIdsRef.current.has(targetConversationId)) {
            commitTurn(targetConversationId, completedTurn);
          }
        });
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "검색 답변을 생성하지 못했습니다.";
        const errorTurn = { id: turnId, question: query, status: "error" as const, errorMessage: message };
        if (activeConversationIdRef.current === targetConversationId) {
          setLiveTurns((items) => upsertLiveTurn(items, errorTurn));
        }
        if (!deletedConversationIdsRef.current.has(targetConversationId)) {
          commitTurn(targetConversationId, errorTurn);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, errorMessage, isLoading, query]);

  useEffect(() => {
    const lastItem = liveTurns[liveTurns.length - 1];
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
  }, [liveTurns]);

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

  const handleSelectConversation = (id: string) => {
    const conversation = conversations.find((item) => item.id === id);
    currentConversationIdRef.current = id;
    selectConversation(id);
    setLiveTurns(conversation?.turns ?? []);
    setIsConversationDrawerOpen(false);
  };

  const handleDeleteConversation = (id: string) => {
    deletedConversationIdsRef.current.add(id);
    const wasActive = id === activeConversationId;
    const remaining = conversations.filter((item) => item.id !== id);
    deleteConversation(id);

    if (!wasActive) {
      return;
    }

    const next = remaining[0] ?? null;
    currentConversationIdRef.current = next?.id ?? null;
    if (next) {
      selectConversation(next.id);
      setLiveTurns(next.turns);
    } else {
      setLiveTurns([]);
    }
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

  const turnContexts = liveTurns
    .filter((item) => item.status !== "loading")
    .map((item) => resolveTurnContext(item, documents));
  const accumulatedContext = accumulateSearchContext(
    turnContexts.map((context) => ({
      recommended: context.recommendedDocuments,
      related: context.relatedDocuments,
      faq: context.faqDocuments,
    })),
  );

  return (
    <div className="search-shell" ref={shellRef}>
      <div className={isConversationDrawerOpen ? "search-sidebar-left search-sidebar-open" : "search-sidebar-left"}>
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
        />
      </div>

      <div className="search-main-column">
        <div className="search-mobile-toolbar">
          <button type="button" onClick={() => setIsConversationDrawerOpen(true)}>
            대화 목록
          </button>
          <button type="button" onClick={() => setIsContextDrawerOpen(true)}>
            관련 페이지
          </button>
        </div>

        <div className="search-center-shell">
          <div className="chat-search-shell">
            {!query && liveTurns.length === 0 ? (
              <div className="chat-empty-hint">
                <p>궁금한 내용을 입력하면 관련 가이드와 함께 답변을 드립니다.</p>
              </div>
            ) : null}

            {liveTurns.map((item) => (
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
                    <SearchAnswerView answer={item.answer} />
                  ) : (
                    <p>{item.errorMessage ?? "답변을 준비하지 못했습니다."}</p>
                  )}
                </section>
              </div>
            ))}
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
                      <path
                        d="m3 10 13-6-3.5 12-2.4-4.5L3 10Zm0 0 7.1 1.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
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
      </div>

      <div className={isContextDrawerOpen ? "search-sidebar-right search-sidebar-open" : "search-sidebar-right"}>
        <SearchContextPanel
          recommended={accumulatedContext.recommended}
          related={accumulatedContext.related}
          faq={accumulatedContext.faq}
        />
      </div>

      {isConversationDrawerOpen || isContextDrawerOpen ? (
        <button
          type="button"
          className="search-drawer-backdrop"
          aria-label="닫기"
          onClick={() => {
            setIsConversationDrawerOpen(false);
            setIsContextDrawerOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function resolveTurnContext(turn: LiveTurn, documents: ReturnType<typeof useWikiData>["documents"]) {
  const fallbackDocuments = buildFallbackRecommendedDocuments(documents, turn.question);
  const answer = turn.answer ?? null;
  const directFaqDocuments = isFullyUnsupportedSearchAnswer(answer ?? null)
    ? []
    : buildFaqRecommendations(documents, turn.question);
  const {
    faqDocuments: aiFaqDocuments,
    recommendedDocuments,
    relatedDocuments,
  } = resolveSearchDocumentSections(answer ?? null, fallbackDocuments);
  const faqSeenIds = new Set(aiFaqDocuments.map((d) => d.id));
  const faqDocuments = [...aiFaqDocuments, ...directFaqDocuments.filter((d) => !faqSeenIds.has(d.id))];

  return { recommendedDocuments, relatedDocuments, faqDocuments };
}

function SearchAnswerView({ answer }: { answer: SearchAnswer }) {
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

function normalizeQuestionKey(question: string) {
  return question.trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");
}

function upsertLiveTurn(items: LiveTurn[], turn: LiveTurn) {
  return items.some((item) => item.id === turn.id)
    ? items.map((item) => (item.id === turn.id ? turn : item))
    : [...items, turn];
}
