// 참고 레퍼런스 사이트(leedh84.chatgpt.site)의 일러스트는 제3자 산출물이라 라이선스가
// 불분명해 재사용할 수 없고, 이 환경에는 이미지 생성 도구도 없다. 기본 도형(rect/circle/line)만으로
// "레슨 카드 + 이를 읽는 AI 노드 네트워크"를 표현한 오리지널 SVG로 대체한다 — 색은 전부 CSS 변수를
// 참조해 라이트/다크 테마에 자동으로 맞춰진다.
export function LessonHeroIllustration() {
  return (
    <svg className="lesson-hero-illustration" viewBox="0 0 320 260" aria-hidden="true">
      <rect className="lesson-hero-illustration-backdrop" x="0" y="0" width="320" height="260" rx="28" />
      <rect className="lesson-hero-illustration-card" x="36" y="56" width="180" height="150" rx="12" />
      <line className="lesson-hero-illustration-line" x1="56" y1="90" x2="196" y2="90" />
      <line className="lesson-hero-illustration-line" x1="56" y1="114" x2="176" y2="114" />
      <line className="lesson-hero-illustration-line" x1="56" y1="138" x2="196" y2="138" />
      <line className="lesson-hero-illustration-line" x1="56" y1="162" x2="150" y2="162" />
      <g className="lesson-hero-illustration-network">
        <line x1="196" y1="70" x2="240" y2="46" />
        <line x1="196" y1="70" x2="252" y2="88" />
        <line x1="240" y1="46" x2="252" y2="88" />
        <line x1="252" y1="88" x2="286" y2="70" />
        <circle cx="196" cy="70" r="6" />
        <circle cx="240" cy="46" r="7" />
        <circle cx="252" cy="88" r="9" />
        <circle cx="286" cy="70" r="5" />
      </g>
    </svg>
  );
}
