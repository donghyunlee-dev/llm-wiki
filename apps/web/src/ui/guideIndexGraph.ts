import {
  getWikiDocumentHref,
  isIndexWikiDocument,
  resolveWikiDocumentsByIdsFrom,
  validateWikiGraphReferencesFrom,
  type WikiDocument,
} from "@sfood/wiki-core";

export type GuideIndexGraphReference = {
  documentId: string;
  documentTitle: string;
  missingId: string;
};

export type GuideIndexGraphGroup = {
  indexDocument: WikiDocument;
  childDocuments: WikiDocument[];
  prerequisiteDocuments: WikiDocument[];
  nextDocuments: WikiDocument[];
  relatedDocuments: WikiDocument[];
};

export type GuideIndexGraphModel = {
  guideDocuments: WikiDocument[];
  indexDocuments: WikiDocument[];
  groups: GuideIndexGraphGroup[];
  orphanDocuments: WikiDocument[];
  missingReferences: GuideIndexGraphReference[];
};

export type GuideGraphNodeKind = "index" | "child" | "prerequisite" | "next" | "related" | "orphan" | "missing";

export type GuideGraphNode = {
  id: string;
  title: string;
  summary: string;
  href?: string;
  groupId?: string;
  kind: GuideGraphNodeKind;
  x: number;
  y: number;
  size: number;
};

export type GuideGraphEdgeKind = "child" | "prerequisite" | "next" | "related" | "orphan" | "missing";

export type GuideGraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: GuideGraphEdgeKind;
};

export type GuideGraphCluster = {
  id: string;
  indexDocument: WikiDocument;
  centerX: number;
  centerY: number;
};

export type GuideIndexGraphLayout = {
  clusters: GuideGraphCluster[];
  nodes: GuideGraphNode[];
  edges: GuideGraphEdge[];
  visibleGroups: GuideIndexGraphGroup[];
  visibleOrphans: WikiDocument[];
  visibleMissingReferences: GuideIndexGraphReference[];
};

export function buildGuideIndexGraphModel(documents: WikiDocument[]): GuideIndexGraphModel {
  const guideDocuments = sortWikiDocuments(
    documents.filter((d) => {
      const dt = d.metadata.docType;
      return dt === "guide" || dt === "page" || dt === "nav";
    }),
  );
  const indexDocuments = guideDocuments.filter(isIndexWikiDocument);
  const groupedIds = new Set<string>();

  const groups = indexDocuments.map((indexDocument) => {
    const childDocuments = uniqueSortedDocuments(
      guideDocuments.filter((document) => document.parentId === indexDocument.id),
    );
    const prerequisiteDocuments = uniqueSortedDocuments(
      resolveWikiDocumentsByIdsFrom(guideDocuments, indexDocument.metadata.prerequisites),
    );
    const nextDocuments = uniqueSortedDocuments(
      resolveWikiDocumentsByIdsFrom(guideDocuments, indexDocument.metadata.next),
    );
    const relatedDocuments = uniqueSortedDocuments(
      resolveWikiDocumentsByIdsFrom(guideDocuments, indexDocument.metadata.related),
    );

    for (const document of [indexDocument, ...childDocuments, ...prerequisiteDocuments, ...nextDocuments, ...relatedDocuments]) {
      groupedIds.add(document.id);
    }

    return {
      indexDocument,
      childDocuments,
      prerequisiteDocuments,
      nextDocuments,
      relatedDocuments,
    };
  });

  const orphanDocuments = guideDocuments.filter(
    (document) => !groupedIds.has(document.id) && !isIndexWikiDocument(document),
  );
  const missingReferences = validateWikiGraphReferencesFrom(guideDocuments).map((reference) => ({
    ...reference,
    documentTitle: guideDocuments.find((document) => document.id === reference.documentId)?.title ?? reference.documentId,
  }));

  return {
    guideDocuments,
    indexDocuments,
    groups,
    orphanDocuments,
    missingReferences,
  };
}

