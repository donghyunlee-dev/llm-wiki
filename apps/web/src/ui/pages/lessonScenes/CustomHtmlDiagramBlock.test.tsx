import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { CustomHtmlDiagramBlock } from "./CustomHtmlDiagramBlock";

describe("CustomHtmlDiagramBlock", () => {
  it("renders an iframe sandboxed with allow-same-origin only (never allow-scripts)", () => {
    const { container } = render(<CustomHtmlDiagramBlock html="<div>도식</div>" />);
    const iframe = container.querySelector("iframe");

    expect(iframe).toBeInTheDocument();
    expect(iframe?.getAttribute("sandbox")).toBe("allow-same-origin");
    expect(iframe?.getAttribute("sandbox")).not.toContain("allow-scripts");
  });

  it("embeds the provided html inside the srcDoc wrapper", () => {
    const html = '<div style="color:red">위험해 보이지만 스크립트는 없는 도식</div>';
    const { container } = render(<CustomHtmlDiagramBlock html={html} />);
    const iframe = container.querySelector("iframe");

    expect(iframe?.getAttribute("srcdoc")).toContain(html);
  });

  it("does not add allow-scripts even when the html contains a script tag", () => {
    const html = "<div>A</div><script>window.__xss = true;</script>";
    const { container } = render(<CustomHtmlDiagramBlock html={html} />);
    const iframe = container.querySelector("iframe");

    expect(iframe?.getAttribute("sandbox")).toBe("allow-same-origin");
  });

  it("sets a restrictive CSP that blocks remote network requests", () => {
    const { container } = render(<CustomHtmlDiagramBlock html="<div>A</div>" />);
    const iframe = container.querySelector("iframe");
    const srcDoc = iframe?.getAttribute("srcdoc") ?? "";

    expect(srcDoc).toContain("default-src 'none'");
    expect(srcDoc).toContain("img-src data: blob:");
  });

  it("sets referrerPolicy to no-referrer", () => {
    const { container } = render(<CustomHtmlDiagramBlock html="<div>A</div>" />);
    const iframe = container.querySelector("iframe");

    expect(iframe?.getAttribute("referrerpolicy")).toBe("no-referrer");
  });

  it("covers the iframe with a swipe overlay so mobile touches don't get swallowed by the iframe's own document", () => {
    const { container } = render(<CustomHtmlDiagramBlock html="<div>A</div>" />);

    expect(container.querySelector(".lesson-block-custom-html-swipe-overlay")).toBeInTheDocument();
  });

  it("injects the css prop into the sandboxed style tag", () => {
    const { container } = render(<CustomHtmlDiagramBlock html="<div>A</div>" css=".card{color:red}" />);
    const iframe = container.querySelector("iframe");

    expect(iframe?.getAttribute("srcdoc")).toContain(".card{color:red}");
  });

  it("neutralizes a </style breakout attempt inside the css prop instead of closing the tag early", () => {
    const maliciousCss = "body{}</style><div>escaped</div><style>";
    const { container } = render(<CustomHtmlDiagramBlock html="<div>A</div>" css={maliciousCss} />);
    const iframe = container.querySelector("iframe");
    const srcDoc = iframe?.getAttribute("srcdoc") ?? "";

    expect(srcDoc).not.toContain("</style><div>escaped</div>");
  });
});
