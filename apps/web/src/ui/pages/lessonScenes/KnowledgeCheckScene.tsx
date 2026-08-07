import type { SceneLayout, SemanticBlock } from "@sfood/wiki-core";
import { SceneShell } from "./SceneShell";

export function KnowledgeCheckScene({ layout, blocks, interaction }: {
  layout: SceneLayout;
  blocks: SemanticBlock[];
  interaction?: { kind: string; steps: string[] };
}) {
  return <SceneShell typeClassName="lesson-scene-knowledge-check" layout={layout} blocks={blocks} interaction={interaction} />;
}
