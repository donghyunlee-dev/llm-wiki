import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { SemanticBlock } from "@sfood/wiki-core";
import { SemanticBlockList } from "./SemanticBlockRenderer";

afterEach(() => {
  cleanup();
});

describe("SemanticBlockList", () => {
  it("renders a paragraph block", () => {
    const blocks: SemanticBlock[] = [{ kind: "paragraph", html: "본문 텍스트" }];
    render(<SemanticBlockList blocks={blocks} />);

    expect(screen.getByText("본문 텍스트")).toBeInTheDocument();
  });

  it("renders a hookStatement block", () => {
    const blocks: SemanticBlock[] = [{ kind: "hookStatement", html: "질문입니다" }];
    render(<SemanticBlockList blocks={blocks} />);

    expect(screen.getByText("질문입니다")).toBeInTheDocument();
  });

  it("renders an exampleNote block", () => {
    const blocks: SemanticBlock[] = [{ kind: "exampleNote", html: "예시 문장" }];
    render(<SemanticBlockList blocks={blocks} />);

    expect(screen.getByText("예시 문장")).toBeInTheDocument();
  });

  it("renders a customHtml block inside a sandboxed iframe", () => {
    const blocks: SemanticBlock[] = [{ kind: "customHtml", html: "<div>도식</div>", css: ".x{color:red}" }];
    const { container } = render(<SemanticBlockList blocks={blocks} />);

    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("srcdoc")).toContain("<div>도식</div>");
  });
});
