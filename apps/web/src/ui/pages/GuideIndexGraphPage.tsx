import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { stripTitleTypePrefix } from "@sfood/wiki-core";
import { useWikiData } from "../../data/WikiDataProvider";
import {
  buildGuideIndexGraphLayout,
  buildGuideIndexGraphModel,
  type GuideGraphNode,
  type GuideGraphNodeKind,
  type GuideIndexGraphLayout,
} from "../guideIndexGraph";
import { WikiStatePanel } from "./WikiStatePanel";

type NodeState =
  | "overview-index"
  | "focused-index"
  | "dimmed-index"
  | "visible-child"
  | "hidden";

function getNodeState(node: GuideGraphNode, _expandedGroupId: string | null): NodeState {
  if (node.kind === "index" || node.kind === "orphan" || node.kind === "missing") return "hidden";
  return "visible-child";
}

/**
 * [PREFIX] 페이지명 형식에서 원 안에 표시할 약어와 아래 표시할 이름을 분리한다.
 * prefix가 없으면 첫 글자를 약어로 쓰고 전체 제목을 이름으로 사용한다.
 */
function parseNodeLabel(
  title: string,
  kind: GuideGraphNodeKind,
): { abbrev: string; name: string } {
  const match = title.match(/^\[([^\]]+)\]\s*(.+)/);
  const maxAbbrev = kind === "index" ? 2 : 1;

  if (match) {
    const prefix = match[1].trim();
    const abbrev = prefix.length <= maxAbbrev ? prefix : prefix.slice(0, maxAbbrev);
    return { abbrev, name: match[2].trim() };
  }

  return { abbrev: title.charAt(0), name: title };
}

