import { buildCourseOutline, listLessonDocumentsFrom, stripTitleTypePrefix } from "@sfood/wiki-core";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { LESSON_COURSE_ID, loadLessonProgress } from "../../data/lessonProgress";
import { WikiStatePanel } from "./WikiStatePanel";

export function LessonIndexPage() {
  const { documents, errorMessage, isLoading } = useWikiData();
  const lessons = useMemo(() => listLessonDocumentsFrom(documents), [documents]);
  const outline = useMemo(() => buildCourseOutline(documents), [documents]);
  const progress = loadLessonProgress(LESSON_COURSE_ID);

  if (isLoading) {
    return <WikiStatePanel title="불러오는 중" body="교육 콘텐츠를 불러오고 있습니다." />;
  }

  if (errorMessage) {
    return <WikiStatePanel title="문제가 발생했습니다" body={errorMessage} tone="error" />;
  }

  if (lessons.length === 0) {
    return <WikiStatePanel title="AI 기초교육" body="등록된 교육 콘텐츠가 없습니다." />;
  }

  const continueLesson = progress
    ? lessons.find((lesson) => lesson.slug === progress.lastLessonSlug)
    : undefined;
  const entryHref = continueLesson
    ? `/lesson/${continueLesson.slug}?scene=${progress?.lastSceneIndex ?? 0}`
    : `/lesson/${lessons[0].slug}`;

  return (
    <section className="lesson-index-shell">
      <header className="lesson-index-header">
        <h1 className="lesson-index-title">AI 기초교육</h1>
        <p className="lesson-index-subtitle">
          실습 전에 알아야 할 기본 개념을 순서대로 학습합니다.
        </p>
        <p className="lesson-index-stats">
          {outline.lessons.length}개 레슨 · {outline.totalScenes}개 장면 · 약 {outline.totalEstimatedMinutes}분
        </p>
        <Link to={entryHref} className="lesson-index-primary-button">
          {continueLesson ? "이어서 학습하기" : "학습 시작하기"}
        </Link>
      </header>

      <div className="lesson-index-grid">
        {lessons.map((lesson, index) => {
          const outlineLesson = outline.lessons[index];
          const orderLabel = String(index + 1).padStart(2, "0");

          return (
            <Link key={lesson.id} to={`/lesson/${lesson.slug}`} className="lesson-index-card">
              <div className="lesson-index-card-header">
                <span className="lesson-index-card-order">{orderLabel}</span>
                {progress?.completedLessonSlugs.includes(lesson.slug) ? (
                  <span className="lesson-index-card-status">완료</span>
                ) : null}
              </div>
              <span className="lesson-index-card-title">{stripTitleTypePrefix(lesson.title)}</span>
              <span className="lesson-index-card-summary">{lesson.summary}</span>
              <span className="lesson-index-card-meta">약 {outlineLesson.estimatedMinutes}분</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
