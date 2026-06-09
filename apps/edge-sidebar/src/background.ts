const panelOpenByTarget = new Map<string, boolean>();
const SIDEPANEL_PATH = "sidepanel.html";

export function getToggleAction(
  currentOpen: boolean,
  action: "toggle" | "open" | "close"
): "open" | "close" {
  if (action === "toggle") return currentOpen ? "close" : "open";
  return action;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error: unknown) => {
    console.error("Failed to configure side panel action behavior.", error);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isOpenSidePanelMessage(message)) {
    return false;
  }

  const tabId = sender.tab?.id;
  const windowId = sender.tab?.windowId;

  if (typeof tabId !== "number" && typeof windowId !== "number") {
    sendResponse({ ok: false, message: "No active tab or window was available." });
    return false;
  }

  const targetKey = getPanelTargetKey(tabId, windowId);
  const currentOpen = panelOpenByTarget.get(targetKey) === true;
  const action = getToggleAction(currentOpen, message.action ?? "toggle");
  const request = action === "close"
    ? closeSidePanel(tabId, windowId)
    : openSidePanel(tabId, windowId);

  request
    .then(() => {
      const ok = true;
      const panelOpen = action === "open";
      panelOpenByTarget.set(targetKey, panelOpen);
      sendResponse({ ok, panelOpen });
    })
    .catch((error: unknown) => {
      panelOpenByTarget.set(targetKey, action === "close");
      sendResponse({
        ok: false,
        panelOpen: action === "close",
        message: error instanceof Error ? error.message : "Failed to open side panel."
      });
    });

  return true;
});

export function getPanelTargetKey(tabId?: number, windowId?: number) {
  if (typeof tabId === "number") {
    return `tab:${tabId}`;
  }

  return `window:${windowId ?? "unknown"}`;
}

async function openSidePanel(tabId?: number, windowId?: number) {
  // await 없이 두 IPC를 같은 JS 턴에 dispatch한다.
  // Chrome IPC는 순서가 보장되므로 브라우저는 setOptions(enable) → open(show) 순으로 처리한다.
  // open() 호출 전에 await가 없으므로 user gesture 토큰이 유지된다.
  const optionsPromise = typeof tabId === "number"
    ? chrome.sidePanel.setOptions({ tabId, path: SIDEPANEL_PATH, enabled: true })
    : Promise.resolve();
  const openPromise = chrome.sidePanel.open({ tabId, windowId });
  await Promise.all([optionsPromise, openPromise]);
}

async function closeSidePanel(tabId?: number, windowId?: number) {
  if (typeof chrome.sidePanel.close === "function" && typeof windowId === "number") {
    await chrome.sidePanel.close({ windowId });
    return;
  }

  if (typeof tabId === "number") {
    await chrome.sidePanel.setOptions({ tabId, enabled: false });
    return;
  }

  throw new Error("Failed to close side panel.");
}

function isOpenSidePanelMessage(message: unknown): message is { type: "OPEN_SFOOD_WIKI_SIDE_PANEL"; action?: "open" | "close" | "toggle" } {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: unknown }).type === "OPEN_SFOOD_WIKI_SIDE_PANEL"
  );
}