export function buildGuideIndexGraphLayout(
  model: GuideIndexGraphModel,
  query = "",
): GuideIndexGraphLayout {
  const normalizedQuery = normalizeGraphQuery(query);
  const visibleGroups = normalizedQuery
    ? model.groups.filter((group) => matchesGraphQuery(group, normalizedQuery))
    : model.groups;
  const visibleOrphans = normalizedQuery
    ? model.orphanDocuments.filter((document) => matchesDocumentQuery(document, normalizedQuery))
    : model.orphanDocuments;
  const visibleMissingReferences = normalizedQuery
    ? model.missingReferences.filter((reference) => matchesMissingReferenceQuery(reference, normalizedQuery))
    : model.missingReferences;
  const clusters = buildGraphClusters(visibleGroups);
  const nodes: GuideGraphNode[] = [];
  const edges: GuideGraphEdge[] = [];

  for (const cluster of clusters) {
    // index 노드는 엣지 좌표 앵커용으로만 nodes[]에 추가 (kind: "index" → CSS hidden)
    const indexNode: GuideGraphNode = {
      id: cluster.indexDocument.id,
      title: cluster.indexDocument.title,
      summary: cluster.indexDocument.summary,
      groupId: cluster.id,
      kind: "index",
      x: cluster.centerX,
      y: cluster.centerY,
      size: 0,
    };

    nodes.push(indexNode);

    const clusterGroup = visibleGroups.find((group) => group.indexDocument.id === cluster.indexDocument.id);

    if (!clusterGroup) {
      continue;
    }

    const childNodes = placeGraphNodes(cluster, clusterGroup.childDocuments, "child", 11, 1.5);
    const prerequisiteNodes = placeGraphNodes(cluster, clusterGroup.prerequisiteDocuments, "prerequisite", 15, 1.4);
    const nextNodes = placeGraphNodes(cluster, clusterGroup.nextDocuments, "next", 18, 1.4);
    const relatedNodes = placeGraphNodes(cluster, clusterGroup.relatedDocuments, "related", 22, 1.3);

    nodes.push(...childNodes, ...prerequisiteNodes, ...nextNodes, ...relatedNodes);

    for (const node of [...childNodes, ...prerequisiteNodes, ...nextNodes, ...relatedNodes]) {
      edges.push({
        id: `${indexNode.id}-${node.kind}-${node.id}`,
        from: indexNode.id,
        to: node.id,
        kind: node.kind,
      });
    }
  }

  for (const document of visibleOrphans) {
    const cluster = pickOrphanCluster(document, clusters);
    const offset = placeOrbitOffset(visibleOrphans.indexOf(document), visibleOrphans.length, cluster.centerX, cluster.centerY, 28, 7);

    nodes.push({
      id: document.id,
      title: document.title,
      summary: document.summary,
      href: getWikiDocumentHref(document) ?? "#",
      groupId: cluster?.id,
      kind: "orphan",
      x: offset.x,
      y: offset.y,
      size: 1.25,
    });

    if (cluster) {
      edges.push({
        id: `${cluster.indexDocument.id}-orphan-${document.id}`,
        from: cluster.indexDocument.id,
        to: document.id,
        kind: "orphan",
      });
    }
  }

  for (const reference of visibleMissingReferences) {
    const nodeId = `${reference.documentId}::${reference.missingId}`;
    const cluster = clusters.find((item) => item.indexDocument.id === reference.documentId);
    const offset = placeOrbitOffset(visibleMissingReferences.indexOf(reference), visibleMissingReferences.length, cluster?.centerX ?? 82, cluster?.centerY ?? 14, 14, 6);

    nodes.push({
      id: nodeId,
      title: reference.missingId,
      summary: `누락된 참조: ${reference.documentTitle}`,
      kind: "missing",
      x: offset.x,
      y: offset.y,
      size: 1.15,
    });

    if (cluster) {
      edges.push({
        id: `${reference.documentId}-missing-${reference.missingId}`,
        from: cluster.indexDocument.id,
        to: nodeId,
        kind: "missing",
      });
    }
  }

  return {
    clusters,
    nodes: sortGraphNodes(nodes),
    edges,
    visibleGroups,
    visibleOrphans,
    visibleMissingReferences,
  };
}

function uniqueSortedDocuments(documents: WikiDocument[]) {
  const seen = new Set<string>();

  return sortWikiDocuments(
    documents.filter((document) => {
      if (seen.has(document.id)) {
        return false;
      }

      seen.add(document.id);
      return true;
    }),
  );
}

