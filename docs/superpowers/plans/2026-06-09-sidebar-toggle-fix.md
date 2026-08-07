# Sidebar Toggle Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플로팅 런처 아이콘 클릭 시 사이드 패널이 열리고 닫히는 토글 기능을 올바르게 동작시킨다.

**Architecture:** `background.ts` 에 집중된 4가지 수정 — (1) `openSidePanel`에서 setOptions/open 동시 dispatch로 user gesture 토큰 보존, (2) `closeSidePanel`에서 detached 레퍼런스 제거, (3) `chrome.storage.session` 으로 토글 상태를 Service Worker 재시작에 걸쳐 유지, (4) `chrome.action.onClicked` 핸들러로 툴바 아이콘·플로팅 런처 상태 동기화. 변경 파일은 `background.ts`와 `chrome.d.ts` 두 파일로 한정된다. 테스트를 위해 `test-setup.ts` 및 `background.test.ts`를 신규 생성한다.

**Tech Stack:** TypeScript, Vitest, Chrome/Edge Manifest V3 Side Panel API, `chrome.storage.session`

---

## 수정 가능 여부 판단

| 원인 | 수정 가능 여부 | 근거 |
|---|---|---|
| `await setOptions()` 후 `open()` 호출 → user gesture 토큰 만료 | ✅ 가능 | `Promise.all` 으로 동시 dispatch하면 JS 단일 스레드 특성상 IPC 순서가 보장됨 |
| `closeSidePanel` detached 레퍼런스 | ✅ 가능 | `chrome.sidePanel.close()` 직접 호출로 단순 대체 |
| Service Worker 재시작 시 in-memory 상태 초기화 | ✅ 가능 | `chrome.storage.session` (Chrome 102+) 은 세션 내 Service Worker 재시작에 걸쳐 지속됨 |
| 툴바 아이콘과 플로팅 런처 상태 불일치 | ✅ 가능 | `openPanelOnActionClick: false` 로 전환 후 `chrome.action.onClicked` 에서 동일 상태 Map 갱신 |

---

## File Map

| 파일 | 변경 유형 | 역할 |
|---|---|---|
| `apps/edge-sidebar/src/chrome.d.ts` | 수정 | `chrome.action`, `chrome.storage.session` 타입 추가 |
| `apps/edge-sidebar/src/test-setup.ts` | 신규 생성 | Vitest용 `chrome` global mock (setupFiles) |
| `apps/edge-sidebar/vite.config.ts` | 수정 | `setupFiles` 추가 |
| `apps/edge-sidebar/src/background.ts` | 수정 | 순수 함수 export + 4가지 수정 적용 |
| `apps/edge-sidebar/src/background.test.ts` | 신규 생성 | 순수 로직 단위 테스트 |

---

## Task 1: chrome.d.ts 타입 확장

**Files:**
- Modify: `apps/edge-sidebar/src/chrome.d.ts`

- [ ] **Step 1: `chrome.action` 과 `chrome.storage.session` 선언 추가**

아래 내용으로 파일 전체를 교체한다:

```typescript
declare namespace chrome {
  namespace action {
    const onClicked: {
      addListener(callback: (tab: { id?: number; windowId?: number }) => void): void;
    };
  }

  namespace runtime {
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
```

- [ ] **Step 2: typecheck 통과 확인**

```bash
pnpm --filter @sfood/edge-sidebar typecheck
```

Expected: 오류 없음.

---

## Task 2: Vitest chrome mock 설정

**Files:**
- Create: `apps/edge-sidebar/src/test-setup.ts`
- Modify: `apps/edge-sidebar/vite.config.ts`

`background.ts` 를 Vitest에서 import하면 top-level에서 `chrome.*` API를 호출한다. `setupFiles`로 chrome global을 미리 stub하여 테스트 환경에서 import가 성공하도록 한다.

- [ ] **Step 1: `test-setup.ts` 생성**

```typescript
// apps/edge-sidebar/src/test-setup.ts
import { vi } from "vitest";

vi.stubGlobal("chrome", {
  action: {
    onClicked: { addListener: vi.fn() }
  },
  runtime: {
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
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
```

- [ ] **Step 2: `vite.config.ts` 에 `setupFiles` 추가**

`test` 블록을 아래와 같이 교체한다:

