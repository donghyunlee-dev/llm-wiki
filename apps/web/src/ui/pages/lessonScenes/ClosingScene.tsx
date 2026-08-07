import type { SceneLayout, SemanticBlock } from "@sfood/wiki-core";
import { SceneShell } from "./SceneShell";

export function ClosingScene({ layout, blocks, interaction }: {
  layout: SceneLayout;
  blocks: SemanticBlock[];
  interaction?: { kind: string; steps: string[] };
}) {
  return <SceneShell typeClassName="lesson-scene-closing" layout={layout} blocks={blocks} interaction={interaction} />;
}
