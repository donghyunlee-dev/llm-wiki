export type SceneType =
  | "hook"
  | "mental-model"
  | "concept"
  | "process"
  | "comparison"
  | "example"
  | "screenshot"
  | "misconception"
  | "knowledge-check"
  | "summary"
  | "closing";
export type SceneLayout =
  | "focus"
  | "visual-split"
  | "horizontal-flow"
  | "side-by-side"
  | "timeline"
  | "grid"
  | "full-visual"
  | "screenshot-hotspot";

// 런타임 검증용(JSON에서 읽은 값이 유효한 SceneType/SceneLayout인지 확인) —
// confluenceClient.ts(원격 Confluence 응답)와 wikiDataSource.ts(우리 백엔드가 돌려준
// JSON 재검증) 양쪽에서 공유해 두 경로의 검증 규칙이 어긋나지 않게 한다.
export const SCENE_TYPES: ReadonlySet<SceneType> = new Set([
  "hook",
  "mental-model",
  "concept",
  "process",
  "comparison",
  "example",
  "screenshot",
  "misconception",
  "knowledge-check",
  "summary",
  "closing",
]);
export const SCENE_LAYOUTS: ReadonlySet<SceneLayout> = new Set([
  "focus",
  "visual-split",
  "horizontal-flow",
  "side-by-side",
  "timeline",
  "grid",
  "full-visual",
  "screenshot-hotspot",
]);

export type SemanticBlock =
  | { kind: "paragraph"; html: string }
  | { kind: "customHtml"; html: string; css?: string }
  | { kind: "mermaidDiagram"; definition: string }
  | { kind: "hookStatement"; html: string }
  | { kind: "exampleNote"; html: string };

// lesson.presentation Content Property(신규 콘텐츠 스키마) — 실측 23개 레슨 문서 기준.
// docs/tasks/lesson-presentation-schema-migration/spec.md 참고.
export type LessonPresentationDocument = {
  schemaVersion: 1;
  lessonId: string;
  theme: string;
  scenes: LessonPresentationScene[];
};

export type LessonPresentationScene = {
  sceneId: string;
  anchor: string;
  type: SceneType;
  layout: SceneLayout;
  motion?: string;
  reveal?: "manual";
  narration: string;
  blocks: LessonPresentationBlock[];
  interaction?: { kind: string; steps: string[] };
  completionEvidence?: string;
  transitionToNext?: string;
};

export type LessonPresentationBlock =
  | { order: number; kind: "hook" | "explanation" | "example"; content: string }
  | { order: number; kind: "visual"; visualKind?: string; purpose?: string; html: string; css: string }
  | { order: number; kind: "visual"; visualKind?: string; purpose?: string; mermaid: string }
  | { order: number; kind: string };

const LESSON_PRESENTATION_SCHEMA_VERSION = 1;

/**
 * `lesson.presentation` Content Property를 파싱한다. `confluenceClient.ts`(원격 Confluence
 * 응답)와 `wikiDataSource.ts`(우리 백엔드가 돌려준 JSON 재검증) 양쪽에서 이 함수를 그대로
 * 재사용한다 — 예전에 두 파일이 각자 필드를 따로 옮기다 한쪽이 통째로 빠뜨린 적이 있어(코드
 * 리뷰로 발견), 검증 로직 자체를 한 곳에만 둔다. 스키마 버전이 다르면 전체를 버린다(크래시
 * 대신 조용히 제외 — 해당 레슨은 `listLessonDocumentsFrom`에서 자동으로 목록 제외된다).
 */
export function readLessonPresentationValue(value: unknown): LessonPresentationDocument | undefined {
  if (
    !isLessonRecord(value) ||
    value.schemaVersion !== LESSON_PRESENTATION_SCHEMA_VERSION ||
    typeof value.lessonId !== "string" ||
    !value.lessonId.trim() ||
    typeof value.theme !== "string" ||
    !Array.isArray(value.scenes)
  ) {
    return undefined;
  }

  const scenes = value.scenes
    .map(readLessonPresentationScene)
    .filter((scene): scene is LessonPresentationScene => scene !== undefined);

  if (scenes.length === 0) {
    return undefined;
  }

  return {
    schemaVersion: LESSON_PRESENTATION_SCHEMA_VERSION,
    lessonId: value.lessonId,
    theme: value.theme,
    scenes,
  };
}

