import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSearchConversations } from "./useSearchConversations";

describe("useSearchConversations", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with no conversations and no active conversation", () => {
    const { result } = renderHook(() => useSearchConversations());

    expect(result.current.conversations).toEqual([]);
    expect(result.current.activeConversation).toBeNull();
  });

  it("creates a new active conversation without persisting it until a turn completes", () => {
    const { result } = renderHook(() => useSearchConversations());

    act(() => {
      result.current.startNewConversation();
    });

    expect(result.current.activeConversation).not.toBeNull();
    expect(result.current.conversations).toEqual([]);
  });

  it("persists the conversation once a turn is committed, using the first question as fallback title", () => {
    const { result } = renderHook(() => useSearchConversations());

    act(() => {
      result.current.startNewConversation();
    });
    const conversationId = result.current.activeConversation!.id;

    act(() => {
      result.current.commitTurn(conversationId, {
        id: "turn-1",
        question: "MCP가 뭐야?",
        status: "complete",
        answer: { answer: "설명" } as never,
      });
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].title).toBe("MCP가 뭐야?");
    expect(result.current.activeConversation?.turns).toHaveLength(1);
  });

  it("uses the answer's title field when present instead of the raw question", () => {
    const { result } = renderHook(() => useSearchConversations());

    act(() => {
      result.current.startNewConversation();
    });
    const conversationId = result.current.activeConversation!.id;

    act(() => {
      result.current.commitTurn(conversationId, {
        id: "turn-1",
        question: "MCP가 뭐야?",
        status: "complete",
        answer: { answer: "설명", title: "MCP 개념 설명" } as never,
      });
    });

    expect(result.current.conversations[0].title).toBe("MCP 개념 설명");
  });

  it("does not overwrite the title on a second turn in the same conversation", () => {
    const { result } = renderHook(() => useSearchConversations());

    act(() => {
      result.current.startNewConversation();
    });
    const conversationId = result.current.activeConversation!.id;

    act(() => {
      result.current.commitTurn(conversationId, {
        id: "turn-1",
        question: "MCP가 뭐야?",
        status: "complete",
        answer: { answer: "설명", title: "MCP 개념 설명" } as never,
      });
    });
    act(() => {
      result.current.commitTurn(conversationId, {
        id: "turn-2",
        question: "더 자세히?",
        status: "complete",
        answer: { answer: "설명2", title: "다른 제목" } as never,
      });
    });

    expect(result.current.conversations[0].title).toBe("MCP 개념 설명");
    expect(result.current.activeConversation?.turns).toHaveLength(2);
  });

  it("selects an existing conversation as active", () => {
    const { result } = renderHook(() => useSearchConversations());

    act(() => {
      result.current.startNewConversation();
    });
    const firstId = result.current.activeConversation!.id;
    act(() => {
      result.current.commitTurn(firstId, {
        id: "turn-1",
        question: "질문 A",
        status: "complete",
        answer: { answer: "답" } as never,
      });
    });

    act(() => {
      result.current.startNewConversation();
    });
    expect(result.current.activeConversation?.id).not.toBe(firstId);

    act(() => {
      result.current.selectConversation(firstId);
    });

    expect(result.current.activeConversation?.id).toBe(firstId);
  });

  it("deletes a conversation and clears active selection when it was the active one", () => {
    const { result } = renderHook(() => useSearchConversations());

    act(() => {
      result.current.startNewConversation();
    });
    const id = result.current.activeConversation!.id;
    act(() => {
      result.current.commitTurn(id, {
        id: "turn-1",
        question: "질문",
        status: "complete",
        answer: { answer: "답" } as never,
      });
    });

    act(() => {
      result.current.deleteConversation(id);
    });

    expect(result.current.conversations).toEqual([]);
    expect(result.current.activeConversation).toBeNull();
  });
});
