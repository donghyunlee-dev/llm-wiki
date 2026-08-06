import {
  buildCourseOutline,
  compileLessonPresentationScenes,
  getGlobalScenePosition,
  getLessonDocumentFrom,
  getNextLessonSlugFrom,
  getPreviousLessonSlugFrom,
  stripTitleTypePrefix,
  validateLesson,
} from "@sfood/wiki-core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { logLessonEvent } from "../../data/lessonAnalytics";
import { useWikiData } from "../../data/WikiDataProvider";
import { LessonOutlineDrawer } from "./LessonOutlineDrawer";
import { SceneRenderer } from "./lessonScenes/SceneRenderer";
import { useLessonSwipeNavigation } from "./useLessonSwipeNavigation";
import { useLessonWheelNavigation } from "./useLessonWheelNavigation";
import { WikiStatePanel } from "./WikiStatePanel";


function clampSceneIndex(index: number, sceneCount: number): number {
  if (sceneCount === 0) {
    return 0;
  }

  const safeIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
  return Math.min(Math.max(safeIndex, 0), sceneCount - 1);
}

// CSS 진입 애니메이션(--lesson-motion-duration-normal, 0.36s)보다 약간 길게 잡아 잠금이
// 애니메이션보다 먼저 풀리지 않도록 한다(설계서 "전환 잠금" 원칙).
const TRANSITION_LOCK_MS = 410;

