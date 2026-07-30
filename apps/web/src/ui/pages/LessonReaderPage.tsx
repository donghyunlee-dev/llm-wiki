import {
  getLessonDocumentFrom,
  getNextLessonSlugFrom,
  splitLessonContentIntoScenes,
  stripTitleTypePrefix,
} from "@sfood/wiki-core";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { LESSON_COURSE_ID, markLessonCompleted, markSceneVisited } from "../../data/lessonProgress";
import { WikiStatePanel } from "./WikiStatePanel";

function clampSceneIndex(index: number, sceneCount: number): number {
  if (sceneCount === 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), sceneCount - 1);
}

export function LessonReaderPage() {
  const params = useParams();
  const slug = params.slug ?? "";
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { documents, errorMessage, isLoading } = useWikiData();

  const lesson = getLessonDocumentFrom(documents, slug);
  const scenes = useMemo(
    () => (lesson ? splitLessonContentIntoScenes(lesson.contentHtml) : []),
    [lesson],
  );

  const [sceneIndex, setSceneIndex] = useState(() =>
    clampSceneIndex(Number(searchParams.get("scene") ?? 0) || 0, scenes.length),
  );
  const [scriptVisible, setScriptVisible] = useState(false);

  useEffect(() => {
    setSceneIndex(clampSceneIndex(Number(searchParams.get("scene") ?? 0) || 0, scenes.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

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

  // Intentionally re-registered every render (no dependency array) so the handler always closes
  // over the current goNext/goPrevious/scenes — the listener add/remove cost is negligible here.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) {
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

  const scene = scenes[sceneIndex];

  return (
    <section className="lesson-reader-shell">
      <header className="lesson-reader-header">
        <Link to="/lesson" className="lesson-reader-back-link">
          ← 교육 목록
        </Link>
        <span className="lesson-reader-position">
          {sceneIndex + 1} / {scenes.length}
        </span>
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
    </section>
  );
}