```typescript
test: {
  environment: "node",
  setupFiles: ["./src/test-setup.ts"]
}
```

- [ ] **Step 3: 기존 테스트가 여전히 통과하는지 확인**

```bash
pnpm --filter @sfood/edge-sidebar test
```

Expected: PASS (wikiClient 기존 테스트 3개 통과).

---

## Task 3: 순수 함수 export 및 단위 테스트 작성

**Files:**
- Modify: `apps/edge-sidebar/src/background.ts`
- Create: `apps/edge-sidebar/src/background.test.ts`

- [ ] **Step 1: 실패하는 테스트 먼저 작성**

```typescript
// apps/edge-sidebar/src/background.test.ts
import { describe, expect, it } from "vitest";

import { getToggleAction, getPanelTargetKey } from "./background";

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
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
pnpm --filter @sfood/edge-sidebar test
```

Expected: FAIL — `getToggleAction`, `getPanelTargetKey` not exported.

- [ ] **Step 3: `background.ts` 에서 두 함수를 export로 변경**

기존 `function getPanelTargetKey(...)` 선언을 `export function getPanelTargetKey(...)` 로 변경한다.

기존의 inline toggle 판단 로직(`onMessage` 내부의 ternary)을 새 `getToggleAction` 함수로 추출하여 export한다:

```typescript
// background.ts 상단 (panelOpenByTarget 선언 바로 뒤)에 추가
export function getToggleAction(
  currentOpen: boolean,
  action: "toggle" | "open" | "close"
): "open" | "close" {
  if (action === "toggle") return currentOpen ? "close" : "open";
  return action;
}
```

`onMessage` 내부의 기존 ternary:
```typescript
const action = message.action === "toggle"
  ? currentOpen ? "close" : "open"
  : message.action === "close"
    ? "close"
    : "open";
```
를 아래로 대체한다:
```typescript
const action = getToggleAction(currentOpen, message.action ?? "toggle");
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
pnpm --filter @sfood/edge-sidebar test
```

Expected: PASS — 10개 테스트 (wikiClient 7 + background 3×2+1 = 10) 통과.

- [ ] **Step 5: Commit**

```bash
git add apps/edge-sidebar/src/background.ts apps/edge-sidebar/src/background.test.ts apps/edge-sidebar/src/test-setup.ts apps/edge-sidebar/vite.config.ts
git commit -m "test: extract pure toggle logic and add background unit tests"
```

---

## Task 4: openSidePanel 동시 dispatch 수정 (핵심 수정)

**Files:**
- Modify: `apps/edge-sidebar/src/background.ts`

**수정 이유:** 기존 코드는 `await setOptions()` 완료 후 `open()`을 호출한다. Chrome의 user gesture 토큰은 content script 메시지 핸들러에서 전파되지만, `await` 후에는 만료될 수 있다. 두 IPC를 JS 단일 스레드 내 같은 턴에 dispatch하면 Chrome 브라우저 프로세스가 순서대로 처리하므로(setOptions 먼저 → open 후) 기능은 동일하게 유지되고 user gesture 토큰도 보존된다.

- [ ] **Step 1: `openSidePanel` 함수 교체**

기존:
```typescript
async function openSidePanel(tabId?: number, windowId?: number) {
  if (typeof tabId === "number") {
    await chrome.sidePanel.setOptions({
      tabId,
      path: SIDEPANEL_PATH,
      enabled: true
    });
  }

  await chrome.sidePanel.open({ tabId, windowId });
}
```

교체:
```typescript
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
```

- [ ] **Step 2: typecheck + 테스트 통과 확인**

```bash
pnpm --filter @sfood/edge-sidebar typecheck && pnpm --filter @sfood/edge-sidebar test
```

Expected: PASS.

- [ ] **Step 3: build 확인**

```bash
pnpm --filter @sfood/edge-sidebar build
```

Expected: `dist/` 생성 성공.

- [ ] **Step 4: Commit**

```bash
git add apps/edge-sidebar/src/background.ts
git commit -m "fix: dispatch setOptions and open concurrently to preserve user gesture token"
```

---

## Task 5: closeSidePanel detached 레퍼런스 제거

**Files:**
- Modify: `apps/edge-sidebar/src/background.ts`

- [ ] **Step 1: `closeSidePanel` 서명 변경 및 직접 호출로 대체**