function sortWikiDocuments(documents: WikiDocument[]) {
  return [...documents].sort((first, second) => {
    const updated = second.updatedAt.localeCompare(first.updatedAt);

    if (updated !== 0) {
      return updated;
    }

    return first.title.localeCompare(second.title, "ko-KR");
  });
}

function buildGraphClusters(groups: GuideIndexGraphGroup[]) {
  const count = groups.length;
  const columns = count <= 2 ? Math.max(count, 1) : 2;
  const rows = Math.max(Math.ceil(count / columns), 1);

  return groups.map((group, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const centerX = columns === 1 ? 50 : 22 + (col * 56) / Math.max(columns - 1, 1);
    const centerY = rows === 1 ? 50 : 18 + (row * 60) / Math.max(rows - 1, 1);

    return {
      id: group.indexDocument.id,
      indexDocument: group.indexDocument,
      centerX,
      centerY,
    };
  });
}

function placeGraphNodes(
  cluster: GuideGraphCluster,
  documents: WikiDocument[],
  kind: Exclude<GuideGraphNodeKind, "index" | "orphan" | "missing">,
  radius: number,
  size: number,
) {
  if (!documents.length) {
    return [];
  }

  return documents.map((document, index) => {
    const angle = (-90 + (index * 360) / documents.length) * (Math.PI / 180);
    const x = clamp(cluster.centerX + Math.cos(angle) * radius, 7, 93);
    const y = clamp(cluster.centerY + Math.sin(angle) * radius, 9, 89);

    return {
      id: document.id,
      title: document.title,
      summary: document.summary,
      href: getWikiDocumentHref(document) ?? "#",
      groupId: cluster.id,
      kind,
      x,
      y,
      size,
    };
  });
}

function sortGraphNodes(nodes: GuideGraphNode[]) {
  const order: Record<GuideGraphNodeKind, number> = {
    index: 0,
    child: 1,
    prerequisite: 2,
    next: 3,
    related: 4,
    orphan: 5,
    missing: 6,
  };

  return [...nodes].sort((first, second) => {
    const kind = order[first.kind] - order[second.kind];

    if (kind !== 0) {
      return kind;
    }

    return first.title.localeCompare(second.title, "ko-KR");
  });
}

function normalizeGraphQuery(query: string) {
  return query.trim().toLocaleLowerCase("ko-KR");
}

function matchesGraphQuery(group: GuideIndexGraphGroup, query: string) {
  return [
    group.indexDocument.title,
    group.indexDocument.summary,
    group.indexDocument.slug,
    ...group.childDocuments.flatMap((document) => [document.title, document.summary, document.slug]),
    ...group.prerequisiteDocuments.flatMap((document) => [document.title, document.summary, document.slug]),
    ...group.nextDocuments.flatMap((document) => [document.title, document.summary, document.slug]),
    ...group.relatedDocuments.flatMap((document) => [document.title, document.summary, document.slug]),
  ].join(" ").toLocaleLowerCase("ko-KR").includes(query);
}

function matchesDocumentQuery(document: WikiDocument, query: string) {
  return [document.title, document.summary, document.slug].join(" ").toLocaleLowerCase("ko-KR").includes(query);
}

function matchesMissingReferenceQuery(reference: GuideIndexGraphReference, query: string) {
  return [reference.documentTitle, reference.missingId].join(" ").toLocaleLowerCase("ko-KR").includes(query);
}

function pickOrphanCluster(document: WikiDocument, clusters: GuideGraphCluster[]) {
  const parentCluster = clusters.find((cluster) => cluster.indexDocument.id === document.parentId);

  if (parentCluster) {
    return parentCluster;
  }

  return clusters[0];
}

function placeOrbitOffset(
  index: number,
  total: number,
  centerX: number,
  centerY: number,
  baseRadius: number,
  stepRadius: number,
) {
  const safeTotal = Math.max(total, 1);
  const ringSize = Math.max(Math.min(safeTotal, 8), 1);
  const ring = Math.floor(index / ringSize);
  const position = index % ringSize;
  const angle = ((position / ringSize) * 360 - 90 + ring * 16) * (Math.PI / 180);
  const radius = baseRadius + ring * stepRadius;

  return {
    x: clamp(centerX + Math.cos(angle) * radius, 8, 92),
    y: clamp(centerY + Math.sin(angle) * radius, 10, 86),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
