import {
  forwardRef,
  startTransition,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "react-router-dom";
import { getWikiDocumentByIdFrom, getWikiDocumentHref, stripTitleTypePrefix, type WikiDocument } from "@sfood/wiki-core";
import { getPolicyNoticeMessage, shouldShowPolicyNotice } from "../../lib/policyNotice";
import { StructuredAnswerView } from "../StructuredAnswerView";
import { PromptComposer, type PromptComposerHandle } from "../PromptComposer";

type AskResult = {
  answer: string;
  supportedByContext: boolean;
  policyNotice: {
    isPolicyRelated: boolean;
    message: string;
    sources?: Array<{
      id: string;
      title: string;
      href: string;
    }>;
  };
  confluenceData: Array<{
    pageId: string;
    title: string;
    quote: string;
  }>;
  unsupportedClaims: string[];
  suggestedNextPages: Array<{
    pageId: string;
    title: string;
    reason: string;
  }>;
};

type AskTurn = {
  id: string;
  question: string;
  status: "loading" | "complete" | "error";
  result?: AskResult;
  errorMessage?: string;
};

const COLLAPSED_HEIGHT = 68;
const EXPANDED_HEIGHT = 320;

export type ArticleAskPanelHandle = {
  fillAndFocus: (text: string) => void;
};

export const ArticleAskPanel = forwardRef<
  ArticleAskPanelHandle,
  {
    documents: WikiDocument[];
    initialQuestion?: string;
    pageId: string;
  }
>(function ArticleAskPanel({ documents, initialQuestion = "", pageId }, ref) {
  const [question, setQuestion] = useState(initialQuestion);
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [panelHeight, setPanelHeight] = useState(COLLAPSED_HEIGHT);
  const turnsRef = useRef<HTMLDivElement | null>(null);
  const promptComposerRef = useRef<PromptComposerHandle | null>(null);

  useImperativeHandle(ref, () => ({
    fillAndFocus: (text: string) => {
      setQuestion(text);
      setPanelHeight((height) => Math.max(height, EXPANDED_HEIGHT));
      promptComposerRef.current?.focus();
    },
  }), []);

  useEffect(() => {
    if (turnsRef.current) {
      turnsRef.current.scrollTop = turnsRef.current.scrollHeight;
    }
  }, [turns]);

  const startResize = (event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = panelHeight;

    const resize = (moveEvent: PointerEvent) => {
      const nextHeight = Math.min(360, Math.max(64, startHeight + startY - moveEvent.clientY));
      setPanelHeight(nextHeight);
    };
    const stopResize = () => {
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", stopResize);
    };

    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", stopResize);
  };

  const submitQuestion = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    const turnId = `${Date.now()}-${turns.length + 1}`;
    setQuestion("");
    setPanelHeight((height) => Math.max(height, EXPANDED_HEIGHT));
    setTurns((items) => [
      ...items,
      {
        id: turnId,
        question: trimmedQuestion,
        status: "loading",
      },
    ]);

    try {
      const response = await fetch("/api/wiki/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageId,
          question: trimmedQuestion,
          history: turns
            .filter((turn) => turn.status === "complete" && turn.result)
            .slice(-3)
            .map((turn) => ({
              question: turn.question,
              answer: turn.result?.answer,
            })),
        }),
      });

      if (!response.ok) {
        throw new Error("답변을 생성하지 못했습니다.");
      }

      const payload = await response.json() as AskResult;

      startTransition(() => {
        setTurns((items) =>
          items.map((item) =>
            item.id === turnId
              ? { ...item, status: "complete", result: payload }
              : item,
          ),
        );
      });
    } catch (error) {
      setTurns((items) =>
        items.map((item) =>
          item.id === turnId
            ? {
              ...item,
              status: "error",
              errorMessage: error instanceof Error ? error.message : "답변을 생성하지 못했습니다.",
            }
            : item,
        ),
      );
    }
  };

  return (
    <section
      className="article-ask article-ask-dock"
      aria-label="문서 질문"
      style={{ "--article-ask-height": `${panelHeight}px` } as CSSProperties}
      onPointerDown={(event) => {
        const target = event.target as HTMLElement;

        if (target.closest("textarea, button, a")) {
          return;
        }

        const bounds = event.currentTarget.getBoundingClientRect();

        if (event.clientY - bounds.top <= 8) {
          startResize(event);
        }
      }}
    >
      {turns.length ? (
        <div className="article-ask-turns" ref={turnsRef}>
          {turns.map((turn) => (
            <div className="article-ask-turn" key={turn.id}>
              <div className="article-ask-question">{turn.question}</div>
              <div className="article-ask-answer">
                {turn.status === "loading" ? (
                  <ArticleAskLoading />
                ) : turn.status === "complete" && turn.result ? (
                  <ArticleAskResult documents={documents} result={turn.result} />
                ) : (
                  <p>{turn.errorMessage ?? "답변을 준비하지 못했습니다."}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <PromptComposer
        ref={promptComposerRef}
        value={question}
        onValueChange={setQuestion}
        onSubmit={submitQuestion}
        className="article-ask-form"
        textareaClassName="article-ask-form-textarea prompt-composer-textarea"
        buttonClassName="article-ask-form-button prompt-composer-button"
        ariaLabel="문서 질문"
        buttonAriaLabel="질문 전송"
        buttonTitle="질문 전송"
        minRows={1}
        maxRows={7}
        placeholder="이 문서에서 궁금한 내용을 입력하세요"
        buttonIcon={(
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
            <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M13 13L16.5 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      />
    </section>
  );
});

function ArticleAskLoading() {
  return (
    <div className="article-ask-loading">
      <span className="chat-spinner" aria-hidden="true" />
    </div>
  );
}

function ArticleAskResult({
  documents,
  result,
}: {
  documents: WikiDocument[];
  result: AskResult;
}) {
  return (
    <div className="article-ask-result">
      <div>
        <h3>답변</h3>
        <StructuredAnswerView text={result.answer} variant="article" />
      </div>

      {result.unsupportedClaims.length ? (
        <div>
          <h3>확인 필요</h3>
          <ul>
            {result.unsupportedClaims.map((claim) => (
              <li key={claim}>{claim}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {shouldShowPolicyNotice(result.policyNotice) ? (
        <div className="answer-policy-notice" role="note" aria-label="정책 반영 안내">
          <strong>정책 반영</strong>
          <p>{getPolicyNoticeMessage(result.policyNotice)}</p>
          {result.policyNotice.sources?.length ? (
            <div className="answer-policy-sources" aria-label="정책 원천 페이지">
              {result.policyNotice.sources.map((source) => (
                <a key={source.id} href={source.href} target="_blank" rel="noreferrer">
                  {stripTitleTypePrefix(source.title)}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {result.suggestedNextPages.length ? (
        <div>
          <h3>추천 페이지</h3>
          <ul className="article-link-grid">
            {result.suggestedNextPages.map((item) => {
              const document = getWikiDocumentByIdFrom(documents, item.pageId);
              const dt = document?.metadata.docType;
              if (dt === "nav" || dt === "ops" || dt === "policy") {
                return null;
              }

              return (
                <li key={`${item.pageId}-${item.reason}`}>
                  {document ? (
                    <Link className="article-link-card" to={getWikiDocumentHref(document) ?? "#"} target="_blank" rel="noreferrer">
                      <strong>{stripTitleTypePrefix(item.title)}</strong>
                    </Link>
                  ) : (
                    <div className="article-link-card">
                      <strong>{stripTitleTypePrefix(item.title)}</strong>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