function readLessonPresentationScene(value: unknown): LessonPresentationScene | undefined {
  if (
    !isLessonRecord(value) ||
    typeof value.sceneId !== "string" ||
    !value.sceneId.trim() ||
    typeof value.anchor !== "string" ||
    !SCENE_TYPES.has(value.type as SceneType) ||
    !SCENE_LAYOUTS.has(value.layout as SceneLayout) ||
    typeof value.narration !== "string" ||
    !Array.isArray(value.blocks)
  ) {
    return undefined;
  }

  const blocks = value.blocks
    .map(readLessonPresentationBlock)
    .filter((block): block is LessonPresentationBlock => block !== undefined)
    .sort((a, b) => a.order - b.order);
  const interaction = readLessonInteraction(value.interaction);

  return {
    sceneId: value.sceneId,
    anchor: value.anchor,
    type: value.type as SceneType,
    layout: value.layout as SceneLayout,
    narration: value.narration,
    blocks,
    ...(typeof value.motion === "string" ? { motion: value.motion } : {}),
    ...(value.reveal === "manual" ? { reveal: "manual" as const } : {}),
    ...(interaction ? { interaction } : {}),
    ...(typeof value.completionEvidence === "string" ? { completionEvidence: value.completionEvidence } : {}),
    ...(typeof value.transitionToNext === "string" ? { transitionToNext: value.transitionToNext } : {}),
  };
}

function readLessonInteraction(value: unknown): { kind: string; steps: string[] } | undefined {
  if (!isLessonRecord(value) || typeof value.kind !== "string" || !Array.isArray(value.steps)) {
    return undefined;
  }

  if (!value.steps.every((step): step is string => typeof step === "string")) {
    return undefined;
  }

  return { kind: value.kind, steps: value.steps };
}

function readLessonPresentationBlock(value: unknown): LessonPresentationBlock | undefined {
  if (!isLessonRecord(value) || typeof value.order !== "number" || typeof value.kind !== "string") {
    return undefined;
  }

  if (value.kind === "hook" || value.kind === "explanation" || value.kind === "example") {
    if (typeof value.content !== "string") {
      return undefined;
    }

    return { order: value.order, kind: value.kind, content: value.content };
  }

  if (value.kind === "visual") {
    const visualKindFields = {
      ...(typeof value.visualKind === "string" ? { visualKind: value.visualKind } : {}),
      ...(typeof value.purpose === "string" ? { purpose: value.purpose } : {}),
    };

    const hasHtml = typeof value.html === "string" && typeof value.css === "string";
    // Mermaid는 문서 간 변환이 쉬운 다이어그램 표기법이라 html/css 대신 이 필드로도 저작할 수
    // 있다 — 렌더링은 MermaidDiagramBlock(apps/web)이 담당한다.
    const hasMermaid = typeof value.mermaid === "string";

    // 저작 실수(마이그레이션 중 이전 html/css를 안 지우고 mermaid를 추가하는 등)로 둘 다 있으면
    // 어느 쪽이 "진짜" 도식인지 알 수 없다 — 하나를 조용히 우선시키는 대신 통째로 버려서
    // 저작자가 눈치채고 하나만 남기게 한다.
    if (hasHtml && hasMermaid) {
      return undefined;
    }

    if (hasHtml) {
      return { order: value.order, kind: "visual", html: value.html as string, css: value.css as string, ...visualKindFields };
    }

    if (hasMermaid) {
      return { order: value.order, kind: "visual", mermaid: value.mermaid as string, ...visualKindFields };
    }

    return undefined;
  }

  // 알려지지 않은 kind — 컴파일러(lessonPresentation.ts)가 안전하게 무시하도록 그대로 통과.
  return { order: value.order, kind: value.kind };
}

function isLessonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

