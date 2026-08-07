import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { MermaidDiagramBlock, toLegacyRgb } from "./MermaidDiagramBlock";

const { renderMock, initializeMock } = vi.hoisted(() => ({
  renderMock: vi.fn(),
  initializeMock: vi.fn(),
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: initializeMock,
    render: renderMock,
  },
}));

afterEach(() => {
  cleanup();
  renderMock.mockReset();
  initializeMock.mockReset();
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("MermaidDiagramBlock", () => {
  it("passes the diagram definition to mermaid.render and injects the returned SVG", async () => {
    renderMock.mockResolvedValue({ svg: "<svg data-testid='diagram-svg'></svg>" });

    const { container } = renderWithTheme(<MermaidDiagramBlock definition={"flowchart LR\nA-->B"} />);

    await waitFor(() => expect(container.querySelector("svg")).toBeInTheDocument());

    expect(renderMock).toHaveBeenCalledWith(expect.stringContaining("mermaid-"), "flowchart LR\nA-->B");
  });

  it("initializes mermaid with a strict security level so embedded scripts cannot run", async () => {
    renderMock.mockResolvedValue({ svg: "<svg></svg>" });

    renderWithTheme(<MermaidDiagramBlock definition={"flowchart LR\nA-->B"} />);

    await waitFor(() => expect(initializeMock).toHaveBeenCalled());

    expect(initializeMock.mock.calls[0][0]).toMatchObject({ securityLevel: "strict" });
  });

  it("shows a fallback message instead of a blank block when rendering fails", async () => {
    renderMock.mockRejectedValue(new Error("invalid syntax"));

    const { findByText } = renderWithTheme(<MermaidDiagramBlock definition="not a real diagram" />);

    expect(await findByText("다이어그램을 표시할 수 없습니다.")).toBeInTheDocument();
  });

  it("locks down mermaid config keys so an author-controlled %%{init}%% directive cannot override theming/security", async () => {
    renderMock.mockResolvedValue({ svg: "<svg></svg>" });

    renderWithTheme(<MermaidDiagramBlock definition={"flowchart LR\nA-->B"} />);

    await waitFor(() => expect(initializeMock).toHaveBeenCalled());

    const config = initializeMock.mock.calls[0][0];
    expect(config.secure).toEqual(
      expect.arrayContaining(["secure", "securityLevel", "theme", "themeVariables", "themeCSS"]),
    );
  });
});

describe("toLegacyRgb", () => {
  it("passes through an already-legacy rgb() string unchanged", () => {
    expect(toLegacyRgb("rgb(17, 24, 39)")).toBe("rgb(17, 24, 39)");
  });

  it("converts CSS Color 4 color(srgb r g b) decimal channels to rgb()", () => {
    expect(toLegacyRgb("color(srgb 1 0.5 0)")).toBe("rgb(255, 128, 0)");
  });

  it("converts color(srgb ...) with a decimal alpha to rgba()", () => {
    expect(toLegacyRgb("color(srgb 1 0.5 0 / 0.5)")).toBe("rgba(255, 128, 0, 0.5)");
  });

  it("converts color(srgb ...) with percentage channels and alpha", () => {
    expect(toLegacyRgb("color(srgb 100% 50% 0% / 50%)")).toBe("rgba(255, 128, 0, 0.5)");
  });

  it("treats an alpha of \"none\" as fully opaque (drops the alpha channel)", () => {
    expect(toLegacyRgb("color(srgb 1 0.5 0 / none)")).toBe("rgb(255, 128, 0)");
  });

  it("passes through a format it doesn't recognize instead of guessing", () => {
    expect(toLegacyRgb("lab(50% 40 59.5)")).toBe("lab(50% 40 59.5)");
  });
});
