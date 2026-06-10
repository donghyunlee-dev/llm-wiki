const STORAGE_KEYS = {
  baseUrl: "sfoodWikiSidebar.baseUrl",
  dock: "sfoodWikiSidebar.launcherDock",
  hidden: "sfoodWikiSidebar.launcherHidden",
  offsetY: "sfoodWikiSidebar.launcherOffsetY"
} as const;

type LauncherDock = "top" | "bottom";

type LauncherSettings = {
  baseUrl: string;
  dock: LauncherDock;
  hidden: boolean;
  offsetY: number;
};

const DEFAULT_BASE_URL = "http://localhost:5173";
const LAUNCHER_HOST_ID = "sfood-ai-wiki-launcher";
const DRAG_THRESHOLD_PX = 4;
const HOST_SIZE = 130;
const LEGACY_PANEL_OPEN_KEY = "sfoodWikiSidebar.panelOpen";

window.addEventListener("unhandledrejection", (event) => {
  if (isExtensionContextInvalidated(event.reason)) {
    event.preventDefault();
  }
});

void injectLauncher().catch(() => {});

async function injectLauncher() {
  if (document.getElementById(LAUNCHER_HOST_ID)) {
    return;
  }

  const settings = await readSettings();
  void safeStorageRemove(LEGACY_PANEL_OPEN_KEY);
  const host = document.createElement("div");
  host.id = LAUNCHER_HOST_ID;
  setHostPosition(host, settings.offsetY);
  document.documentElement.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: "open" });
  shadowRoot.innerHTML = `
    <style>${buildLauncherCss()}</style>
    <section class="launcher" data-hidden="${String(settings.hidden)}" data-expanded="false">
      <div class="launcher-stack">
        <button type="button" class="launcher-home" aria-label="Wiki 홈 열기" title="Wiki 홈 열기">
          ${buildHomeIcon()}
        </button>
        <button type="button" class="launcher-main" aria-label="SFOOD AI Wiki 열기 또는 닫기" title="SFOOD AI Wiki 열기 또는 닫기">
          ${buildBookIcon()}
        </button>
        <button type="button" class="launcher-settings" aria-label="환경 설정" title="환경 설정">
          ${buildGearIcon()}
        </button>
      </div>
      <div class="launcher-popup" hidden>
        <div class="popup-title">설정</div>
        <label class="popup-field">
          <span>Wiki URL</span>
          <input type="url" name="wikiUrl" value="${escapeHtml(settings.baseUrl)}" />
        </label>
        <div class="popup-actions" role="group" aria-label="런처 위치">
          <button type="button" data-action="dock-top">상단</button>
          <button type="button" data-action="dock-bottom">하단</button>
        </div>
        <button type="button" class="popup-hide-button" data-action="toggle-hidden">런처 숨기기</button>
      </div>
    </section>
  `;

  const launcher = queryRequired<HTMLElement>(shadowRoot, ".launcher");
  const mainButton = queryRequired<HTMLButtonElement>(shadowRoot, ".launcher-main");
  const homeButton = queryRequired<HTMLButtonElement>(shadowRoot, ".launcher-home");
  const settingsButton = queryRequired<HTMLButtonElement>(shadowRoot, ".launcher-settings");
  const popup = queryRequired<HTMLDivElement>(shadowRoot, ".launcher-popup");
  const wikiUrlInput = queryRequired<HTMLInputElement>(shadowRoot, 'input[name="wikiUrl"]');

  let lastPointerDown: { clientY: number; offsetY: number } | null = null;
  let dragState: { pointerId: number; startY: number; startOffsetY: number; moved: boolean } | null = null;
  let suppressNextClick = false;

  launcher.addEventListener("mouseenter", () => {
    launcher.dataset.expanded = "true";
  });

  launcher.addEventListener("mouseleave", () => {
    if (!popup.hidden || dragState) {
      return;
    }

    launcher.dataset.expanded = "false";
  });

  mainButton.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    const currentTop = readHostTop(host);
    lastPointerDown = { clientY: event.clientY, offsetY: currentTop };
    dragState = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startOffsetY: currentTop,
      moved: false
    };
    mainButton.setPointerCapture(event.pointerId);
  });

  mainButton.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaY = event.clientY - dragState.startY;
    if (Math.abs(deltaY) < DRAG_THRESHOLD_PX && !dragState.moved) {
      return;
    }

    dragState.moved = true;
    popup.hidden = true;
    launcher.dataset.expanded = "true";
    launcher.dataset.dragging = "true";
    setHostPosition(host, dragState.startOffsetY + deltaY);
  });

  mainButton.addEventListener("pointerup", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    mainButton.releasePointerCapture(event.pointerId);
    const wasMoved = dragState.moved;
    const nextOffsetY = readHostTop(host);
    dragState = null;
    launcher.dataset.dragging = "false";

    if (wasMoved) {
      suppressNextClick = true;
      void safeStorageSet({
        [STORAGE_KEYS.dock]: nextOffsetY < window.innerHeight / 2 ? "top" : "bottom",
        [STORAGE_KEYS.offsetY]: nextOffsetY
      });
    }
  });

  mainButton.addEventListener("pointercancel", () => {
    dragState = null;
  });

  mainButton.addEventListener("click", async () => {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }

    try {
      await sendSidePanelToggle("toggle");
    } catch (error) {
      if (isExtensionContextInvalidated(error)) {
        teardownLauncher(host);
      }
    }
  });

  homeButton.addEventListener("click", async () => {
    try {
      const current = await readSettings();
      window.open(normalizeWikiUrl(current.baseUrl), "_blank", "noopener,noreferrer");
    } catch (error) {
      if (isExtensionContextInvalidated(error)) {
        teardownLauncher(host);
      }
    }
  });

  settingsButton.addEventListener("click", () => {
    popup.hidden = !popup.hidden;
    launcher.dataset.expanded = "true";
  });

  popup.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const action = target.dataset.action;
    if (action === "dock-top" || action === "dock-bottom") {
      const dock = action === "dock-top" ? "top" : "bottom";
      const nextOffsetY = readDockOffsetY(dock);
      setHostPosition(host, nextOffsetY);
      await safeStorageSet({
        [STORAGE_KEYS.dock]: dock,
        [STORAGE_KEYS.offsetY]: nextOffsetY
      });
      return;
    }

    if (action === "toggle-hidden") {
      try {
        const current = await readSettings();
        const nextHidden = !current.hidden;
        launcher.dataset.hidden = String(nextHidden);
        popup.hidden = true;
        launcher.dataset.expanded = "false";
        await safeStorageSet({ [STORAGE_KEYS.hidden]: nextHidden });
      } catch (error) {
        if (isExtensionContextInvalidated(error)) {
          teardownLauncher(host);
        }
      }
    }
  });

  wikiUrlInput.addEventListener("change", async () => {
    try {
      await safeStorageSet({ [STORAGE_KEYS.baseUrl]: normalizeWikiUrl(wikiUrlInput.value) });
    } catch (error) {
      if (isExtensionContextInvalidated(error)) {
        teardownLauncher(host);
      }
    }
  });

  mainButton.addEventListener("contextmenu", async (event) => {
    event.preventDefault();
    try {
      const current = await readSettings();
      const nextHidden = !current.hidden;
      launcher.dataset.hidden = String(nextHidden);
      await safeStorageSet({ [STORAGE_KEYS.hidden]: nextHidden });
    } catch (error) {
      if (isExtensionContextInvalidated(error)) {
        teardownLauncher(host);
      }
    }
  });

  window.addEventListener("resize", () => {
    const pointerOffsetY = lastPointerDown?.offsetY ?? readHostTop(host);
    setHostPosition(host, pointerOffsetY);
    void safeStorageSet({ [STORAGE_KEYS.offsetY]: readHostTop(host) });
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes[STORAGE_KEYS.hidden]) {
      launcher.dataset.hidden = String(changes[STORAGE_KEYS.hidden].newValue === true);
    }

    const nextOffsetY = changes[STORAGE_KEYS.offsetY]?.newValue;
    if (typeof nextOffsetY === "number") {
      setHostPosition(host, nextOffsetY);
    }
  });
}

