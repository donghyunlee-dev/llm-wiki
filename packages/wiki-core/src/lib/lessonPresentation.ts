import type {
  LessonPresentationBlock,
  LessonPresentationDocument,
  LessonPresentationScene,
  SceneLayout,
  SceneType,
  SemanticBlock,
} from "./lessonSemanticBlocks";

export type LessonScene = {
  id: string;
  title: string;
  scriptHtml?: string;
  blocks: SemanticBlock[];
  type: SceneType;
  layout: SceneLayout;
  motion?: string;
  interaction?: { kind: string; steps: string[] };
  transitionToNext?: string;
};

/**
 * `lesson.presentation` Content Property(신규 콘텐츠 스키마)를 내부 Scene 모델로 변환한다.
 * 기존 H2 헤딩 기반 `bodyHtml` 파서(`lessonScenes.ts`, 제거됨)를 대체 — 이제 `bodyHtml`은
 * Confluence 편집기에서 사람이 읽기 위한 미러 텍스트일 뿐, 파싱하지 않는다.
 *
 * `LessonPresentationScene.reveal`은 의도적으로 옮기지 않는다 — 참고 사이트
 * (sfood-ai-education.leedh84.chatgpt.site) 실측 확인 결과 `reveal: "manual"`이 있는 Scene도
 * 클릭 게이팅 없이 진입 즉시 모든 블록을 보여준다. 클릭 게이팅은 이 스키마에 연결하지 않는다.
 */
export function compileLessonPresentationScenes(document: LessonPresentationDocument): LessonScene[] {
  return document.scenes.map(compileScene);
}

function compileScene(scene: LessonPresentationScene): LessonScene {
  const blocks = scene.blocks
    .map(compileBlock)
    .filter((block): block is SemanticBlock => block !== null);

  return {
    id: scene.sceneId,
    // 실측 데이터에서는 `anchor`가 사실상 페이지 제목과 동일한 문장이지만, Scene 자체에
    // 속한 필드를 쓰는 것이 더 정확하다(한 레슨에 여러 Scene이 생기면 서로 구분된다).
    title: scene.anchor,
    blocks,
    type: scene.type,
    layout: scene.layout,
    ...(scene.narration ? { scriptHtml: buildScriptHtml(scene.narration) } : {}),
    ...(scene.motion ? { motion: scene.motion } : {}),
    ...(scene.interaction ? { interaction: scene.interaction } : {}),
    ...(scene.transitionToNext ? { transitionToNext: scene.transitionToNext } : {}),
  };
}

function compileBlock(block: LessonPresentationBlock): SemanticBlock | null {
  if ("content" in block) {
    if (block.kind === "hook") {
      return { kind: "hookStatement", html: escapeHtmlText(block.content) };
    }

    if (block.kind === "explanation") {
      return { kind: "paragraph", html: escapeHtmlText(block.content) };
    }

    return { kind: "exampleNote", html: escapeHtmlText(block.content) };
  }

  if ("html" in block) {
    return { kind: "customHtml", html: block.html, css: block.css };
  }

  if ("mermaid" in block) {
    return { kind: "mermaidDiagram", definition: block.mermaid };
  }

  // 스키마가 향후 새 kind를 추가할 수 있다 — 크래시 없이 조용히 무시한다(AC7).
  return null;
}

// 원문 narration은 문장 구분 없이 한 덩어리 텍스트로 저장돼 있다 — 문장 종결부호(. ? !) 뒤에서
// 나눠 문단 단위로 보여줘야 사람이 읽기 편하다.
function buildScriptHtml(narration: string): string {
  return splitIntoSentences(narration)
    .map((sentence) => `<p>${escapeHtmlText(sentence)}</p>`)
    .join("");
}

// 정규식 기반 분리는 소수점(3.14)이나 종결부호 뒤 공백이 없는 문장("A.B?C!")에서
// 글자를 통째로 잘라먹는 문제가 있어, 한 글자씩 훑으며 소수점만 예외 처리한다.
function splitIntoSentences(text: string): string[] {
  const trimmed = text.trim();

  if (!trimmed) {
    return [];
  }

  const sentences: string[] = [];
  let current = "";

  for (let i = 0; i < trimmed.length; i += 1) {
    const char = trimmed[i];
    current += char;

    const isTerminator = char === "." || char === "!" || char === "?";
    const isDecimalPoint = char === "." && /\d/.test(trimmed[i - 1] ?? "") && /\d/.test(trimmed[i + 1] ?? "");

    if (isTerminator && !isDecimalPoint) {
      sentences.push(current.trim());
      current = "";
    }
  }

  if (current.trim()) {
    sentences.push(current.trim());
  }

  return sentences;
}

function escapeHtmlText(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