export function LessonReaderPage() {
  const params = useParams();
  const slug = params.slug ?? "";
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { documents, errorMessage, isLoading } = useWikiData();
  const outline = useMemo(() => buildCourseOutline(documents), [documents]);

  const lesson = getLessonDocumentFrom(documents, slug);
  const scenes = useMemo(
    () => (lesson?.presentation ? compileLessonPresentationScenes(lesson.presentation) : []),
    [lesson],
  );
  const diagnostics = useMemo(() => validateLesson(scenes), [scenes]);
  const showDiagnostics = searchParams.get("diagnostics") === "1";

  // 설계서 "검증 수준"(Error/Warning/Info) — 게시를 막는 별도 백엔드가 없으므로
  // 콘텐츠 저작자가 콘솔에서 확인할 수 있게 로그로 남긴다. `?diagnostics=1`이면 화면에도 보여준다.
  useEffect(() => {
    diagnostics.forEach((diagnostic) => {
      const log = diagnostic.level === "error" ? console.error : diagnostic.level === "warning" ? console.warn : console.info;
      log(`[lesson-diagnostics:${diagnostic.code}] ${diagnostic.message}`);

      if (diagnostic.code === "scene_count_exceeded") {
        logLessonEvent("content_overflow_detected", { sceneCount: scenes.length });
      }
    });
  }, [diagnostics, scenes.length]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (errorMessage || !lesson || scenes.length === 0) {
      logLessonEvent("lesson_load_failure", { slug });
    } else {
      logLessonEvent("lesson_load_success", { slug, sceneCount: scenes.length });
    }
  }, [isLoading, errorMessage, lesson, scenes.length, slug]);

  const [sceneIndex, setSceneIndex] = useState(() =>
    clampSceneIndex(Number(searchParams.get("scene") ?? 0) || 0, scenes.length),
  );
  const scene = scenes[sceneIndex];
  const [scriptVisible, setScriptVisible] = useState(true);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [transitioning, setTransitioning] = useState(false);
  const outlineTriggerRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneTitleRef = useRef<HTMLHeadingElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const closeOutline = useCallback(() => setOutlineOpen(false), []);

  function beginTransition(nextDirection: "forward" | "backward") {
    setDirection(nextDirection);
    setTransitioning(true);
    window.setTimeout(() => setTransitioning(false), TRANSITION_LOCK_MS);
  }

  // "교육 설명" 펼침 여부/본문 길이/다음 페이지 안내 유무에 따라 하단 dock(교육 설명 + 컨트롤 바)의
  // 실제 높이가 달라진다 — 본문 콘텐츠가 그 높이만큼 가려지지 않도록 매번 정확히 측정해서
  // 콘텐츠 영역의 하단 여백에 그대로 반영한다(vh 기반 추정치로는 표/다이어그램이 긴 씬에서 겹쳤다).
  // deps 없이 매 렌더마다 재등록한다 — 로딩 중에는 이 컴포넌트가 dock 없이 렌더되므로(아래
  // isLoading 가드), dock/shell ref가 처음엔 null이었다가 로딩이 끝난 뒤에야 실제 엘리먼트를
  // 갖게 된다. deps를 []로 고정하면 그 최초(null) 상태에서만 실행되고 다시는 재시도되지 않는다.
  useEffect(() => {
    const dock = dockRef.current;
    const shell = shellRef.current;
    if (!dock || !shell || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      shell.style.setProperty("--lesson-reader-dock-height", `${entry.contentRect.height}px`);
    });
    observer.observe(dock);
    return () => observer.disconnect();
  });

  useEffect(() => {
    setSceneIndex(clampSceneIndex(Number(searchParams.get("scene") ?? 0) || 0, scenes.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, scenes.length]);

  useEffect(() => {
    setScriptVisible(true);
  }, [sceneIndex]);

  // Keeps the URL's `scene` param in sync with in-lesson navigation (buttons/keyboard/wheel)
  // so a page refresh restores the same scene instead of falling back to the stale deep-link value.
  // Skipped while scenes haven't loaded yet — otherwise the pre-load `sceneIndex` (always 0,
  // see clampSceneIndex) would overwrite a deep-linked `?scene=` value before it can be applied.
  useEffect(() => {
    if (scenes.length === 0) {
      return;
    }

    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set("scene", String(sceneIndex));
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIndex, scenes.length]);

  useEffect(() => {
    const scene = scenes[sceneIndex];
    if (lesson && scene) {
      logLessonEvent("scene_view", { lessonSlug: lesson.slug, sceneId: scene.id, sceneIndex });
    }
  }, [lesson, scenes, sceneIndex]);

  // 설계서 접근성 원칙: Scene 전환 후 제목으로 포커스를 옮겨 Screen Reader가 새 위치를 읽게 한다.
  useEffect(() => {
    sceneTitleRef.current?.focus();
  }, [sceneIndex, lesson?.id]);

  const isFirstScene = sceneIndex === 0;
  const isLastScene = sceneIndex === scenes.length - 1;

  function goPrevious() {
    if (!lesson) {
      return;
    }
    if (transitioning) {
      logLessonEvent("scene_navigation_blocked", { direction: "backward" });
      return;
    }

    if (!isFirstScene) {
      beginTransition("backward");
      setSceneIndex((current) => current - 1);
      return;
    }

    const previousSlug = getPreviousLessonSlugFrom(documents, lesson.slug);
    if (!previousSlug) {
      return;
    }

    const previousLesson = getLessonDocumentFrom(documents, previousSlug);
    const previousSceneCount = previousLesson?.presentation
      ? compileLessonPresentationScenes(previousLesson.presentation).length
      : 0;
    const previousLastSceneIndex = Math.max(0, previousSceneCount - 1);
    beginTransition("backward");
    navigate(`/lesson/${previousSlug}?scene=${previousLastSceneIndex}`);
  }

  function goNext() {
    if (!lesson) {
      return;
    }
    if (transitioning) {
      logLessonEvent("scene_navigation_blocked", { direction: "forward" });
      return;
    }

    if (!isLastScene) {
      beginTransition("forward");
      setSceneIndex((current) => current + 1);
      return;
    }

    const nextSlug = getNextLessonSlugFrom(documents, lesson.slug);
    navigate(nextSlug ? `/lesson/${nextSlug}` : "/lesson");
  }

  function handleSelectScene(targetLessonSlug: string, targetSceneIndex: number) {
    setOutlineOpen(false);

    if (targetLessonSlug === slug) {
      if (transitioning || targetSceneIndex === sceneIndex) {
        return;
      }
      beginTransition(targetSceneIndex >= sceneIndex ? "forward" : "backward");
      setSceneIndex(targetSceneIndex);
      return;
    }

    navigate(`/lesson/${targetLessonSlug}?scene=${targetSceneIndex}`);
  }

  useLessonWheelNavigation(stageRef, goNext, goPrevious, outlineOpen);
  useLessonSwipeNavigation(stageRef, goNext, goPrevious, outlineOpen);

  // Intentionally re-registered every render (no dependency array) so the handler always closes
  // over the current goNext/goPrevious/scenes — the listener add/remove cost is negligible here.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      // 입력 필드나 버튼에 포커스가 있을 때는 전역 단축키(방향키 등)를 가로채지 않는다 —
      // 포커스가 버튼에 있는 상태로 Enter/Space를 누르면 브라우저가 그 버튼을 네이티브로
      // 클릭하므로, 여기서 또 goNext/goPrevious를 호출하면 같은 입력이 두 번 처리된다.
      if (target && ["INPUT", "TEXTAREA", "BUTTON", "A"].includes(target.tagName)) {
        return;
      }

      if (event.key.toLowerCase() === "m" && !outlineOpen) {
        event.preventDefault();
        setOutlineOpen(true);
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
        if (transitioning || sceneIndex === 0) {
          return;
        }
        beginTransition("backward");
        setSceneIndex(0);
      } else if (event.key === "End") {
        if (transitioning || sceneIndex === scenes.length - 1) {
          return;
        }
        beginTransition("forward");
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
  // 위 가드가 이미 scenes.length > 0을 보장하므로 이 시점의 scene은 항상 정의되어 있다.
  const currentScene = scene!;
  const hasPreviousLesson = getPreviousLessonSlugFrom(documents, lesson.slug) !== undefined;
  // 온라인 강의 플레이어 벤치마킹: 상단 코스 바 아래 얇은 진행률 바 — 과정 전체 위치를 알 수 있으면
  // 그 기준으로, 없으면(단일 레슨) 현재 레슨 안에서의 위치로 계산한다.
  const progressPercent = globalPosition
    ? Math.round((globalPosition.globalIndex / globalPosition.totalScenes) * 100)
    : Math.round(((sceneIndex + 1) / scenes.length) * 100);

  return (
    <section className="lesson-reader-shell" ref={shellRef}>
      <header className="lesson-reader-topbar">
        <div className="lesson-reader-header">
          <Link to="/lesson" className="lesson-reader-back-link">
            ← 교육 목록
          </Link>
          <button
            type="button"
            ref={outlineTriggerRef}
            className="lesson-reader-outline-button"
            onClick={() => setOutlineOpen(true)}
          >
            학습 흐름
          </button>
        </div>
        <div className="lesson-reader-progress-track">
          <div className="lesson-reader-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <div className="sr-only" role="status" aria-live="polite">
        {`${sceneIndex + 1} / ${scenes.length}, ${stripTitleTypePrefix(currentScene.title)}`}
      </div>

      <div className="lesson-reader-body-grid">
        <div className="lesson-reader-content">
          <div className="lesson-reader-stage" ref={stageRef} data-direction={direction}>
            <h1 className="lesson-reader-scene-title" ref={sceneTitleRef} tabIndex={-1}>
              {stripTitleTypePrefix(currentScene.title)}
            </h1>
            <div className="lesson-reader-scene-body">
              <SceneRenderer
                key={`${slug}:${currentScene.id}`}
                type={currentScene.type}
                layout={currentScene.layout}
                blocks={currentScene.blocks}
              />
            </div>
          </div>

          {showDiagnostics && diagnostics.length > 0 ? (
            <div className="lesson-reader-diagnostics" role="status">
              <p className="lesson-reader-diagnostics-title">진단 ({diagnostics.length})</p>
              <ul>
                {diagnostics.map((diagnostic, index) => (
                  <li key={index} className={`lesson-reader-diagnostics-item lesson-reader-diagnostics-item--${diagnostic.level}`}>
                    <span className="lesson-reader-diagnostics-level">{diagnostic.level}</span> {diagnostic.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {currentScene.transitionToNext ? (
          <aside className="lesson-reader-side-rail">
            <p className="lesson-reader-transition-banner">다음: {currentScene.transitionToNext}</p>
          </aside>
        ) : null}
      </div>

      <div className="lesson-reader-bottom-dock" ref={dockRef}>
        {currentScene.transitionToNext ? (
          <div className="lesson-reader-transition-banner-row">
            <p className="lesson-reader-transition-banner">다음: {currentScene.transitionToNext}</p>
          </div>
        ) : null}

        {currentScene.scriptHtml ? (
          <div className="lesson-reader-script">
            <div className="lesson-reader-script-inner">
              <div className="lesson-reader-script-header">
                <span className="lesson-reader-script-tab">교육 설명</span>
                <button
                  type="button"
                  className="lesson-reader-script-toggle"
                  onClick={() => setScriptVisible((visible) => !visible)}
                  aria-expanded={scriptVisible}
                  aria-label={scriptVisible ? "교육 설명 숨기기" : "교육 설명 보기"}
                >
                  <svg
                    viewBox="0 0 14 14"
                    width="14"
                    height="14"
                    aria-hidden="true"
                    style={{ transform: scriptVisible ? "rotate(0deg)" : "rotate(180deg)" }}
                  >
                    <polyline
                      points="3,5 7,9 11,5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              {scriptVisible ? (
                <div
                  key={`${slug}:${currentScene.id}:script`}
                  className="lesson-reader-script-body"
                  dangerouslySetInnerHTML={{ __html: currentScene.scriptHtml }}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        <footer className="lesson-reader-bottombar">
          <div className="lesson-reader-controls">
            <button
              type="button"
              className="lesson-reader-nav-button"
              onClick={goPrevious}
              disabled={isFirstScene && !hasPreviousLesson}
            >
              이전
            </button>
            <span className="lesson-reader-progress-item">
              {globalPosition
                ? `${globalPosition.globalIndex} / ${globalPosition.totalScenes}`
                : `${sceneIndex + 1} / ${scenes.length}`}
            </span>
            <button
              type="button"
              className="lesson-reader-nav-button lesson-reader-nav-button-primary"
              onClick={goNext}
            >
              다음
            </button>
          </div>
        </footer>
      </div>

      <LessonOutlineDrawer
        outline={outline}
        currentLessonSlug={slug}
        currentSceneIndex={sceneIndex}
        open={outlineOpen}
        onClose={closeOutline}
        onSelectScene={handleSelectScene}
        triggerRef={outlineTriggerRef}
      />
    </section>
  );
}
