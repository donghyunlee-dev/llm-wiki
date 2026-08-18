import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConversationSidebar } from "./ConversationSidebar";
import type { StoredConversation } from "./searchConversationsStore";

function conversation(overrides: Partial<StoredConversation> = {}): StoredConversation {
  return {
    id: "conv-1",
    title: "MCP가 뭐야?",
    createdAt: 1,
    updatedAt: 1,
    turns: [],
    ...overrides,
  };
}

describe("ConversationSidebar", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders each conversation's title", () => {
    render(
      <ConversationSidebar
        conversations={[conversation({ id: "a", title: "질문 A" }), conversation({ id: "b", title: "질문 B" })]}
        activeConversationId="a"
        onSelect={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText("질문 A")).not.toBeNull();
    expect(screen.getByText("질문 B")).not.toBeNull();
  });

  it("renders an optional heading above the list when a title is given", () => {
    render(
      <ConversationSidebar
        conversations={[conversation({ id: "a" })]}
        activeConversationId={null}
        onSelect={() => {}}
        onDelete={() => {}}
        title="최근 대화"
      />,
    );

    expect(screen.getByRole("heading", { name: "최근 대화" })).not.toBeNull();
  });

  it("shows the delete control as an icon, not visible '삭제' text", () => {
    render(
      <ConversationSidebar
        conversations={[conversation({ id: "a", title: "질문 A" })]}
        activeConversationId={null}
        onSelect={() => {}}
        onDelete={() => {}}
      />,
    );

    const deleteButton = screen.getByRole("button", { name: "대화 삭제" });
    expect(deleteButton.textContent?.trim()).toBe("");
    expect(deleteButton.querySelector("svg")).not.toBeNull();
  });

  it("calls onSelect when a conversation is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ConversationSidebar
        conversations={[conversation({ id: "a", title: "질문 A" })]}
        activeConversationId={null}
        onSelect={onSelect}
        onDelete={() => {}}
      />,
    );

    await user.click(screen.getByText("질문 A"));

    expect(onSelect).toHaveBeenCalledWith("a");
  });

  it("asks for confirmation before deleting, and skips onDelete when the user cancels", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <ConversationSidebar
        conversations={[conversation({ id: "a", title: "질문 A" })]}
        activeConversationId={null}
        onSelect={() => {}}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: /삭제/ }));

    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("deletes the conversation when the user confirms", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <ConversationSidebar
        conversations={[conversation({ id: "a", title: "질문 A" })]}
        activeConversationId={null}
        onSelect={() => {}}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: /삭제/ }));

    expect(onDelete).toHaveBeenCalledWith("a");
  });
});
