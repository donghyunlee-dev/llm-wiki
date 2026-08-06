import type { SceneLayout, SemanticBlock } from "@sfood/wiki-core";
import { SceneShell } from "./SceneShell";

export function SummaryScene({ layout, blocks }: { layout: SceneLayout; blocks: SemanticBlock[] }) {
  return <SceneShell typeClassName="lesson-scene-summary" layout={layout} blocks={blocks} />;
}
