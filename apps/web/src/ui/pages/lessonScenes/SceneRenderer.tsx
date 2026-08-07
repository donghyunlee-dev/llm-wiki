import type { SceneLayout, SceneType, SemanticBlock } from "@sfood/wiki-core";
import type { ReactElement } from "react";
import { ClosingScene } from "./ClosingScene";
import { ComparisonScene } from "./ComparisonScene";
import { ConceptScene } from "./ConceptScene";
import { ExampleScene } from "./ExampleScene";
import { HookScene } from "./HookScene";
import { KnowledgeCheckScene } from "./KnowledgeCheckScene";
import { MentalModelScene } from "./MentalModelScene";
import { MisconceptionScene } from "./MisconceptionScene";
import { ProcessScene } from "./ProcessScene";
import { ScreenshotScene } from "./ScreenshotScene";
import { SummaryScene } from "./SummaryScene";

type SceneComponentProps = {
  layout: SceneLayout;
  blocks: SemanticBlock[];
  interaction?: { kind: string; steps: string[] };
};

const SCENE_COMPONENTS: Record<SceneType, (props: SceneComponentProps) => ReactElement> = {
  hook: HookScene,
  "mental-model": MentalModelScene,
  concept: ConceptScene,
  process: ProcessScene,
  comparison: ComparisonScene,
  example: ExampleScene,
  screenshot: ScreenshotScene,
  misconception: MisconceptionScene,
  "knowledge-check": KnowledgeCheckScene,
  summary: SummaryScene,
  closing: ClosingScene,
};

export function SceneRenderer({
  type,
  layout,
  blocks,
  interaction,
}: {
  type: SceneType;
  layout: SceneLayout;
  blocks: SemanticBlock[];
  interaction?: { kind: string; steps: string[] };
}) {
  const Component = SCENE_COMPONENTS[type];
  return <Component layout={layout} blocks={blocks} interaction={interaction} />;
}
