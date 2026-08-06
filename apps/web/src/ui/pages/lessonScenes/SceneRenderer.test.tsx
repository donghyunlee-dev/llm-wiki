import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import type { SceneType, SemanticBlock } from "@sfood/wiki-core";
import { SceneRenderer } from "./SceneRenderer";

const blocks: SemanticBlock[] = [{ kind: "paragraph", html: "본문" }];

const ALL_SCENE_TYPES: SceneType[] = [
  "hook",
  "mental-model",
  "concept",
  "process",
  "comparison",
  "example",
  "screenshot",
  "misconception",
  "knowledge-check",
  "summary",
  "closing",
];

describe("SceneRenderer", () => {
  it("renders the hook scene wrapper for type hook", () => {
    const { container } = render(<SceneRenderer type="hook" layout="focus" blocks={blocks} />);
    expect(container.querySelector(".lesson-scene-hook")).toBeInTheDocument();
    expect(container.querySelector(".lesson-scene-layout-focus")).toBeInTheDocument();
  });

  it("renders the comparison scene wrapper for type comparison", () => {
    const { container } = render(
      <SceneRenderer type="comparison" layout="side-by-side" blocks={blocks} />,
    );
    expect(container.querySelector(".lesson-scene-comparison")).toBeInTheDocument();
    expect(container.querySelector(".lesson-scene-layout-side-by-side")).toBeInTheDocument();
  });

  it("renders the knowledge-check scene wrapper for type knowledge-check", () => {
    const { container } = render(
      <SceneRenderer type="knowledge-check" layout="focus" blocks={blocks} />,
    );
    expect(container.querySelector(".lesson-scene-knowledge-check")).toBeInTheDocument();
  });

  it.each(ALL_SCENE_TYPES)("dispatches a matching wrapper for every Scene Type (%s)", (type) => {
    const { container } = render(<SceneRenderer type={type} layout="focus" blocks={blocks} />);
    expect(container.querySelector(`.lesson-scene-${type}`)).toBeInTheDocument();
  });
});