기존 코드에서 `const closePanel = chrome.sidePanel.close` 변수를 제거하고, `closeSidePanel` 파라미터에서 `closePanel` 인자를 제거한다.

`onMessage` 내부의 기존:
```typescript
const closePanel = chrome.sidePanel.close;
const request = action === "close"
  ? closeSidePanel(closePanel, tabId, windowId)
  : openSidePanel(tabId, windowId);
```

교체:
```typescript
const request = action === "close"
  ? closeSidePanel(tabId, windowId)
  : openSidePanel(tabId, windowId);
```

기존 함수:
```typescript
async function closeSidePanel(
  closePanel: typeof chrome.sidePanel.close | undefined,
  tabId?: number,
  windowId?: number
) {
  if (typeof closePanel === "function" && typeof windowId === "number") {
    await closePanel({ windowId });
    return;
  }

  if (typeof tabId === "number") {
    await chrome.sidePanel.setOptions({ tabId, enabled: false });
    return;
  }

  throw new Error("Failed to close side panel.");
}
```

교체:
```typescript
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
```

- [ ] **Step 2: typecheck + 테스트 통과 확인**

```bash
pnpm --filter @sfood/edge-sidebar typecheck && pnpm --filter @sfood/edge-sidebar test
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/edge-sidebar/src/background.ts
git commit -m "fix: call chrome.sidePanel.close directly instead of via detached reference"
```

---

## Task 6: chrome.storage.session 으로 토글 상태 유지

**Files:**
- Modify: `apps/edge-sidebar/src/background.ts`

**수정 이유:** MV3 Service Worker는 약 30초 비활성 후 종료되며 `panelOpenByTarget` Map이 초기화된다. 재시작 후 첫 번째 클릭이 "닫기"가 아닌 "열기"로 판단되어 토글이 한 번 건너뛰는 문제가 발생한다. `chrome.storage.session`은 브라우저 세션 내 Service Worker 재시작에 걸쳐 지속되므로 이 문제를 해결한다.

- [ ] **Step 1: 상수 및 startup restore 추가**

`background.ts` 상단 (기존 상수 선언 바로 뒤) 에 추가:

```typescript
const SESSION_STATE_KEY = "sfoodWikiSidebar.panelOpenByTarget";

void restoreToggleState();
```

- [ ] **Step 2: `restoreToggleState` 와 `persistToggleState` 함수 추가**

파일 하단 (`isOpenSidePanelMessage` 함수 앞) 에 추가:

```typescript
async function restoreToggleState(): Promise<void> {
  try {
    const stored = await chrome.storage.session.get(SESSION_STATE_KEY);
    const entries = stored[SESSION_STATE_KEY];
    if (!Array.isArray(entries)) {
      return;
    }

    for (const entry of entries as unknown[]) {
      if (
        Array.isArray(entry) &&
        typeof entry[0] === "string" &&
        typeof entry[1] === "boolean"
      ) {
        panelOpenByTarget.set(entry[0], entry[1]);
      }
    }
  } catch {
    // Non-critical: empty state is safe
  }
}

async function persistToggleState(): Promise<void> {
  try {
    await chrome.storage.session.set({
      [SESSION_STATE_KEY]: [...panelOpenByTarget.entries()]
    });
  } catch {
    // Non-critical
  }
}
```

- [ ] **Step 3: `onMessage` 핸들러의 then/catch 에 `persistToggleState` 호출 추가**

기존 then/catch 블록:
```typescript
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
```

교체:
```typescript
request
  .then(() => {
    const panelOpen = action === "open";
    panelOpenByTarget.set(targetKey, panelOpen);
    void persistToggleState();
    sendResponse({ ok: true, panelOpen });
  })
  .catch((error: unknown) => {
    panelOpenByTarget.set(targetKey, action === "close");
    void persistToggleState();
    sendResponse({
      ok: false,
      panelOpen: action === "close",
      message: error instanceof Error ? error.message : "Failed to open side panel."
    });
  });
```

- [ ] **Step 4: typecheck + 테스트 통과 확인**

```bash
pnpm --filter @sfood/edge-sidebar typecheck && pnpm --filter @sfood/edge-sidebar test
```

Expected: PASS.

- [ ] **Step 5: build 확인**

