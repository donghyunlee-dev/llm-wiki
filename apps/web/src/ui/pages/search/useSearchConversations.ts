import { useCallback, useMemo, useState } from "react";
import {
  deleteStoredConversation,
  loadStoredConversations,
  saveStoredConversation,
  type StoredConversation,
  type StoredTurn,
} from "./searchConversationsStore";

const TITLE_FALLBACK_MAX_LENGTH = 60;

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildFallbackTitle(question: string) {
  const trimmed = question.trim();
  return trimmed.length > TITLE_FALLBACK_MAX_LENGTH
    ? `${trimmed.slice(0, TITLE_FALLBACK_MAX_LENGTH)}…`
    : trimmed;
}

export function useSearchConversations() {
  const [conversations, setConversations] = useState<StoredConversation[]>(() => loadStoredConversations());
  const [pendingConversation, setPendingConversation] = useState<StoredConversation | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const startNewConversation = useCallback(() => {
    const now = Date.now();
    const conversation: StoredConversation = {
      id: createId(),
      title: "",
      createdAt: now,
      updatedAt: now,
      turns: [],
    };
    setPendingConversation(conversation);
    setActiveConversationId(conversation.id);
    return conversation.id;
  }, []);

  const selectConversation = useCallback((id: string) => {
    setPendingConversation(null);
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      const next = deleteStoredConversation(id);
      setConversations(next);
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setPendingConversation(null);
      }
    },
    [activeConversationId],
  );

  const commitTurn = useCallback((conversationId: string, turn: StoredTurn) => {
    setConversations((current) => {
      const existing =
        current.find((item) => item.id === conversationId) ??
        (pendingConversation?.id === conversationId ? pendingConversation : null);

      const base: StoredConversation = existing ?? {
        id: conversationId,
        title: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        turns: [],
      };

      const isFirstTurn = base.turns.length === 0;
      const nextTurns = base.turns.some((item) => item.id === turn.id)
        ? base.turns.map((item) => (item.id === turn.id ? turn : item))
        : [...base.turns, turn];

      const nextConversation: StoredConversation = {
        ...base,
        title: isFirstTurn ? turn.answer?.title?.trim() || buildFallbackTitle(turn.question) : base.title,
        updatedAt: Date.now(),
        turns: nextTurns,
      };

      return saveStoredConversation(nextConversation);
    });
    setPendingConversation(null);
  }, [pendingConversation]);

  const activeConversation = useMemo(() => {
    if (pendingConversation?.id === activeConversationId) {
      return pendingConversation;
    }
    return conversations.find((item) => item.id === activeConversationId) ?? null;
  }, [conversations, pendingConversation, activeConversationId]);

  return {
    conversations,
    activeConversationId,
    activeConversation,
    startNewConversation,
    selectConversation,
    deleteConversation,
    commitTurn,
  };
}