async function readSettings(): Promise<LauncherSettings> {
  try {
    const values = await chrome.storage.local.get([
      STORAGE_KEYS.baseUrl,
      STORAGE_KEYS.dock,
      STORAGE_KEYS.hidden,
      STORAGE_KEYS.offsetY
    ]);
    const dock = values[STORAGE_KEYS.dock] === "bottom" ? "bottom" : "top";
    const storedBaseUrl = values[STORAGE_KEYS.baseUrl];
    const storedOffsetY = values[STORAGE_KEYS.offsetY];

    return {
      baseUrl: typeof storedBaseUrl === "string" && storedBaseUrl.trim() ? normalizeWikiUrl(storedBaseUrl) : DEFAULT_BASE_URL,
      dock,
      hidden: values[STORAGE_KEYS.hidden] === true,
      offsetY: typeof storedOffsetY === "number" ? clampLauncherY(storedOffsetY) : readDockOffsetY(dock)
    };
  } catch (error) {
    if (isExtensionContextInvalidated(error)) {
      return {
        baseUrl: DEFAULT_BASE_URL,
        dock: "top",
        hidden: false,
        offsetY: readDockOffsetY("top")
      };
    }

    throw error;
  }
}

async function sendSidePanelToggle(action: "open" | "close" | "toggle") {
  return new Promise<{ ok: boolean; panelOpen: boolean; message?: string }>((resolve) => {
    chrome.runtime.sendMessage({ type: "OPEN_SFOOD_WIKI_SIDE_PANEL", action }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, panelOpen: action === "close", message: chrome.runtime.lastError.message });
        return;
      }

      resolve(isSidePanelResponse(response) ? response : { ok: true, panelOpen: action === "open" });
    });
  });
}

