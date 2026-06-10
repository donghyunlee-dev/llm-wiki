import { beforeEach, describe, expect, it, vi } from "vitest";

import { closeSidePanel, getToggleAction, getPanelTargetKey } from "./background";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getToggleAction", () => {
  it("닫힌 상태에서 toggle → 'open'", () => {
    expect(getToggleAction(false, "toggle")).toBe("open");
  });

  it("열린 상태에서 toggle → 'close'", () => {
    expect(getToggleAction(true, "toggle")).toBe("close");
  });

  it("'open' action은 현재 상태와 무관하게 'open' 반환", () => {
    expect(getToggleAction(false, "open")).toBe("open");
    expect(getToggleAction(true, "open")).toBe("open");
  });

  it("'close' action은 현재 상태와 무관하게 'close' 반환", () => {
    expect(getToggleAction(false, "close")).toBe("close");
    expect(getToggleAction(true, "close")).toBe("close");
  });
});

describe("getPanelTargetKey", () => {
  it("tabId가 있으면 'tab:{id}' 반환", () => {
    expect(getPanelTargetKey(123, 456)).toBe("tab:123");
  });

  it("tabId 없고 windowId 있으면 'window:{id}' 반환", () => {
    expect(getPanelTargetKey(undefined, 456)).toBe("window:456");
  });

  it("둘 다 없으면 'window:unknown' 반환", () => {
    expect(getPanelTargetKey(undefined, undefined)).toBe("window:unknown");
  });
});

describe("closeSidePanel", () => {
  it("tabId가 있으면 setOptions({ tabId, enabled: false })로 탭 단위 패널을 닫는다", async () => {
    await closeSidePanel(123, 456);
    expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({ tabId: 123, enabled: false });
    expect(chrome.sidePanel.close).not.toHaveBeenCalled();
  });

  it("tabId 없고 windowId만 있으면 close({ windowId })를 사용한다", async () => {
    await closeSidePanel(undefined, 456);
    expect(chrome.sidePanel.close).toHaveBeenCalledWith({ windowId: 456 });
    expect(chrome.sidePanel.setOptions).not.toHaveBeenCalled();
  });

  it("tabId, windowId 모두 없으면 에러를 던진다", async () => {
    await expect(closeSidePanel(undefined, undefined)).rejects.toThrow("Failed to close side panel.");
  });
});
