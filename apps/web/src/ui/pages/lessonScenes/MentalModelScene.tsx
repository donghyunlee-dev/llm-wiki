import type { SceneLayout, SemanticBlock } from "@sfood/wiki-core";
import { SceneShell } from "./SceneShell";

export function MentalModelScene({ layout, blocks }: { layout: SceneLayout; blocks: SemanticBlock[] }) {
  return <SceneShell typeClassName="lesson-scene-mental-model" layout={layout} blocks={blocks} />;
}