function setHostPosition(host: HTMLElement, offsetY: number) {
  host.style.setProperty("position", "fixed", "important");
  host.style.setProperty("right", "0", "important");
  host.style.setProperty("top", `${clampLauncherY(offsetY)}px`, "important");
  host.style.setProperty("z-index", "2147483647", "important");
  host.style.setProperty("width", `${HOST_SIZE}px`, "important");
  host.style.setProperty("height", `${HOST_SIZE}px`, "important");
  host.style.setProperty("display", "block", "important");
  host.style.setProperty("pointer-events", "auto", "important");
}

function readHostTop(host: HTMLElement) {
  return clampLauncherY(host.getBoundingClientRect().top);
}

function readDockOffsetY(dock: LauncherDock) {
  if (dock === "bottom") {
    return Math.max(80, window.innerHeight - 190);
  }

  return 96;
}

function clampLauncherY(value: number) {
  const max = Math.max(80, window.innerHeight - HOST_SIZE - 12);
  return Math.min(Math.max(64, Math.round(value)), max);
}

function normalizeWikiUrl(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : DEFAULT_BASE_URL;
}

function queryRequired<T extends Element>(root: ShadowRoot, selector: string): T {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing launcher element: ${selector}`);
  }

  return element;
}

function isSidePanelResponse(value: unknown): value is { ok: boolean; panelOpen: boolean; message?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { ok?: unknown }).ok === "boolean" &&
    typeof (value as { panelOpen?: unknown }).panelOpen === "boolean"
  );
}

async function safeStorageSet(items: Record<string, unknown>) {
  try {
    await chrome.storage.local.set(items);
  } catch (error) {
    if (!isExtensionContextInvalidated(error)) {
      throw error;
    }
  }
}

async function safeStorageRemove(keys: string[] | string) {
  try {
    await chrome.storage.local.remove(keys);
  } catch (error) {
    if (!isExtensionContextInvalidated(error)) {
      throw error;
    }
  }
}

function teardownLauncher(host: HTMLElement) {
  host.remove();
}

function isExtensionContextInvalidated(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : "";

  return message.includes("Extension context invalidated");
}

function buildLauncherCss() {
  return `
    :host {
      all: initial;
      color-scheme: light;
      font-family: "맑은 고딕", "Malgun Gothic", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    }
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
    .launcher {
      position: absolute;
      top: 0;
      right: 0;
      display: grid;
      justify-items: end;
      width: 130px;
      height: 130px;
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
      overflow: visible;
      transition:
        opacity 0.15s ease,
        transform 0.2s ease;
    }
    .launcher[data-hidden="true"] {
      transform: translateX(46px);
    }
    .launcher[data-hidden="true"][data-expanded="true"] {
      transform: translateX(0);
    }
    .launcher-stack {
      position: relative;
      width: 130px;
      height: 130px;
    }
    button {
      all: unset;
      box-sizing: border-box;
      cursor: pointer;
      font: inherit;
    }
    .launcher-main,
    .launcher-home,
    .launcher-settings {
      position: absolute;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #1d1b17;
    }
    .launcher-main {
      top: 38px;
      right: 0;
      width: 54px;
      height: 54px;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      opacity: 1;
      touch-action: none;
      z-index: 3;
    }
    .launcher-main:active {
      cursor: grabbing;
    }
    .launcher-home,
    .launcher-settings {
      right: 9px;
      width: 36px;
      height: 36px;
      border-radius: 0;
      background: transparent;
      color: #54585a;
      opacity: 0;
      pointer-events: none;
      z-index: 2;
      transition:
        opacity 0.15s ease,
        transform 0.15s ease,
        color 0.15s ease;
    }
    .launcher-home {
      top: 47px;
      transform: translateY(0) scale(0.86);
    }
    .launcher-settings {
      top: 47px;
      transform: translateY(0) scale(0.86);
    }
    .launcher:hover .launcher-home,
    .launcher[data-expanded="true"] .launcher-home,
    .launcher:hover .launcher-settings,
    .launcher[data-expanded="true"] .launcher-settings {
      opacity: 0.5;
      pointer-events: auto;
    }
    .launcher:hover .launcher-home,
    .launcher[data-expanded="true"] .launcher-home {
      transform: translateY(-42px) scale(1);
    }
    .launcher:hover .launcher-settings,
    .launcher[data-expanded="true"] .launcher-settings {
      transform: translateY(42px) scale(1);
    }
    .launcher[data-dragging="true"] .launcher-home,
    .launcher[data-dragging="true"] .launcher-settings {
      opacity: 0.25;
    }
    .launcher-main:hover,
    .launcher-home:hover,
    .launcher-settings:hover {
      color: #c80025;
    }
    .launcher-main svg {
      display: block;
      width: 42px;
      height: 42px;
      filter: drop-shadow(rgba(0, 0, 0, 0.18) 0 2px 5px);
    }
    .launcher-home svg,
    .launcher-settings svg {
      display: block;
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
      filter: drop-shadow(rgba(255, 255, 255, 0.72) 0 1px 2px);
    }
    .launcher-popup {
      position: absolute;
      right: 56px;
      top: 6px;
      display: grid;
      gap: 10px;
      width: 226px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 14px;
      background: #ffffff;
      box-shadow: rgba(0, 0, 0, 0.16) 0 10px 28px;
      padding: 12px;
      color: #1d1b17;
    }
    .launcher-popup[hidden] {
      display: none !important;
    }
    .popup-title {
      color: #766b5b;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .popup-field {
      display: grid;
      gap: 6px;
      color: #54585a;
      font-size: 12px;
      font-weight: 700;
    }
    .popup-field input {
      width: 100%;
      min-width: 0;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 9px;
      background: #ffffff;
      color: #1d1b17;
      font: inherit;
      font-size: 12px;
      outline: none;
      padding: 8px 10px;
    }
    .popup-field input:focus {
      border-color: rgba(228, 0, 43, 0.55);
    }
    .popup-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .launcher-popup button {
      display: inline-flex;
      width: 100%;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 9px;
      background: #f9f7f2;
      color: #1d1b17;
      font-size: 12px;
      font-weight: 700;
      padding: 8px 10px;
    }
    .launcher-popup button:hover {
      background: #f2ece7;
    }
    .popup-hide-button {
      border-color: rgba(228, 0, 43, 0.16) !important;
      background: #fff5f7 !important;
      color: #c80025 !important;
    }
  `;
}

function buildBookIcon() {
  return `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#e4002B"></rect>
      <path d="M5 12 Q5 11 6.5 10.5 L14.5 10 L14.5 22.5 L6.5 23 Q5 23.5 5 22.5 Z" fill="white"></path>
      <path d="M17.5 10 L25.5 10.5 Q27 11 27 12 L27 22.5 Q27 23.5 25.5 23 L17.5 22.5 Z" fill="rgba(255,255,255,0.82)"></path>
      <rect x="14.5" y="10" width="3" height="12.5" fill="#e4002B"></rect>
      <path d="M5 12 Q16 8.5 27 12" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"></path>
    </svg>
  `;
}

function buildHomeIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.8 10.7 12 4l8.2 6.7"></path>
      <path d="M6.5 9.8v9h11v-9"></path>
      <path d="M10 18.8v-5h4v5"></path>
    </svg>
  `;
}

function buildGearIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2"></circle>
      <path d="M12 4.5v2.3"></path>
      <path d="M12 17.2v2.3"></path>
      <path d="M4.8 12h2.3"></path>
      <path d="M16.9 12h2.3"></path>
      <path d="m6.2 6.2 1.6 1.6"></path>
      <path d="m16.2 16.2 1.6 1.6"></path>
      <path d="m6.2 17.8 1.6-1.6"></path>
      <path d="m16.2 7.8 1.6-1.6"></path>
    </svg>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
