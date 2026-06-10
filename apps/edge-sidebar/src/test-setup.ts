import { vi } from "vitest";

vi.stubGlobal("chrome", {
  action: {
    onClicked: { addListener: vi.fn() }
  },
  runtime: {
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    onConnect: { addListener: vi.fn() },
    connect: vi.fn().mockReturnValue({
      name: "",
      onDisconnect: { addListener: vi.fn() },
      disconnect: vi.fn(),
      postMessage: vi.fn()
    }),
    lastError: undefined
  },
  sidePanel: {
    setPanelBehavior: vi.fn().mockResolvedValue(undefined),
    setOptions: vi.fn().mockResolvedValue(undefined),
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined)
  },
  storage: {
    session: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined)
    },
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined)
    },
    onChanged: { addListener: vi.fn() }
  }
});
