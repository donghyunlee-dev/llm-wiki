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
    category: "guides",
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
        docType: "tutorial",
        visibility: "public",
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
    category: "library",
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

    expect(documents).toHaveLength(7);
    expect(documents[0]?.title).toBe("Agent 시작하기");
  });

  it("builds wiki documents from remote page arrays", () => {
    const documents = buildWikiDocumentsFromPayload([buildRemoteRecord()]);

    expect(documents).toHaveLength(1);
    expect(documents[0]).toMatchObject({
      id: "remote-1",
      parentId: "root-1",
      slug: "remote-guide",
      category: "guides",
      title: "Remote Guide",
    });
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
    expect(documents).toHaveLength(7);
    expect(documents.every((document) => document.metadata.visibility === "public")).toBe(true);
  });

  it("filters remote records that are not public, current, and published before normalization", () => {
    const internalRecord = buildRemoteRecord({
      slug: "internal-guide",
      page: {
        ...buildRemoteRecord().page,
        id: "internal-1",
        metadata: {
          ...buildRemoteRecord().page.metadata,
          visibility: "internal",
        },
      },
    });
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
      pages: [buildRemoteRecord(), internalRecord, archivedRecord, draftRecord, opsRecord],
    });

    expect(records).toHaveLength(1);
    expect(records[0]?.slug).toBe("remote-guide");
  });

  it("keeps ops records available for hidden policy cache only", () => {
    const publicOpsRecord = buildRemoteRecord({
      category: "library",
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
    const internalOpsRecord = buildRemoteRecord({
      category: "library",
      slug: "ops-internal-rules",
      page: {
        ...buildRemoteRecord().page,
        id: "ops-2",
        title: "[Ops] Internal Rules",
        metadata: {
          ...buildRemoteRecord().page.metadata,
          docType: "ops",
          visibility: "internal",
        },
      },
    });

    expect(parseRemoteWikiPageRecords({ pages: [publicOpsRecord, internalOpsRecord] })).toEqual([]);
    expect(parseRemoteOpsPageRecords({ pages: [publicOpsRecord, internalOpsRecord] }).map((record) => record.slug)).toEqual([
      "ops-development-rules",
      "ops-internal-rules",
    ]);
  });

  it("keeps policy records available for hidden policy cache only", () => {
    const policyRecord = buildPolicyRecord();
    const internalPolicyRecord = buildPolicyRecord({
      slug: "policy-internal",
      page: {
        ...buildPolicyRecord().page,
        id: "policy-2",
        metadata: {
          ...buildPolicyRecord().page.metadata,
          visibility: "internal",
        },
      },
    });

    expect(parseRemoteWikiPageRecords({ pages: [policyRecord, internalPolicyRecord] })).toEqual([]);
    expect(parseRemotePolicyPageRecords({ pages: [policyRecord, internalPolicyRecord] }).map((record) => record.slug)).toEqual([
      "policy-guide",
      "policy-internal",
    ]);
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

  it("limits remote records to guide, project, FAQ, and Playbook pages", () => {
    const projectRecord = buildRemoteRecord({
      category: "projects",
      slug: "project-example",
      page: {
        ...buildRemoteRecord().page,
        id: "project-1",
        title: "Project Example",
        metadata: {
          ...buildRemoteRecord().page.metadata,
          docType: "example",
        },
      },
    });
    const libraryRecord = buildRemoteRecord({
      category: "library",
      slug: "library-reference",
      page: {
        ...buildRemoteRecord().page,
        id: "library-1",
        title: "Library Reference",
        metadata: {
          ...buildRemoteRecord().page.metadata,
          docType: "reference",
        },
      },
    });
    const faqRecord = buildRemoteRecord({
      category: "faq",
      slug: "faq-record",
      page: {
        ...buildRemoteRecord().page,
        id: "faq-1",
        title: "FAQ Record",
        metadata: {
          ...buildRemoteRecord().page.metadata,
          docType: "troubleshooting",
        },
      },
    });
    const playbookRecord = buildRemoteRecord({
      category: "library",
      slug: "playbook",
      page: {
        ...buildRemoteRecord().page,
        id: "playbook-1",
        title: "Playbook",
        metadata: {
          ...buildRemoteRecord().page.metadata,
          docType: "reference",
        },
      },
    });
    const onboardingRecord = buildRemoteRecord({
      category: "guides",
      slug: "onboarding-index",
      page: {
        ...buildRemoteRecord().page,
        id: "onboarding-1",
        title: "Onboarding Index",
      },
    });
    const onboardingQaRecord = buildRemoteRecord({
      category: "guides",
      slug: "s3-003-도구는-어떻게-연결해요",
      page: {
        ...buildRemoteRecord().page,
        id: "onboarding-qa-1",
        title: "[s3-003] 도구는 어떻게 연결해요?",
      },
    });

    const records = parseRemoteWikiPageRecords({
      pages: [
        buildRemoteRecord(),
        projectRecord,
        libraryRecord,
        faqRecord,
        playbookRecord,
        onboardingRecord,
        onboardingQaRecord,
      ],
    });

    expect(records.map((record) => record.slug)).toEqual([
      "remote-guide",
      "project-example",
      "faq-record",
      "playbook",
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

  it("returns an empty record list when no remote documents are visible", () => {
    expect(
      parseRemoteWikiPageRecords([
        buildRemoteRecord({
          page: {
            ...buildRemoteRecord().page,
            metadata: {
              ...buildRemoteRecord().page.metadata,
              visibility: "internal",
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