export function GuideIndexGraphPage() {
  const { documents, errorMessage, isLoading } = useWikiData();
  const [query, setQuery] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const graph = useMemo(() => buildGuideIndexGraphModel(documents), [documents]);
  const layout = useMemo(() => buildGuideIndexGraphLayout(graph, query), [graph, query]);

  const expandedGroup = useMemo(
    () =>
      expandedGroupId
        ? (layout.visibleGroups.find((g) => g.indexDocument.id === expandedGroupId) ?? null)
        : null,
    [layout.visibleGroups, expandedGroupId],
  );

  function handleToggle(nodeId: string) {
    setExpandedGroupId((prev) => (prev === nodeId ? null : nodeId));
  }

  if (isLoading) {
    return (
      <WikiStatePanel
        title="문서 지도를 불러오는 중"
        body="캐시에 올라온 guide 문서 구조를 읽어오는 중입니다."
      />
    );
  }

  if (errorMessage) {
    return (
      <WikiStatePanel
        title="문서 지도를 불러오지 못했습니다"
        body={errorMessage}
        tone="error"
      />
    );
  }

  return (
    <div className="page-shell">
      <div className="guide-graph-outer">
        {/* Header card */}
        <div className="guide-graph-header">
          <Link className="text-link" to="/guides">
            ← 가이드 목록
          </Link>

          <div className="guide-graph-header-body">
            <div>
              <p className="eyebrow">문서 지도</p>
              <h1 className="title-hero mt-2">가이드 인덱스 그래프</h1>
              <p className="body-copy mt-3">
                가이드 문서 간의 연결 구조를 시각화합니다. 각 노드를 클릭하면 해당 문서로 이동합니다.
              </p>
            </div>

            <div className="guide-graph-header-controls">
              <div className="guide-graph-stats">
                <GraphStat label="가이드" value={graph.guideDocuments.length} />
                <GraphStat label="index" value={graph.indexDocuments.length} />
                <GraphStat label="고립" value={graph.orphanDocuments.length} variant="warn" />
                <GraphStat label="끊김" value={graph.missingReferences.length} variant="danger" />
              </div>

              <label className="guide-graph-search">
                <span className="guide-graph-search-label">검색</span>
                <input
                  className="control-input guide-graph-search-input"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setExpandedGroupId(null);
                  }}
                  placeholder="문서명 · index · 연결 ID"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Focus bar — 선택된 index 정보 */}
        {expandedGroup ? (
          <div className="guide-graph-focus-bar">
            <div className="guide-graph-focus-bar-info">
              <span className="guide-graph-focus-bar-label">선택된 index</span>
              <span className="guide-graph-focus-bar-title">
                {stripTitleTypePrefix(expandedGroup.indexDocument.title)}
              </span>
            </div>
            <div className="guide-graph-focus-bar-meta">
              <span className="guide-graph-focus-bar-count">
                하위 {expandedGroup.childDocuments.length}
              </span>
              <span className="guide-graph-focus-bar-count">
                선행·다음{" "}
                {expandedGroup.prerequisiteDocuments.length + expandedGroup.nextDocuments.length}
              </span>
              <span className="guide-graph-focus-bar-count">
                관련 {expandedGroup.relatedDocuments.length}
              </span>
            </div>
            <div className="guide-graph-focus-bar-actions">
              <Link
                to={`/guides/${expandedGroup.indexDocument.slug}`}
                target="_blank"
                rel="noreferrer"
                className="guide-graph-open-button"
              >
                문서 열기
              </Link>
              <button
                type="button"
                className="guide-graph-reset-button"
                onClick={() => setExpandedGroupId(null)}
              >
                ← 전체 보기
              </button>
            </div>
          </div>
        ) : null}

        {/* Graph canvas */}
        <GraphCanvas
          nodes={layout.nodes}
          edges={layout.edges}
          expandedGroupId={expandedGroupId}
          onToggle={handleToggle}
          hasIndexNodes={graph.indexDocuments.length > 0}
        />

        {/* Legend */}
        <div className="guide-graph-legend">
          {(
            [
              ["child", "하위 문서"],
              ["next", "선행 · 다음"],
              ["related", "관련 문서"],
            ] as const
          ).map(([kind, label]) => (
            <div key={kind} className="guide-graph-legend-item">
              <span className={`guide-graph-legend-dot guide-graph-legend-dot-${kind}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GraphStat({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: "warn" | "danger";
}) {
  return (
    <div className="guide-graph-stat">
      <span className="guide-graph-stat-label">{label}</span>
      <strong
        className={["guide-graph-stat-value", variant ? `guide-graph-stat-value-${variant}` : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </strong>
    </div>
  );
}

function GraphCanvas({
  nodes,
  edges,
  expandedGroupId,
  onToggle,
  hasIndexNodes,
}: {
  nodes: GuideGraphNode[];
  edges: GuideIndexGraphLayout["edges"];
  expandedGroupId: string | null;
  onToggle: (id: string) => void;
  hasIndexNodes: boolean;
}) {
  const visibleEdges = edges.filter((e) => {
    const target = nodes.find((n) => n.id === e.to);
    return target && target.kind !== "index" && target.kind !== "orphan" && target.kind !== "missing";
  });

  return (
    <div className="guide-graph-board">
      {!hasIndexNodes && (
        <div className="guide-graph-empty">
          <p className="guide-graph-empty-title">표시할 그래프가 없습니다.</p>
          <p className="guide-graph-empty-body">
            검색 조건을 지우거나 다른 키워드를 입력해 보세요.
          </p>
        </div>
      )}

      {/* SVG edges — pointer-events: none via CSS */}
      <svg
        aria-hidden="true"
        className="guide-graph-links"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {visibleEdges.map((edge) => {
          const src = nodes.find((n) => n.id === edge.from);
          const dst = nodes.find((n) => n.id === edge.to);
          if (!src || !dst) return null;
          return (
            <line
              key={edge.id}
              x1={src.x}
              y1={src.y}
              x2={dst.x}
              y2={dst.y}
              className={`guide-graph-edge guide-graph-edge-${edge.kind}`}
            />
          );
        })}
      </svg>

      {nodes.map((node) => (
        <GraphNode
          key={node.id}
          node={node}
          nodeState={getNodeState(node, expandedGroupId)}
          onToggle={onToggle}
        />
      ))}

    </div>
  );
}

function GraphNode({
  node,
  nodeState,
  onToggle,
}: {
  node: GuideGraphNode;
  nodeState: NodeState;
  onToggle: (id: string) => void;
}) {
  const isIndex = node.kind === "index";
  const { abbrev, name } = parseNodeLabel(node.title, node.kind);

  const nodeSize =
    nodeState === "overview-index"
      ? "3rem"
      : nodeState === "focused-index"
        ? "2.8rem"
        : `${node.size}rem`;

  const style = {
    left: `${node.x}%`,
    top: `${node.y}%`,
    width: nodeSize,
    height: nodeSize,
  } as const;

  const cls = `guide-graph-node guide-graph-node-${node.kind}`;

  const inner = (
    <>
      <span className="guide-graph-node-core">
        <span className="guide-graph-node-abbrev">{abbrev}</span>
      </span>
      <span className="guide-graph-node-caption">{name}</span>
    </>
  );

  if (isIndex) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={cls}
        data-state={nodeState}
        style={style}
        title={`${node.title} — 클릭하여 확장`}
        aria-label={node.title}
        onClick={() => onToggle(node.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(node.id);
          }
        }}
      >
        {inner}
      </div>
    );
  }

  if (!node.href) {
    return (
      <div
        className={cls}
        data-state={nodeState}
        style={style}
        title={node.summary}
        aria-label={node.title}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={node.href}
      target="_blank"
      rel="noreferrer"
      className={cls}
      data-state={nodeState}
      style={style}
      title={node.title}
      aria-label={node.title}
    >
      {inner}
    </Link>
  );
}
