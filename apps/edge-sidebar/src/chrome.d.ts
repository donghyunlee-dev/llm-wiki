declare namespace chrome {
  namespace action {
    const onClicked: {
      addListener(callback: (tab: { id?: number; windowId?: number }) => void): void;
    };
  }

  namespace runtime {
    interface Port {
      name: string;
      sender?: { tab?: { id?: number; windowId?: number } };
      onDisconnect: { addListener(callback: () => void): void };
      disconnect(): void;
      postMessage(message: unknown): void;
    }
    const onInstalled: {
      addListener(callback: () => void): void;
    };
    const onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: { tab?: { id?: number; windowId?: number } },
          sendResponse: (response?: unknown) => void
        ) => boolean | void
      ): void;
    };
    const onConnect: {
      addListener(callback: (port: Port) => void): void;
    };
    function connect(connectInfo?: { name?: string }): Port;
    function sendMessage(message: unknown, responseCallback?: (response: unknown) => void): void;
    const lastError: { message?: string } | undefined;
  }

  namespace storage {
    type StorageAreaName = "local" | "sync" | "session" | "managed";
    type StorageChange = { oldValue?: unknown; newValue?: unknown };

    namespace local {
      function get(
        keys: string[] | Record<string, unknown> | string
      ): Promise<Record<string, unknown>>;
      function set(items: Record<string, unknown>): Promise<void>;
      function remove(keys: string[] | string): Promise<void>;
    }

    namespace session {
      function get(
        keys: string[] | Record<string, unknown> | string
      ): Promise<Record<string, unknown>>;
      function set(items: Record<string, unknown>): Promise<void>;
      function remove(keys: string[] | string): Promise<void>;
    }

    const onChanged: {
      addListener(
        callback: (changes: Record<string, StorageChange>, areaName: StorageAreaName) => void
      ): void;
    };
  }

  namespace sidePanel {
    function setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void>;
    function setOptions(options: { tabId?: number; path?: string; enabled?: boolean }): Promise<void>;
    function open(options: { tabId?: number; windowId?: number }): Promise<void>;
    function close(options: { tabId?: number; windowId?: number }): Promise<void>;
  }
}
