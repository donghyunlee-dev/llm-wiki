import { StaticPageShell } from "./StaticPageShell";

export function ProjectDesignPage() {
  return (
    <StaticPageShell
      title="프로젝트 설계 시작"
      body="이 단계는 메인 화면의 주역이 아니라 가이드와 사례를 확인한 다음 이어지는 보조 흐름입니다. MVP에서는 진입 라우트와 설명 구조만 제공합니다."
      items={["문제 정리", "필요한 자료 확인", "설계 방향 기록"]}
    />
  );
}
