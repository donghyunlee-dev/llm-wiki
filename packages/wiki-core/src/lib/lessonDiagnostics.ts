import type { LessonScene } from "./lessonPresentation";

export type DiagnosticLevel = "error" | "warning" | "info";

export type Diagnostic = {
  level: DiagnosticLevel;
  code: string;
  message: string;
  sceneId?: string;
};

const MAX_RECOMMENDED_SCENES = 15;

/**
 * 설계서 "Lesson Compiler > 검증 수준"을 반영한 게시 전 진단이다. 게시를 실제로 막는 기능은
 * 없다(별도 Backend/Preview 없이 클라이언트에서 계산) — 개발자 콘솔과 `?diagnostics=1` 개발자
 * 보기에서 확인하는 용도다.
 */
export function validateLesson(scenes: LessonScene[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const seenIds = new Set<string>();

  for (const scene of scenes) {
    if (seenIds.has(scene.id)) {
      diagnostics.push({
        level: "error",
        code: "duplicate_scene_id",
        message: `Scene ID가 중복되었습니다: "${scene.id}"`,
        sceneId: scene.id,
      });
    }
    seenIds.add(scene.id);

    if (scene.blocks.length === 0) {
      diagnostics.push({
        level: "error",
        code: "empty_scene",
        message: `장면에 콘텐츠가 없습니다: "${scene.title}"`,
        sceneId: scene.id,
      });
    }

  }

  if (scenes.length > MAX_RECOMMENDED_SCENES) {
    diagnostics.push({
      level: "warning",
      code: "scene_count_exceeded",
      message: `장면 수가 권장치(${MAX_RECOMMENDED_SCENES}개)를 초과했습니다: ${scenes.length}개`,
    });
  }

  return diagnostics;
}
