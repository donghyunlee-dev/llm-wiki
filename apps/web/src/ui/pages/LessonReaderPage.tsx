import {
  buildCourseOutline,
  getGlobalScenePosition,
  getLessonDocumentFrom,
  getNextLessonSlugFrom,
  splitLessonContentIntoScenes,
  stripTitleTypePrefix,
} from "@sfood/wiki-core";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { LESSON_COURSE_ID, markLessonCompleted, markSceneVisited } from "../../data/lessonProgress";
import { LessonOutlineDrawer } from "./LessonOutlineDrawer";
import { WikiStatePanel } from "./WikiStatePanel";

function clampSceneIndex(index: number, sceneCount: number): number {
  if (sceneCount === 0) {
    return 0;
  }

  const safeIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
  return Math.min(Math.max(safeIndex, 0), sceneCount - 1);
}

export function LessonReaderPage() {
  const params = useParams();
  const slug = params.slug ?? "";
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { documents, errorMessage, isLoading } = useWikiData();
  const outline = useMemo(() => buildCourseOutline(documents), [documents]);

  const lesson = getLessonDocumentFrom(documents, slug);
  const scenes = useMemo(
    () => (lesson ? splitLessonContentIntoScenes(lesson.contentHtml) : []),
    [lesson],
  );

  const [sceneIndex, setSceneIndex] = useState(() =>
    clampSceneIndex(Number(searchParams.get("scene") ?? 0) || 0, scenes.length),
  );
  const [scriptVisible, setScriptVisible] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const outlineTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSceneIndex(clampSceneIndex(Number(searchParams.get("scene") ?? 0) || 0, scenes.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, scenes.length]);

  useEffect(() => {
    setScriptVisible(false);
  }, [sceneIndex]);

  useEffect(() => {
    if (lesson) {
      markSceneVisited(LESSON_COURSE_ID, lesson.slug, sceneIndex);
    }
  }, [lesson, sceneIndex]);

  const isFirstScene = sceneIndex === 0;
  const isLastScene = sceneIndex === scenes.length - 1;

  function goPrevious() {
    if (!isFirstScene) {
      setSceneIndex((current) => current - 1);
    }
  }

  function goNext() {
    if (!lesson) {
      return;
    }

    if (!isLastScene) {
      setSceneIndex((current) => current + 1);
      return;
    }

    markLessonCompleted(LESSON_COURSE_ID, lesson.slug);
    const nextSlug = getNextLessonSlugFrom(documents, lesson.slug);
    navigate(nextSlug ? `/lesson/${nextSlug}` : "/lesson");
  }

  function handleSelectScene(targetLessonSlug: string, targetSceneIndex: number) {
    setOutlineOpen(false);

    if (targetLessonSlug === slug) {
      setSceneIndex(targetSceneIndex);
      return;
    }

    navigate(`/lesson/${targetLessonSlug}?scene=${targetSceneIndex}`);
  }

  // Intentionally re-registered every render (no dependency array) so the handler always closes
  // over the current goNext/goPrevious/scenes — the listener add/remove cost is negligible here.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }

      if (outlineOpen) {
        return;
      }

      if (event.key === "ArrowRight") {
        goNext();
      } else if (event.key === "ArrowLeft") {
        goPrevious();
      } else if (event.key === "Home") {
        setSceneIndex(0);
      } else if (event.key === "End") {
        setSceneIndex(scenes.length - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (isLoading) {
    return <WikiStatePanel title="불러오는 중" body="교육 콘텐츠를 불러오고 있습니다." />;
  }

  if (errorMessage || !lesson || scenes.length === 0) {
    return (
      <WikiStatePanel
        title="레슨을 찾을 수 없습니다"
        body="교육 목록으로 돌아가 다른 레슨을 선택해 주세요."
        tone="error"
      />
    );
  }

  const globalPosition = getGlobalScenePosition(outline, slug, sceneIndex);
  const scene = scenes[sceneIndex];

  return (
    <section className="lesson-reader-shell">
      <header className="lesson-reader-header">
        <Link to="/lesson" className="lesson-reader-back-link">
          ← 교육 목록
        </Link>
        <div className="lesson-reader-progress">
          <span className="lesson-reader-progress-item">
            <span className="lesson-reader-progress-label">이 레슨</span>
            {sceneIndex + 1} / {scenes.length}
          </span>
          {globalPosition ? (
            <span className="lesson-reader-progress-item">
              <span className="lesson-reader-progress-label">전체</span>
              {globalPosition.globalIndex} / {globalPosition.totalScenes}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          ref={outlineTriggerRef}
          className="lesson-reader-outline-button"
          onClick={() => setOutlineOpen(true)}
        >
          학습 흐름
        </button>
      </header>

      <div className="lesson-reader-stage">
        <h1 className="lesson-reader-scene-title">{stripTitleTypePrefix(scene.title)}</h1>
        <div className="lesson-reader-scene-body" dangerouslySetInnerHTML={{ __html: scene.bodyHtml }} />

        {scene.scriptHtml ? (
          <div className="lesson-reader-script">
            <button
              type="button"
              className="lesson-reader-script-toggle"
              onClick={() => setScriptVisible((visible) => !visible)}
              aria-expanded={scriptVisible}
            >
              {scriptVisible ? "대본 숨기기" : "대본 보기"}
            </button>
            {scriptVisible ? (
              <div
                className="lesson-reader-script-body"
                dangerouslySetInnerHTML={{ __html: scene.scriptHtml }}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <footer className="lesson-reader-controls">
        <button
          type="button"
          className="lesson-reader-nav-button"
          onClick={goPrevious}
          disabled={isFirstScene}
        >
          이전
        </button>
        <button
          type="button"
          className="lesson-reader-nav-button lesson-reader-nav-button-primary"
          onClick={goNext}
        >
          {isLastScene ? "레슨 완료" : "다음"}
        </button>
      </footer>

      <LessonOutlineDrawer
        outline={outline}
        currentLessonSlug={slug}
        currentSceneIndex={sceneIndex}
        open={outlineOpen}
        onClose={() => setOutlineOpen(false)}
        onSelectScene={handleSelectScene}
        triggerRef={outlineTriggerRef}
      />
    </section>
  );
}
