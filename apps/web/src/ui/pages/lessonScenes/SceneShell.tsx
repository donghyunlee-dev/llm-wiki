import type { SceneLayout, SemanticBlock } from "@sfood/wiki-core";
import { SemanticBlockList } from "./SemanticBlockRenderer";

type SceneShellProps = {
  typeClassName: string;
  layout: SceneLayout;
  blocks: SemanticBlock[];
};

export function SceneShell({ typeClassName, layout, blocks }: SceneShellProps) {
  return (
    <div className={`lesson-scene ${typeClassName} lesson-scene-layout-${layout}`}>
      <SemanticBlockList blocks={blocks} />
    </div>
  );
}
