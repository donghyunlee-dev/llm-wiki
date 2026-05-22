import { describe, expect, it, vi } from "vitest";
import { getSnapshotPayload } from "./confluenceSnapshots";
import {
  PUBLIC_WIKI_SPACE_ID,
  buildPolicyDocumentsFromRecords,
  buildWikiDocumentsFromPayload,
  loadWikiDocuments,
  parseRemotePolicyPageRecords,
  parseRemoteOpsPageRecords,
  parseRemoteWikiPageRecords,
  type RemoteWikiPageRecord,
} from "./wikiDataSource";

function buildRemoteRecord(overrides: Partial<RemoteWikiPageRecord> = {}): RemoteWikiPageRecord {
  return {
    slug: "remote-guide",
    page: {
      id: "remote-1",
      parentId: "root-1",
      title: "Remote Guide",
      spaceId: PUBLIC_WIKI_SPACE_ID,
      status: "current",
      version: 1,
      bodyHtml: "<h2>Remote Heading</h2><p>Remote body</p>",
      sourceUrl: "https://example.com/wiki/spaces/public/pages/remote-1",
      metadata: {
        docType: "guide",
        audience: "beginner",
        status: "published",
        prerequisites: [],
        next: [],
        related: [],
      },
      updatedAt: "2026-04-29",
    },
    ...overrides,
  };
}

function buildPolicyRecord(overrides: Partial<RemoteWikiPageRecord> = {}): RemoteWikiPageRecord {
  return buildRemoteRecord({
    slug: "policy-guide",
    page: {
      ...buildRemoteRecord().page,
      id: "policy-1",
      title: "[Policy] Answering Rules",
      metadata: {
        ...buildRemoteRecord().page.metadata,
        docType: "policy",
      },
    },
    ...overrides,
  });
}

