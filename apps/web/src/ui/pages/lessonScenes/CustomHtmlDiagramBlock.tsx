import { useMemo, useState, type SyntheticEvent } from "react";

const MIN_HEIGHT_PX = 80;

// 인라인 스타일/data·blob 이미지만 허용하고, 원격 네트워크 요청(이미지 핑백, 원격 폰트 등)을
// 전부 차단한다 — sandbox="allow-same-origin"은 스크립트 실행만 막을 뿐 <img src="https://...">
// 같은 수동 네트워크 요청(뷰어 IP·쿠키 유출 가능)까지는 막지 못하므로 CSP로 추가 차단한다.
const DIAGRAM_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; base-uri 'none'; form-action 'none'";

/**
 * 콘텐츠팀이 Confluence "HTML" 매크로로 제공하는 도식/도형을 렌더링한다.
 * `sandbox="allow-same-origin"`만 부여하고 `allow-scripts`는 절대 추가하지 않는다 — 이 조합이
 * 콘텐츠에 스크립트나 이벤트 핸들러가 섞여 있어도 실행되지 않게 막는 방어선이다.
 * (정규식 기반 sanitize는 우회 가능성이 있어 추가하지 않는다.) 여기에 CSP와
 * `referrerPolicy="no-referrer"`를 더해 스크립트 없이도 가능한 원격 네트워크 요청까지 차단한다.
 */
// HTML의 <style> 태그는 리터럴 "</style" 바이트 시퀀스를 만나는 즉시 CDATA 콘텐츠를
// 끝낸다(CSS 문법과 무관) — 저작 CSS 문자열에 그 시퀀스가 들어 있으면 태그를 조기에 닫고
// 뒤에 오는 <body>의 html보다 앞서 임의 마크업을 주입할 수 있다(스크립트는 sandbox가 막지만
// head 구조는 깨질 수 있다). 눈에 보이지 않는 零폭 문자를 끼워 넣어 리터럴 매칭만 깨뜬다 —
// CSS 파서 입장에서는 무해한 공백류 문자라 실제 스타일 적용에는 영향이 없다.
function escapeStyleTagBreakout(css: string) {
  return css.replace(/<\/style/gi, "<​/style");
}

export function CustomHtmlDiagramBlock({ html, css }: { html: string; css?: string }) {
  const [height, setHeight] = useState(MIN_HEIGHT_PX);

  const srcDoc = useMemo(
    () =>
      `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${DIAGRAM_CSP}"><style>body{margin:0}${escapeStyleTagBreakout(css ?? "")}</style></head><body>${html}</body></html>`,
    [html, css],
  );

  function handleLoad(event: SyntheticEvent<HTMLIFrameElement>) {
    const doc = event.currentTarget.contentDocument;
    const measured = doc?.body?.scrollHeight ?? MIN_HEIGHT_PX;
    setHeight(Math.max(measured, MIN_HEIGHT_PX));
  }

  return (
    <div className="lesson-block-custom-html-wrapper" style={{ height }}>
      <iframe
        className="lesson-block-custom-html"
        title="콘텐츠 제공 도식"
        sandbox="allow-same-origin"
        referrerPolicy="no-referrer"
        srcDoc={srcDoc}
        onLoad={handleLoad}
        style={{ height }}
      />
      {/*
        스크립트가 없는 sandbox iframe이라 내부에 실제 인터랙션(팬/줌)이 없다. 하지만 터치가
        iframe 내부(별도 브라우징 컨텍스트)에 닿으면 부모 페이지로 이벤트가 버블링되지 않아
        모바일 스와이프 내비게이션의 "죽은 영역"이 된다 — 투명 오버레이로 터치를 부모에서
        가로채 스와이프가 항상 동작하게 한다(잃을 인터랙션이 없으므로 안전하다).
      */}
      <div className="lesson-block-custom-html-swipe-overlay" aria-hidden="true" />
    </div>
  );
}
