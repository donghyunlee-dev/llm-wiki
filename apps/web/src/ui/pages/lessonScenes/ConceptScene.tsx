import type { SceneLayout, SemanticBlock } from "@sfood/wiki-core";
import { SceneShell } from "./SceneShell";

export function ConceptScene({ layout, blocks }: { layout: SceneLayout; blocks: SemanticBlock[] }) {
  return <SceneShell typeClassName="lesson-scene-concept" layout={layout} blocks={blocks} />;
}
