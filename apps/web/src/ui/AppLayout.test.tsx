import { describe, expect, it } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { ScrollRestoration } from "react-router-dom";
import { AppLayout } from "./AppLayout";

function containsElementType(node: ReactNode, type: unknown): boolean {
  if (!node || typeof node !== "object") {
    return false;
  }

  if (Array.isArray(node)) {
    return node.some((child) => containsElementType(child, type));
  }

  const element = node as ReactElement<{ children?: ReactNode }>;

  if (element.type === type) {
    return true;
  }

  return containsElementType(element.props?.children, type);
}

describe("AppLayout", () => {
  it("renders ScrollRestoration so client-side navigation resets scroll position", () => {
    const tree = AppLayout();

    expect(containsElementType(tree, ScrollRestoration)).toBe(true);
  });
});
