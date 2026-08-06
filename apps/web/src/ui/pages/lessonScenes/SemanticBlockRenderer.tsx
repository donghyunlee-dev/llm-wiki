import type { SemanticBlock } from "@sfood/wiki-core";
import { CustomHtmlDiagramBlock } from "./CustomHtmlDiagramBlock";

export function SemanticBlockList({ blocks }: { blocks: SemanticBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        <SemanticBlockView key={index} block={block} />
      ))}
    </>
  );
}

function SemanticBlockView({ block }: { block: SemanticBlock }) {
  switch (block.kind) {
    case "paragraph":
      return <p className="lesson-block-paragraph" dangerouslySetInnerHTML={{ __html: block.html }} />;
    case "customHtml":
      return <CustomHtmlDiagramBlock html={block.html} css={block.css} />;
    case "hookStatement":
      return <p className="lesson-block-hook-statement" dangerouslySetInnerHTML={{ __html: block.html }} />;
    case "exampleNote":
      return <p className="lesson-block-example-note" dangerouslySetInnerHTML={{ __html: block.html }} />;
    default:
      return null;
  }
}
