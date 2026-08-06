import type { SceneLayout, SemanticBlock } from "@sfood/wiki-core";
import { SceneShell } from "./SceneShell";

export function KnowledgeCheckScene({ layout, blocks }: { layout: SceneLayout; blocks: SemanticBlock[] }) {
  return <SceneShell typeClassName="lesson-scene-knowledge-check" layout={layout} blocks={blocks} />;
}
