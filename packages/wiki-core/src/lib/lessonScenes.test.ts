import { describe, expect, it } from "vitest";
import { splitLessonContentIntoScenes } from "./lessonScenes";

describe("splitLessonContentIntoScenes", () => {
  it("splits content into one scene per H2 heading", () => {
    const html = `
      <h1>레슨 제목</h1>
      <h2 id="scene-a">첫 번째 장면</h2>
      <p>첫 번째 본문</p>
      <h2 id="scene-b">두 번째 장면</h2>
      <p>두 번째 본문</p>
    `;

    const scenes = splitLessonContentIntoScenes(html);

    expect(scenes).toHaveLength(2);
    expect(scenes[0]).toMatchObject({ id: "scene-a", title: "첫 번째 장면" });
    expect(scenes[0].bodyHtml).toContain("첫 번째 본문");
    expect(scenes[0].bodyHtml).not.toContain("두 번째 본문");
    expect(scenes[1]).toMatchObject({ id: "scene-b", title: "두 번째 장면" });
  });

  it("extracts an expand macro as scriptHtml and removes it from bodyHtml", () => {
    const html = `
      <h2 id="scene-a">장면</h2>
      <p>보이는 본문</p>
      <ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">대본</ac:parameter><ac:rich-text-body><p>숨겨진 대본</p></ac:rich-text-body></ac:structured-macro>
    `;

    const scenes = splitLessonContentIntoScenes(html);

    expect(scenes[0].bodyHtml).toContain("보이는 본문");
    expect(scenes[0].bodyHtml).not.toContain("숨겨진 대본");
    expect(scenes[0].bodyHtml).not.toContain("ac:structured-macro");
    expect(scenes[0].scriptHtml).toContain("숨겨진 대본");
  });

  it("omits scriptHtml when a scene has no expand macro", () => {
    const html = `<h2 id="scene-a">장면</h2><p>본문만 있음</p>`;

    const scenes = splitLessonContentIntoScenes(html);

    expect(scenes[0].scriptHtml).toBeUndefined();
  });

  it("falls back to a single scene when there is no H2 heading", () => {
    const html = `<h1>제목만 있는 문서</h1><p>본문</p>`;

    const scenes = splitLessonContentIntoScenes(html);

    expect(scenes).toHaveLength(1);
    expect(scenes[0].bodyHtml).toContain("본문");
  });

  it("extracts a 나레이션 blockquote as scriptHtml and removes it from bodyHtml", () => {
    const html = `
      <h2 id="scene-a">장면</h2>
      <p>보이는 본문</p>
      <blockquote><p><strong>나레이션:</strong> 숨겨진 나레이션 대사</p></blockquote>
    `;

    const scenes = splitLessonContentIntoScenes(html);

    expect(scenes[0].bodyHtml).toContain("보이는 본문");
    expect(scenes[0].bodyHtml).not.toContain("숨겨진 나레이션 대사");
    expect(scenes[0].scriptHtml).toContain("숨겨진 나레이션 대사");
  });

  it("keeps a plain blockquote (no 나레이션 label) visible in bodyHtml", () => {
    const html = `
      <h2 id="scene-a">장면</h2>
      <blockquote><p>도입부 질문입니다</p></blockquote>
      <p>본문</p>
    `;

    const scenes = splitLessonContentIntoScenes(html);

    expect(scenes[0].bodyHtml).toContain("도입부 질문입니다");
    expect(scenes[0].scriptHtml).toBeUndefined();
  });

  it("keeps a hook blockquote visible when a 나레이션 blockquote follows it in the same scene", () => {
    const html = `
      <h2 id="scene-a">장면</h2>
      <blockquote><p>도입부 질문입니다</p></blockquote>
      <p>시각 자료 설명</p>
      <blockquote><p><strong>나레이션:</strong> 숨겨진 나레이션 대사</p></blockquote>
    `;

    const scenes = splitLessonContentIntoScenes(html);

    expect(scenes[0].bodyHtml).toContain("도입부 질문입니다");
    expect(scenes[0].bodyHtml).toContain("시각 자료 설명");
    expect(scenes[0].bodyHtml).not.toContain("숨겨진 나레이션 대사");
    expect(scenes[0].scriptHtml).toContain("숨겨진 나레이션 대사");
  });
});
