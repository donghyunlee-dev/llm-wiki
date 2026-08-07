import type { SceneLayout, SemanticBlock } from "@sfood/wiki-core";
import { SceneShell } from "./SceneShell";

export function ExampleScene({ layout, blocks, interaction }: {
  layout: SceneLayout;
  blocks: SemanticBlock[];
  interaction?: { kind: string; steps: string[] };
}) {
  return <SceneShell typeClassName="lesson-scene-example" layout={layout} blocks={blocks} interaction={interaction} />;
}
