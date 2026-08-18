import type { SearchAnswer } from "../SearchPage.types";

export type StoredTurn = {
  id: string;
  question: string;
  status: "complete" | "error";
  answer?: SearchAnswer;
  errorMessage?: string;
};

export type StoredConversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  turns: StoredTurn[];
};

export const MAX_STORED_CONVERSATIONS = 20;

const STORAGE_KEY = "sfood-wiki:search-conversations:v1";

export function loadStoredConversations(): StoredConversation[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredConversation[];
    if (!Array.isArray(parsed)) return [];
    return sortByUpdatedAtDescending(parsed);
  } catch {
    return [];
  }
}

export function saveStoredConversation(conversation: StoredConversation): StoredConversation[] {
  try {
    const existing = loadStoredConversations().filter((item) => item.id !== conversation.id);
    const next = sortByUpdatedAtDescending([conversation, ...existing]).slice(0, MAX_STORED_CONVERSATIONS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadStoredConversations();
  }
}

export function deleteStoredConversation(id: string): StoredConversation[] {
  try {
    const next = loadStoredConversations().filter((item) => item.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadStoredConversations();
  }
}

function sortByUpdatedAtDescending(conversations: StoredConversation[]): StoredConversation[] {
  return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
}