```bash
pnpm --filter @sfood/edge-sidebar build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/edge-sidebar/src/background.ts
git commit -m "fix: persist toggle state to chrome.storage.session across service worker restarts"
```

---

## Task 7: chrome.action.onClicked 핸들러로 툴바·런처 상태 동기화

**Files:**
- Modify: `apps/edge-sidebar/src/background.ts`

**수정 이유:** `openPanelOnActionClick: true` 일 때 툴바 아이콘 클릭은 Chrome이 자체적으로 처리하므로 `panelOpenByTarget`이 갱신되지 않는다. 툴바로 패널을 열고 런처를 클릭하면 잘못된 상태를 읽어 "열기"를 시도한다. `openPanelOnActionClick: false` 로 전환하고 `onClicked` 핸들러에서 직접 open/close를 호출하면 두 진입점이 동일한 상태 Map을 공유한다.

- [ ] **Step 1: `onInstalled` 에서 `openPanelOnActionClick` 을 `false` 로 변경**

```typescript
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch((error: unknown) => {
    console.error("Failed to configure side panel action behavior.", error);
  });
});
```

- [ ] **Step 2: `chrome.action.onClicked` 핸들러 추가**

`onMessage` listener 바로 뒤에 추가:

```typescript
chrome.action.onClicked.addListener((tab) => {
  const tabId = tab.id;
  const windowId = tab.windowId;

  if (typeof tabId !== "number" && typeof windowId !== "number") {
    return;
  }

  const targetKey = getPanelTargetKey(tabId, windowId);
  const currentOpen = panelOpenByTarget.get(targetKey) === true;
  const resolvedAction = getToggleAction(currentOpen, "toggle");

  const request = resolvedAction === "close"
    ? closeSidePanel(tabId, windowId)
    : openSidePanel(tabId, windowId);

  request.then(() => {
    panelOpenByTarget.set(targetKey, resolvedAction === "open");
    void persistToggleState();
  }).catch(() => {
    panelOpenByTarget.set(targetKey, resolvedAction === "close");
    void persistToggleState();
  });
});
```

- [ ] **Step 3: typecheck + 테스트 통과 확인**

```bash
pnpm --filter @sfood/edge-sidebar typecheck && pnpm --filter @sfood/edge-sidebar test
```

Expected: PASS.

- [ ] **Step 4: build 확인**

```bash
pnpm --filter @sfood/edge-sidebar build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/edge-sidebar/src/background.ts apps/edge-sidebar/src/chrome.d.ts
git commit -m "fix: sync toolbar click state via chrome.action.onClicked"
```

---

## Final: 브라우저 수동 검증

- [ ] `edge://extensions` 열기 → SFOOD AI Wiki 확장 "Refresh" 클릭 (또는 `apps/edge-sidebar/dist` load unpacked)
- [ ] 테스트 탭 페이지 새로고침 (content script 재주입 필요)
- [ ] **기본 토글**: 플로팅 아이콘 클릭 → 패널 열림 ✓ / 클릭 → 패널 닫힘 ✓
- [ ] **Service Worker 재시작**: 30초 이상 대기 후 클릭 → 패널 열림 ✓ / 클릭 → 패널 닫힘 ✓ (session 상태 복구)
- [ ] **툴바 동기화**: 툴바 아이콘 클릭 → 패널 열림 ✓ / 플로팅 아이콘 클릭 → 패널 닫힘 ✓ (상태 공유 확인)
- [ ] **실패 없음 확인**: 브라우저 콘솔에서 `Failed to open/close side panel` 에러 없는지 확인

---

## 수정 전·후 비교

| 항목 | 수정 전 | 수정 후 |
|---|---|---|
| user gesture 보존 | `await setOptions` 후 `open` 호출 → 토큰 만료 위험 | `Promise.all` 동시 dispatch → 같은 JS 턴에 `open` 호출 |
| close API 호출 | `const closePanel = chrome.sidePanel.close` 후 `closePanel(...)` | `chrome.sidePanel.close(...)` 직접 호출 |
| SW 재시작 후 상태 | Map 초기화 → 첫 클릭 토글 스킵 | `storage.session` 복구 → 올바른 토글 |
| 툴바 · 런처 상태 | `openPanelOnActionClick: true` 로 툴바 상태 미추적 | `onClicked` 핸들러로 동일 Map 갱신 |
