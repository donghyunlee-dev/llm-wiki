import { Badge, List } from "@sfood/ui";
import type { SceneLayout, SemanticBlock } from "@sfood/wiki-core";
import { SemanticBlockList } from "./SemanticBlockRenderer";

type SceneShellProps = {
  typeClassName: string;
  layout: SceneLayout;
  blocks: SemanticBlock[];
  interaction?: { kind: string; steps: string[] };
};

export function SceneShell({ typeClassName, layout, blocks, interaction }: SceneShellProps) {
  // interaction.kind는 지금까지 "step-reveal" 한 종류만 관측됐다. 다른 kind는 이 씬이 표현하려는
  // 바를 아직 모르는 것이므로(예: hotspot-sequence), steps가 있어도 조용히 무시한다 —
  // 잘못 렌더링하는 것보다 안 보여주는 쪽이 안전하다.
  //
  // 실측(21개 step-reveal 씬 중 19개)에서 interaction.steps는 이미 blocks의 visual 블록
  // (customHtml 또는 mermaidDiagram)이 표현하는 내용을 그대로 다시 설명하는 캡션이다(예: 카드
  // 4개짜리 도식 + "지침 공개"/"대화 공개"... 캡션 4개). visual 블록이 있는 씬에서 steps를 또
  // 렌더링하면 같은 내용이 도식 아래 텍스트 리스트로 중복 표시된다. visual 블록이 없는 씬
  // (예: why-claude-main)에서만 콘텐츠 공백을 메우는 폴백으로 표시한다.
  const hasVisualBlock = blocks.some((block) => block.kind === "customHtml" || block.kind === "mermaidDiagram");
  const steps = !hasVisualBlock && interaction?.kind === "step-reveal" ? interaction.steps : undefined;

  return (
    <div className={`lesson-scene ${typeClassName} lesson-scene-layout-${layout}`}>
      <SemanticBlockList blocks={blocks} />
      {steps && steps.length > 0 ? (
        // 이 단계들은 사용자가 진행 중인 위저드가 아니라, 항상 한 번에 모두 보이는 설명용
        // 순서 목록이다(레퍼런스 사이트 실측: reveal:"manual"도 클릭 게이팅 없이 전부 노출).
        // Stepper는 "완료/진행 중" 상태를 표현하는 컴포넌트라 이 의미와 맞지 않아 List로
        // 순서 있는 설명 목록을 표현한다.
        <List
          items={steps.map((step, index) => ({
            id: index,
            primary: step,
            leading: <Badge>{index + 1}</Badge>,
          }))}
        />
      ) : null}
    </div>
  );
}
