#!/usr/bin/env node
// pnpm은 git 의존성(@sfood/ui)의 `prepare` 빌드 스크립트를 임시 디렉터리에서 실행한 뒤,
// 새로 생성된 dist/를 최종 node_modules 링크 위치로 옮기지 못하는 경우가 있다
// (pnpm 10.0.0 확인됨). `pnpm install`만으로는 dist가 비어 있을 수 있으므로,
// postinstall에서 dist 존재 여부를 확인하고 없으면 그 자리에서 직접 빌드한다.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const webNodeModules = join(repoRoot, "apps/web/node_modules");

// apps/web이 이번 설치 대상이 아니면(예: --filter로 제외) @sfood/ui도 당연히 없다 — 이때만
// 조용히 건너뛴다. apps/web이 설치 대상인데도 resolve가 실패하면 실제 문제이므로 실패시킨다.
if (!existsSync(webNodeModules)) {
  console.warn("[ensure-sfood-ui-dist] apps/web이 설치 대상이 아니라 건너뜁니다.");
  process.exit(0);
}

const require = (await import("node:module")).createRequire(join(repoRoot, "apps/web/package.json"));

// "@sfood/ui"(메인 진입점)는 dist/index.js를 가리켜 dist가 없으면 resolve 자체가 실패한다.
// dist에 의존하지 않는 정적 서브패스(tokens/base.css)로 패키지 루트를 먼저 찾는다.
let tokensPath;
try {
  tokensPath = require.resolve("@sfood/ui/tokens/base.css");
} catch (error) {
  console.error("[ensure-sfood-ui-dist] apps/web은 설치됐는데 @sfood/ui를 resolve할 수 없습니다:", error.message);
  process.exit(1);
}

// tokensPath는 .../@sfood/ui/tokens/base.css이므로 패키지 루트는 두 단계 위다.
const pkgDir = dirname(dirname(tokensPath));
const distEntry = join(pkgDir, "dist", "index.js");

if (existsSync(distEntry)) {
  process.exit(0);
}

console.log("[ensure-sfood-ui-dist] dist/index.js가 없어 @sfood/ui를 직접 빌드합니다...");
execFileSync("npm", ["run", "build"], { cwd: pkgDir, stdio: "inherit" });

if (!existsSync(distEntry)) {
  console.error("[ensure-sfood-ui-dist] 빌드 후에도 dist/index.js가 생성되지 않았습니다.");
  process.exit(1);
}
