import type { StoredConversation } from "./searchConversationsStore";

function DeleteIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d="M5 6h10M8.3 6V4.8c0-.44.36-.8.8-.8h1.8c.44 0 .8.36.8.8V6M6.2 6l.5 8.7c.04.75.66 1.3 1.4 1.3h3.8c.75 0 1.36-.56 1.4-1.3l.5-8.7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  title,
}: {
  conversations: StoredConversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  title?: string;
}) {
  return (
    <nav className="search-conversation-sidebar" aria-label="대화 목록">
      {title ? <h2 className="search-conversation-heading">{title}</h2> : null}
      {conversations.length === 0 ? (
        <p className="search-conversation-empty">저장된 대화가 없습니다.</p>
      ) : (
        <ul className="search-conversation-list">
          {conversations.map((conversation) => (
            <li
              key={conversation.id}
              className={
                conversation.id === activeConversationId
                  ? "search-conversation-item search-conversation-item-active"
                  : "search-conversation-item"
              }
            >
              <button
                type="button"
                className="search-conversation-title"
                onClick={() => onSelect(conversation.id)}
              >
                {conversation.title || "제목 없음"}
              </button>
              <button
                type="button"
                className="search-conversation-delete"
                aria-label="대화 삭제"
                title="대화 삭제"
                onClick={() => {
                  if (window.confirm("이 대화를 삭제할까요?")) {
                    onDelete(conversation.id);
                  }
                }}
              >
                <DeleteIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