describe("wikiDataSource", () => {
  it("builds allowed wiki documents from snapshot-shaped remote payloads", () => {
    const documents = buildWikiDocumentsFromPayload(getSnapshotPayload());

    expect(documents).toHaveLength(10);
    expect(documents[0]?.title).toBe("가이드 인덱스");
  });

  it("builds wiki documents from remote page arrays", () => {
    const documents = buildWikiDocumentsFromPayload([buildRemoteRecord()]);

    expect(documents).toHaveLength(1);
    expect(documents[0]).toMatchObject({
      id: "remote-1",
      parentId: "root-1",
      slug: "remote-guide",
      title: "Remote Guide",
    });
  });

  it("accepts nav doc type used by the corpus navigation pages", () => {
    const documents = buildWikiDocumentsFromPayload([
      buildRemoteRecord({
        slug: "guide-index",
        page: {
          ...buildRemoteRecord().page,
          id: "index-1",
          title: "가이드 인덱스",
          metadata: {
            ...buildRemoteRecord().page.metadata,
            docType: "nav",
          },
        },
      }),
      buildRemoteRecord({
        slug: "guide-getting-started",
        page: {
          ...buildRemoteRecord().page,
          id: "nav-1",
          title: "Getting Started",
          metadata: {
            ...buildRemoteRecord().page.metadata,
            docType: "nav",
          },
        },
      }),
    ]);

    expect(documents).toHaveLength(2);
    expect(documents.map((document) => document.metadata.docType)).toEqual(["nav", "nav"]);
  });

  it("allows visible remote records with empty body HTML", () => {
    const documents = buildWikiDocumentsFromPayload([
      buildRemoteRecord({
        page: {
          ...buildRemoteRecord().page,
          bodyHtml: "",
        },
      }),
    ]);

    expect(documents).toHaveLength(1);
    expect(documents[0]?.summary).toBe("");
  });

  it("loads wiki documents from a remote endpoint using the shared normalization path", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify(getSnapshotPayload()), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const documents = await loadWikiDocuments({
      mode: "remote",
      endpoint: "https://example.com/wiki.json",
      fetch: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledWith("https://example.com/wiki.json", {
      headers: {
        Accept: "application/json",
      },
    });
    expect(documents).toHaveLength(10);
  });

  it("filters remote records that are not current and published before normalization", () => {
    const archivedRecord = buildRemoteRecord({
      slug: "archived-guide",
      page: {
        ...buildRemoteRecord().page,
        id: "archived-1",
        status: "archived",
      },
    });
    const draftRecord = buildRemoteRecord({
      slug: "draft-guide",
      page: {
        ...buildRemoteRecord().page,
        id: "draft-1",
        metadata: {
          ...buildRemoteRecord().page.metadata,
          status: "draft",
        },
      },
    });
    const opsRecord = buildRemoteRecord({
      slug: "ops-guide",
      page: {
        ...buildRemoteRecord().page,
        id: "ops-1",
        metadata: {
          ...buildRemoteRecord().page.metadata,
          docType: "ops",
        },
      },
    });

    const records = parseRemoteWikiPageRecords({
      pages: [buildRemoteRecord(), archivedRecord, draftRecord, opsRecord],
    });

    expect(records).toHaveLength(1);
    expect(records[0]?.slug).toBe("remote-guide");
  });

  it("keeps ops records available for hidden ops cache only", () => {
    const opsRecord1 = buildRemoteRecord({
      slug: "ops-development-rules",
      page: {
        ...buildRemoteRecord().page,
        id: "ops-1",
        title: "[Ops] Development Rules",
        metadata: {
          ...buildRemoteRecord().page.metadata,
          docType: "ops",
        },
      },
    });
    const opsRecord2 = buildRemoteRecord({
      slug: "ops-internal-rules",
      page: {
        ...buildRemoteRecord().page,
        id: "ops-2",
        title: "[Ops] Internal Rules",
        metadata: {
          ...buildRemoteRecord().page.metadata,
          docType: "ops",
        },
      },
    });

    expect(parseRemoteWikiPageRecords({ pages: [opsRecord1, opsRecord2] })).toEqual([]);
    expect(parseRemoteOpsPageRecords({ pages: [opsRecord1, opsRecord2] }).map((record) => record.slug)).toEqual([
      "ops-development-rules",
      "ops-internal-rules",
    ]);
  });

  it("keeps policy records available for hidden policy cache only", () => {
    const policyRecord = buildPolicyRecord();
    const policyRecord2 = buildPolicyRecord({
      slug: "policy-internal",
      page: {
        ...buildPolicyRecord().page,
        id: "policy-2",
      },
    });

    expect(parseRemoteWikiPageRecords({ pages: [policyRecord, policyRecord2] })).toEqual([]);
    expect(parseRemotePolicyPageRecords({ pages: [policyRecord, policyRecord2] }).map((record) => record.slug)).toEqual([
      "policy-guide",
      "policy-internal",
    ]);
  });

  it("excludes playbook records without throwing and does not expose them to public corpus", () => {
    const playbookRecord = buildRemoteRecord({
      slug: "playbook-log",
      page: {
        ...buildRemoteRecord().page,
        id: "playbook-1",
        title: "Playbook - 2026-05-21",
        metadata: { ...buildRemoteRecord().page.metadata, docType: "playbook" },
      },
    });

    expect(() =>
      parseRemoteWikiPageRecords({ pages: [buildRemoteRecord(), playbookRecord] }),
    ).not.toThrow();

    const records = parseRemoteWikiPageRecords({ pages: [buildRemoteRecord(), playbookRecord] });
    expect(records.map((r) => r.slug)).toEqual(["remote-guide"]);
    expect(records.some((r) => r.slug === "playbook-log")).toBe(false);
  });

  it("builds compact policy documents from hidden policy records", () => {
    const documents = buildPolicyDocumentsFromRecords([buildPolicyRecord()], "policy");

    expect(documents[0]).toMatchObject({
      id: "policy-1",
      title: "[Policy] Answering Rules",
      sourceKind: "policy",
      cacheKey: "policy-1:1:policy",
    });
    expect(documents[0]?.summary.length).toBeGreaterThan(0);
    expect(documents[0]?.contentText).toContain("Remote body");
  });

  it("limits remote records to guide, page, faq, library, and nav pages", () => {
    const pageRecord = buildRemoteRecord({
      slug: "page-example",
      page: {
        ...buildRemoteRecord().page,
        id: "page-1",
        title: "Page Example",
        metadata: { ...buildRemoteRecord().page.metadata, docType: "page" },
      },
    });
    const libraryRecord = buildRemoteRecord({
      slug: "library-reference",
      page: {
        ...buildRemoteRecord().page,
        id: "library-1",
        title: "Library Reference",
        metadata: { ...buildRemoteRecord().page.metadata, docType: "library" },
      },
    });
    const faqRecord = buildRemoteRecord({
      slug: "faq-record",
      page: {
        ...buildRemoteRecord().page,
        id: "faq-1",
        title: "FAQ Record",
        metadata: { ...buildRemoteRecord().page.metadata, docType: "faq" },
      },
    });
    const navRecord = buildRemoteRecord({
      slug: "nav-index",
      page: {
        ...buildRemoteRecord().page,
        id: "nav-1",
        title: "Nav Index",
        metadata: { ...buildRemoteRecord().page.metadata, docType: "nav" },
      },
    });

    const records = parseRemoteWikiPageRecords({
      pages: [buildRemoteRecord(), pageRecord, libraryRecord, faqRecord, navRecord],
    });

    expect(records.map((record) => record.slug)).toEqual([
      "remote-guide",
      "page-example",
      "library-reference",
      "faq-record",
      "nav-index",
    ]);
  });

  it("rejects remote records outside the fixed public wiki space", () => {
    expect(() =>
      parseRemoteWikiPageRecords([
        buildRemoteRecord({
          page: {
            ...buildRemoteRecord().page,
            spaceId: "99999999",
          },
        }),
      ]),
    ).toThrow("outside the public wiki space");
  });

  it("rejects malformed remote payloads before normalization", () => {
    expect(() => parseRemoteWikiPageRecords({ items: [] })).toThrow(
      "array or an object with pages",
    );
  });

  it("returns an empty record list when all records are ops or policy", () => {
    expect(
      parseRemoteWikiPageRecords([
        buildRemoteRecord({
          page: {
            ...buildRemoteRecord().page,
            metadata: {
              ...buildRemoteRecord().page.metadata,
              docType: "ops",
            },
          },
        }),
      ]),
    ).toEqual([]);
  });

  it("surfaces failed remote HTTP responses", async () => {
    const mockFetch = vi.fn(async () =>
      new Response("Not found", {
        status: 404,
      }),
    );

    await expect(
      loadWikiDocuments({
        mode: "remote",
        endpoint: "https://example.com/wiki.json",
        fetch: mockFetch,
      }),
    ).rejects.toThrow("Failed to load wiki documents");
  });
});
