export type LessonEventName =
  | "lesson_load_success"
  | "lesson_load_failure"
  | "scene_view"
  | "scene_navigation_blocked"
  | "content_overflow_detected";

/**
 * 설계서 "관측성과 운영 로그" — 원문 전체, 사용자의 답변 내용, Confluence Token은 절대 담지 않는다.
 * 별도 분석 백엔드가 아직 없어 콘솔로만 남긴다(추후 실제 수집기로 교체할 수 있도록 진입점을 하나로 모아둔다).
 */
export function logLessonEvent(name: LessonEventName, payload: Record<string, string | number | boolean> = {}): void {
  console.debug(`[lesson_event] ${name}`, payload);
}
