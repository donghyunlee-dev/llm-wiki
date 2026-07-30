import { describe, expect, it } from "vitest";
import { buildSnapshotWikiDocuments } from "./confluenceSnapshots";

describe("buildSnapshotWikiDocuments", () => {
  it("normalizes all configured snapshots into wiki documents", () => {
    const documents = buildSnapshotWikiDocuments();

    expect(documents.length).toBe(12);
    expect(documents.every((document) => document.sourceUrl?.includes("/wiki/spaces/"))).toBe(true);
  });
});
