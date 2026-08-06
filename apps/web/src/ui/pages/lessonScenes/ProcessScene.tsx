import type { SceneLayout, SemanticBlock } from "@sfood/wiki-core";
import { SceneShell } from "./SceneShell";

export function ProcessScene({ layout, blocks }: { layout: SceneLayout; blocks: SemanticBlock[] }) {
  return <SceneShell typeClassName="lesson-scene-process" layout={layout} blocks={blocks} />;
}
