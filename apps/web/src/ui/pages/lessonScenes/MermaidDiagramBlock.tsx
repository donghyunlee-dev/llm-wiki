import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "../../theme/ThemeProvider";

// `getComputedStyle(...).getPropertyValue("--foo")`는 커스텀 프로퍼티의 "지정된" 값을 그대로
// 돌려줄 뿐, 그 안에 있는 color-mix() 같은 함수는 계산하지 않는다(다크 테마 팔레트가 이 함수를
// 쓴다). 실제 <color> 프로퍼티에 대입해 브라우저가 계산하게 하면 값은 나오지만, 이 브라우저는
// 그 결과를 Mermaid의 색 파서(khroma, 레거시 rgb()/hex만 이해)가 모르는 CSS Color 4
// `color(srgb r g b)` 형식으로 직렬화한다 — 채널은 0~1 실수 또는 퍼센트, 알파는 실수 또는
// 퍼센트 또는 "none"으로 나올 수 있어 그 변형들을 함께 처리해 rgb()/rgba()로 변환한다.
export function toLegacyRgb(cssColor: string): string {
  const match = cssColor.match(
    /^color\(srgb\s+([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)(?:\s*\/\s*([\d.]+%?|none))?\)$/,
  );
  if (!match) {
    return cssColor;
  }

  const [, r, g, b, a] = match;
  const channel = (value: string) => {
    const numeric = value.endsWith("%") ? Number(value.slice(0, -1)) / 100 : Number(value);
    return Math.round(numeric * 255);
  };
  const alpha = !a || a === "none" ? undefined : a.endsWith("%") ? Number(a.slice(0, -1)) / 100 : Number(a);

  return alpha === undefined
    ? `rgb(${channel(r)}, ${channel(g)}, ${channel(b)})`
    : `rgba(${channel(r)}, ${channel(g)}, ${channel(b)}, ${alpha})`;
}

function resolveColorVar(name: string): string {
  const probe = document.createElement("div");
  probe.style.color = `var(${name})`;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();

  return toLegacyRgb(computed);
}

/**
 * 이 앱의 기존 CSS 변수(design token)를 읽어 Mermaid의 기본 테마(청록/각진 상자) 대신 브랜드
 * 톤을 반영한다. 새 색상값을 만들지 않고, 이미 `@sfood/ui` 토큰에서 상속된 값만 재사용한다.
 * Mermaid는 렌더링 시점에 색을 SVG에 굽기(bake) 때문에 테마가 바뀔 때마다 다시 읽어야 한다.
 */
function readMermaidThemeVariables() {
  const fontFamily = getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim();

  return {
    background: "transparent",
    fontFamily,
    primaryColor: resolveColorVar("--accent-soft"),
    primaryBorderColor: resolveColorVar("--accent"),
    primaryTextColor: resolveColorVar("--page-fg"),
    secondaryColor: resolveColorVar("--panel-bg"),
    secondaryBorderColor: resolveColorVar("--panel-border"),
    tertiaryColor: resolveColorVar("--card-hover-bg"),
    lineColor: resolveColorVar("--accent-strong"),
    textColor: resolveColorVar("--page-fg"),
  };
}

// 사각형 노드의 각진 느낌을 줄이기 위한 최소한의 스타일 보정 — 이 앱의 --radius-md 값을
// 그대로 재사용한다(새 수치를 만들지 않음).
function readMermaidThemeCss() {
  const radius = getComputedStyle(document.documentElement).getPropertyValue("--radius-md").trim();
  return `.node rect, .node polygon { rx: ${radius}; ry: ${radius}; }`;
}

// Confluence 저작자가 다이어그램 본문에 `%%{init: {...}}%%` 지시어를 넣으면 mermaid는 기본적으로
// 그 값으로 자신의 설정을 덮어쓸 수 있다 — `secure` 목록에 없는 키(theme/themeVariables/
// themeCSS 등)는 저작자가 임의로 바꿔치기할 수 있다는 뜻이다. themeCSS를 덮어써서 페이지 전역
// CSS를 주입하는 시나리오를 막기 위해, 우리가 쓰는 설정 키를 전부 이 목록에 명시한다.
const MERMAID_SECURE_KEYS = [
  "secure",
  "securityLevel",
  "startOnLoad",
  "maxTextSize",
  "theme",
  "themeVariables",
  "themeCSS",
  "fontFamily",
];

// mermaid.initialize()는 모듈 전역 설정이다 — 두 렌더가 겹치면 나중에 initialize한 쪽이
// 먼저 render 중이던 다이어그램의 설정까지 바꿔버릴 수 있다. 모든 렌더를 하나의 체인으로
// 직렬화해 이 컴포넌트 인스턴스가 여러 개여도(한 씬에 다이어그램이 여럿) 겹치지 않게 한다.
let renderQueue: Promise<unknown> = Promise.resolve();

export function MermaidDiagramBlock({ definition }: { definition: string }) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const diagramId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  useEffect(() => {
    let cancelled = false;

    const task = renderQueue.then(async () => {
      if (cancelled) {
        return;
      }

      setError(false);

      try {
        const { default: mermaid } = await import("mermaid");

        if (cancelled) {
          return;
        }

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          secure: MERMAID_SECURE_KEYS,
          theme: "base",
          themeVariables: readMermaidThemeVariables(),
          themeCSS: readMermaidThemeCss(),
        });

        const { svg } = await mermaid.render(`mermaid-${diagramId}`, definition);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("[MermaidDiagramBlock]", err);
        if (!cancelled) {
          setError(true);
        }
      }
    });

    renderQueue = task;

    return () => {
      cancelled = true;
    };
  }, [definition, diagramId, resolvedTheme]);

  if (error) {
    return <p className="lesson-block-mermaid-error">다이어그램을 표시할 수 없습니다.</p>;
  }

  return <div className="lesson-block-mermaid" ref={containerRef} role="img" aria-label="다이어그램" />;
}
