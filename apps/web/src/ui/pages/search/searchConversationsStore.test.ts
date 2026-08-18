import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteStoredConversation,
  loadStoredConversations,
  MAX_STORED_CONVERSATIONS,
  saveStoredConversation,
  type StoredConversation,
} from "./searchConversationsStore";

function conversation(overrides: Partial<StoredConversation> = {}): StoredConversation {
  return {
    id: "conv-1",
    title: "Question",
    createdAt: 1,
    updatedAt: 1,
    turns: [],
    ...overrides,
  };
}

describe("searchConversationsStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty list when nothing has been saved", () => {
    expect(loadStoredConversations()).toEqual([]);
  });

  it("persists a conversation and reads it back", () => {
    saveStoredConversation(conversation());

    expect(loadStoredConversations()).toEqual([conversation()]);
  });

  it("upserts by id instead of duplicating", () => {
    saveStoredConversation(conversation({ updatedAt: 1 }));
    saveStoredConversation(conversation({ updatedAt: 2, title: "Updated" }));

    const result = loadStoredConversations();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Updated");
  });

  it("sorts conversations by updatedAt descending", () => {
    saveStoredConversation(conversation({ id: "older", updatedAt: 1 }));
    saveStoredConversation(conversation({ id: "newer", updatedAt: 2 }));

    expect(loadStoredConversations().map((c) => c.id)).toEqual(["newer", "older"]);
  });

  it("evicts the oldest conversation once the limit is exceeded", () => {
    for (let i = 0; i < MAX_STORED_CONVERSATIONS; i += 1) {
      saveStoredConversation(conversation({ id: `conv-${i}`, updatedAt: i }));
    }
    saveStoredConversation(conversation({ id: "newest", updatedAt: MAX_STORED_CONVERSATIONS }));

    const result = loadStoredConversations();
    expect(result).toHaveLength(MAX_STORED_CONVERSATIONS);
    expect(result.map((c) => c.id)).not.toContain("conv-0");
    expect(result.map((c) => c.id)).toContain("newest");
  });

  it("deletes a conversation by id", () => {
    saveStoredConversation(conversation({ id: "a" }));
    saveStoredConversation(conversation({ id: "b" }));

    deleteStoredConversation("a");

    expect(loadStoredConversations().map((c) => c.id)).toEqual(["b"]);
  });

  it("does not throw when localStorage access fails", () => {
    const originalGetItem = window.localStorage.getItem;
    window.localStorage.getItem = () => {
      throw new Error("blocked");
    };

    expect(() => loadStoredConversations()).not.toThrow();
    expect(loadStoredConversations()).toEqual([]);

    window.localStorage.getItem = originalGetItem;
  });
});
