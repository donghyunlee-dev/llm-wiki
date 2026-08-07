import { Link } from "react-router-dom";
import { useTheme } from "./theme/ThemeProvider";

const themeOptions = [
  { value: "light", label: "라이트", icon: SunIcon },
  { value: "dark", label: "다크", icon: MoonIcon },
  { value: "system", label: "시스템", icon: SystemIcon },
] as const;

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="theme-segmented-control"
      role="group"
      aria-label="테마 선택"
    >
      {themeOptions.map((option) => {
        const selected = theme === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            className={[
              "theme-segmented-option",
              selected
                ? "theme-segmented-option-selected"
                : "theme-segmented-option-idle",
            ].join(" ")}
            aria-pressed={selected}
            aria-label={option.label}
            title={option.label}
            onClick={() => setTheme(option.value)}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

export function SiteHeader() {
  const { resolvedTheme } = useTheme();
  // 다크 배경에서는 CI 로고의 "FOOD" 글자(중간톤 회색)가 흐리게 보여, 텍스트만 밝은 회색으로
  // 다시 칠한 다크 전용 버전을 준비해 테마에 맞춰 교체한다(빨간 "S"는 원본 그대로 유지).
  const logoSrc = resolvedTheme === "dark" ? "/sfood-logo-dark.png" : "/sfood-logo.png";

  return (
    <header className="site-header">
      <Link className="site-brand" to="/">
        <img className="site-brand-logo" src={logoSrc} alt="SFOOD" />
        <span className="site-brand-text">AI WIKI</span>
      </Link>
      <ThemeToggle />
    </header>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="theme-icon">
      <path
        d="M10 4.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0-3v2m0 13v2m8.5-8.5h-2m-13 0h-2m14.5-6.5-1.4 1.4M5.9 14.1l-1.4 1.4m0-12 1.4 1.4m8.2 9.2 1.4 1.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="theme-icon">
      <path
        d="M15.8 13.4A6.7 6.7 0 0 1 6.6 4.2 7 7 0 1 0 15.8 13.4Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="theme-icon">
      <path
        d="M3.5 4.5h13v8.5h-13V4.5Zm4 12h5m-2.5-3.5v3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}
