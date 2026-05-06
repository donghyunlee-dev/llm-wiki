import { buildSearchFollowUpQuestion } from "@sfood/wiki-core";
import { startTransition, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { StructuredAnswerView } from "../StructuredAnswerView";
import {
  buildFallbackRecommendedDocuments,
  resolveSearchRecommendedDocuments,
  type SearchDocumentSummary,
} from "../searchRecommendations";
import { WikiStatePanel } from "./WikiStatePanel";

type SearchAnswer = {
  answer: string;
  confluenceData: Array<{
    pageId: string;
    title: string;
    quote: string;
  }>;
  unsupportedClaims: string[];
  guideDocuments?: SearchDocumentSummary[];
  recommendedDocuments?: SearchDocumentSummary[];
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
  {
    title: "문서를 불러오는 중",
    detail: "질문과 맞는 문서 묶음을 먼저 찾고 있습니다.",
  },
  {
    title: "관련 문서를 고르는 중",
    detail: "가장 직접적인 가이드를 우선순위로 추리고 있습니다.",
  },
  {
    title: "질문 문맥을 정리하는 중",
    detail: "이전 대화가 있으면 함께 묶어서 해석하고 있습니다.",
  },
  {
    title: "답변을 구성하는 중",
    detail: "바로 따라 할 수 있는 순서로 정리하고 있습니다.",
  },
] as const;

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q")?.trim() ?? "";
  const { documents, errorMessage, isLoading } = useWikiData();
  const [draftQuestion, setDraftQuestion] = useState(query);
  const [conversation, setConversation] = useState<SearchConversationItem[]>([]);
  const requestedQuestionsRef = useRef(new Set<string>());

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

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuestion = draftQuestion.trim();

    if (!nextQuestion) {
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
        {conversation.map((item) => {
          const recommendedDocuments = resolveSearchRecommendedDocuments(item.answer ?? null, documents, item.fallbackDocuments);

          return (
            <div className="chat-turn" key={item.id}>
              <div className="chat-message chat-message-user">
                <p>{item.question}</p>
              </div>

              <section className="chat-message chat-message-assistant">
                {item.status === "loading" ? (
                  <SearchLoadingState />
                ) : item.status === "complete" && item.answer ? (
                  <SearchAnswerView answer={item.answer} recommendedDocuments={recommendedDocuments} />
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

        <form className="chat-input-bar" onSubmit={submit}>
          <input
            value={draftQuestion}
            onChange={(event) => setDraftQuestion(event.target.value)}
            placeholder="궁금한 내용을 입력하세요"
            aria-label="검색 질문"
          />
          <button type="submit" aria-label="질문 전송" title="질문 전송">
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <path
                d="m3 10 13-6-3.5 12-2.4-4.5L3 10Zm0 0 7.1 1.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

function SearchAnswerView({
  answer,
  recommendedDocuments,
}: {
  answer: SearchAnswer;
  recommendedDocuments: SearchDocumentSummary[];
}) {
  return (
    <div className="chat-answer">
      <StructuredAnswerView text={sanitizeSearchAnswerText(answer.answer)} variant="chat" />

      {recommendedDocuments.length ? (
        <section className="chat-answer-related-docs">
          <h2>추천 페이지</h2>
          <SearchResultSummary documents={recommendedDocuments} />
        </section>
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
      }, 700 * (index + 1)),
    );

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const activeStage = SEARCH_LOADING_STAGES[stageIndex] ?? SEARCH_LOADING_STAGES[0];

  return (
    <div className="chat-loading" role="status" aria-live="polite" aria-atomic="true">
      <div className="chat-loading-row">
        <span className="chat-spinner" aria-hidden="true" />
        <div className="chat-loading-copy">
          <p className="chat-loading-title">{activeStage.title}</p>
          <p className="chat-loading-detail">{activeStage.detail}</p>
        </div>
      </div>
      <ol className="chat-loading-steps" aria-label="검색 진행 단계">
        {SEARCH_LOADING_STAGES.map((stage, index) => {
          const state =
            index < stageIndex ? "complete" : index === stageIndex ? "active" : "pending";

          return (
            <li key={stage.title} className={`chat-loading-step chat-loading-step-${state}`}>
              <span className="chat-loading-step-index">{index + 1}</span>
              <span className="chat-loading-step-text">{stage.title}</span>
            </li>
          );
        })}
      </ol>
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
          <Link to={document.href} target="_blank" rel="noreferrer">
            <strong>{document.title}</strong>
            <span>{document.summary || "요약이 비어 있는 문서입니다."}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function normalizeQuestionKey(question: string) {
  return question.trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");
}

function sanitizeSearchAnswerText(text: string) {
  return text
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\\\/g, "\\");
}
