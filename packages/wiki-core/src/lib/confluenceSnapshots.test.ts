import { describe, expect, it } from "vitest";
import { buildSnapshotWikiDocuments } from "./confluenceSnapshots";

describe("buildSnapshotWikiDocuments", () => {
  it("normalizes all configured snapshots into public wiki documents", () => {
    const documents = buildSnapshotWikiDocuments();

    expect(documents.length).toBe(9);
    expect(documents.every((document) => document.metadata.visibility === "public")).toBe(true);
    expect(documents.every((document) => document.sourceUrl?.includes("/wiki/spaces/"))).toBe(true);
  });
});
