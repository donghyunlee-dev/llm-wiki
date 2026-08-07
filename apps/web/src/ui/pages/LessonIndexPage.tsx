import {
  buildCourseOutline,
  compileLessonPresentationScenes,
  listLessonDocumentsFrom,
  stripTitleTypePrefix,
  type WikiDocument,
} from "@sfood/wiki-core";
import { useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { LessonHeroIllustration } from "./LessonHeroIllustration";
import { WikiStatePanel } from "./WikiStatePanel";

const CARD_DESCRIPTION_MAX_LENGTH = 100;
const CHAPTER_COLOR_COUNT = 5;

function unescapeHtmlText(text: string): string {
  return text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// 목록 카드 설명은 `lesson.summary`(원문 bodyHtml 앞부분을 그대로 자른 값, 제목이 반복돼
// 중복 표시되는 문제가 있었다) 대신 실제 발표 콘텐츠(hook/설명 블록)에서 뽑아 보여준다.
function buildLessonCardDescription(lesson: WikiDocument): string {
  const [firstScene] = lesson.presentation ? compileLessonPresentationScenes(lesson.presentation) : [];
  const text = (firstScene?.blocks ?? [])
    .filter((block) => block.kind === "hookStatement" || block.kind === "paragraph")
    .map((block) => unescapeHtmlText(block.html))
    .join(" ");

  // 첫 씬이 customHtml(시각 자료)만 있는 등 텍스트 블록이 없으면 원문 요약으로 폴백한다
  // — 목록 카드 설명이 완전히 비어 보이는 것을 막기 위해서다.
  const description = text || lesson.summary;

  return description.length > CARD_DESCRIPTION_MAX_LENGTH
    ? `${description.slice(0, CARD_DESCRIPTION_MAX_LENGTH).trim()}…`
    : description;
}

export function LessonIndexPage() {
  const { documents, errorMessage, isLoading } = useWikiData();
  const lessons = useMemo(() => listLessonDocumentsFrom(documents), [documents]);
  const outline = useMemo(() => buildCourseOutline(documents), [documents]);
  // 챕터 등장 순서대로 색 인덱스를 매겨 헤더/순번/좌측선에 일관되게 적용한다 —
  // 23개 레슨이 전부 같은 색으로 반복되어 "관리자 목록"처럼 보이는 문제를 완화한다.
  const chapterColorIndexByChapter = useMemo(() => {
    const map = new Map<string, number>();
    outline.lessons.forEach((lesson) => {
      if (lesson.chapter && !map.has(lesson.chapter)) {
        map.set(lesson.chapter, map.size % CHAPTER_COLOR_COUNT);
      }
    });
    return map;
  }, [outline]);

  if (isLoading) {
    return <WikiStatePanel title="불러오는 중" body="교육 콘텐츠를 불러오고 있습니다." />;
  }

  if (errorMessage) {
    return <WikiStatePanel title="문제가 발생했습니다" body={errorMessage} tone="error" />;
  }

  if (lessons.length === 0) {
    return <WikiStatePanel title="AI 기초교육" body="등록된 교육 콘텐츠가 없습니다." />;
  }

  return (
    <section className="lesson-index-shell">
      <header className="lesson-index-hero">
        <div className="lesson-index-hero-copy">
          <span className="lesson-index-eyebrow">AI 기초교육</span>
          <h1 className="lesson-index-title">실습 전에 알아야 할 기본 개념을 순서대로 학습합니다.</h1>
          <div className="lesson-index-stats">
            <span className="lesson-index-stat">{outline.lessons.length}개 레슨</span>
            <span className="lesson-index-stat">{outline.totalScenes}개 장면</span>
            <span className="lesson-index-stat">약 {outline.totalEstimatedMinutes}분</span>
          </div>
          <Link to={`/lesson/${lessons[0].slug}`} className="lesson-index-primary-button">
            학습 시작하기
          </Link>
        </div>
        <div className="lesson-index-hero-visual">
          <LessonHeroIllustration />
        </div>
      </header>

      <nav className="lesson-index-list">
        {lessons.map((lesson, index) => {
          const outlineLesson = outline.lessons[index];
          const previousChapter = index > 0 ? outline.lessons[index - 1].chapter : undefined;
          const orderLabel = String(index + 1).padStart(2, "0");
          const chapterColorIndex = outlineLesson.chapter
            ? chapterColorIndexByChapter.get(outlineLesson.chapter)
            : undefined;
          const chapterAccentStyle =
            chapterColorIndex === undefined
              ? undefined
              : ({ "--chapter-accent": `var(--chapter-color-${chapterColorIndex + 1})` } as CSSProperties);

          return (
            <div key={lesson.id} className="lesson-index-chapter-group" style={chapterAccentStyle}>
              {outlineLesson.chapter && outlineLesson.chapter !== previousChapter ? (
                <p className="lesson-index-chapter-header">{outlineLesson.chapter}</p>
              ) : null}
              <Link to={`/lesson/${lesson.slug}`} className="lesson-index-row">
                <span className="lesson-index-row-order">{orderLabel}</span>
                <span className="lesson-index-row-body">
                  <span className="lesson-index-row-title">{stripTitleTypePrefix(lesson.title)}</span>
                  <span className="lesson-index-row-summary">{buildLessonCardDescription(lesson)}</span>
                </span>
              </Link>
            </div>
          );
        })}
      </nav>
    </section>
  );
}
