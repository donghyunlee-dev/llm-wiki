import {
  normalizeConfluencePage,
  type RawConfluencePage,
} from "./confluenceReadModel";
import type { WikiDocument } from "./wikiDocuments";

type SnapshotDefinition = {
  slug: string;
  page: RawConfluencePage;
};

export type SnapshotPayload = {
  pages: SnapshotDefinition[];
};

const SPACE_ID = "63111172";
const BASE_URL = "https://sfoodxproject.atlassian.net/wiki/spaces/LLMWIKI/pages";

const SNAPSHOTS: SnapshotDefinition[] = [
  {
    slug: "guide-index",
    page: {
      id: "91000000",
      title: "가이드 인덱스",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-05-01",
      sourceUrl: `${BASE_URL}/91000000`,
      metadata: {
        docType: "nav",
        audience: "beginner",
        status: "published",
        prerequisites: [],
        next: ["91000001", "91000002", "91000003"],
        related: [],
      },
      bodyHtml: `
        <h1>가이드 인덱스</h1>
        <p>사내 LLM 위키 가이드 문서의 전체 목록과 탐색 경로입니다.</p>
        <h2 id="list">가이드 목록</h2>
        <p>Agent 시작하기, 위키 활용 방법, 프로젝트 설계 시작하기 순서로 읽는 것을 권장합니다.</p>
      `,
    },
  },
  {
    slug: "agent-start",
    page: {
      id: "91000001",
      title: "Agent 시작하기",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-04-28",
      sourceUrl: `${BASE_URL}/91000001`,
      metadata: {
        docType: "nav",
        audience: "beginner",
        status: "published",
        prerequisites: [],
        next: ["91000002"],
        related: ["92000001"],
      },
      bodyHtml: `
        <h1>Agent 시작하기</h1>
        <p>처음 접속한 사용자가 가장 먼저 읽는 출발점입니다.</p>
        <h2 id="why">왜 이 문서를 먼저 읽어야 하나요?</h2>
        <p>기초 흐름을 먼저 이해하면 다른 문서를 읽을 때 길을 잃지 않습니다.</p>
        <h2 id="start">시작 순서</h2>
        <ol>
          <li>위키의 목적을 이해합니다.</li>
          <li>대표 가이드를 읽습니다.</li>
          <li>사례를 참고한 뒤 다음 단계로 넘어갑니다.</li>
        </ol>
      `,
    },
  },
  {
    slug: "wiki-usage",
    page: {
      id: "91000002",
      title: "사내 위키 활용 방법",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-04-28",
      sourceUrl: `${BASE_URL}/91000002`,
      metadata: {
        docType: "guide",
        audience: "beginner",
        status: "published",
        prerequisites: ["91000001"],
        next: ["91000003"],
        related: ["94000001"],
      },
      bodyHtml: `
        <h1>사내 위키 활용 방법</h1>
        <p>무엇을 읽고 어떤 사례를 참고해야 하는지 빠르게 판단하도록 돕습니다.</p>
        <h2 id="flow">추천 탐색 흐름</h2>
        <p>검색, 가이드 확인, 사례 참고, 설계 시작의 순서를 권장합니다.</p>
        <h2 id="tips">문서를 볼 때 확인할 것</h2>
        <ul>
          <li>문서 목적</li>
          <li>대상 사용자</li>
          <li>다음으로 읽을 문서</li>
        </ul>
      `,
    },
  },
  {
    slug: "project-design-start",
    page: {
      id: "91000003",
      title: "프로젝트 설계 시작하기",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-04-28",
      sourceUrl: `${BASE_URL}/91000003`,
      metadata: {
        docType: "guide",
        audience: "intermediate",
        status: "published",
        prerequisites: ["91000002"],
        next: [],
        related: ["92000002"],
      },
      bodyHtml: `
        <h1>프로젝트 설계 시작하기</h1>
        <p>가이드와 사례를 읽은 뒤 실제 문제를 설계 항목으로 정리합니다.</p>
        <h2 id="before">들어가기 전 준비</h2>
        <p>무엇을 바꾸려는지 한 문장으로 정리합니다.</p>
        <h2 id="checklist">설계 메모 체크리스트</h2>
        <ul>
          <li>문제 정의</li>
          <li>대상 사용자</li>
          <li>필요한 자료</li>
        </ul>
      `,
    },
  },
  {
    slug: "approval-tool",
    page: {
      id: "92000001",
      title: "업무 승인 요청 도구",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-04-28",
      sourceUrl: `${BASE_URL}/92000001`,
      metadata: {
        docType: "page",
        audience: "intermediate",
        status: "published",
        prerequisites: [],
        next: ["91000003"],
        related: ["91000001"],
      },
      bodyHtml: `
        <h1>업무 승인 요청 도구</h1>
        <p>반복되는 승인 절차를 간단한 입력 흐름으로 정리한 사례입니다.</p>
        <h2 id="problem">해결한 문제</h2>
        <p>메일과 메신저에 흩어진 승인 요청을 한 흐름으로 묶었습니다.</p>
        <h2 id="result">결과</h2>
        <p>요청 누락을 줄이고 처리 시간을 단축했습니다.</p>
      `,
    },
  },
  {
    slug: "weekly-report-automation",
    page: {
      id: "92000002",
      title: "주간 보고서 자동화",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-04-28",
      sourceUrl: `${BASE_URL}/92000002`,
      metadata: {
        docType: "page",
        audience: "intermediate",
        status: "published",
        prerequisites: [],
        next: ["91000003"],
        related: ["93000002"],
      },
      bodyHtml: `
        <h1>주간 보고서 자동화</h1>
        <p>반복적인 보고서 정리 시간을 줄이기 위해 템플릿과 수집 흐름을 재구성한 사례입니다.</p>
        <h2 id="problem">해결한 문제</h2>
        <p>매주 같은 형식의 보고서를 수작업으로 정리하던 문제를 다뤘습니다.</p>
        <h2 id="result">결과</h2>
        <p>보고서 작성 시간을 줄이고 누락을 줄였습니다.</p>
      `,
    },
  },
  {
    slug: "internal-chatbot",
    page: {
      id: "92000003",
      title: "내부 문의 챗봇",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-04-28",
      sourceUrl: `${BASE_URL}/92000003`,
      metadata: {
        docType: "page",
        audience: "intermediate",
        status: "published",
        prerequisites: [],
        next: ["91000003"],
        related: ["94000001"],
      },
      bodyHtml: `
        <h1>내부 문의 챗봇</h1>
        <p>반복 문의 응답을 빠르게 안내하기 위한 사례입니다.</p>
        <h2 id="problem">해결한 문제</h2>
        <p>같은 질문이 반복되어 담당자 응답 시간이 커지는 문제를 줄였습니다.</p>
        <h2 id="result">결과</h2>
        <p>기본 문의 응답 속도가 빨라졌습니다.</p>
      `,
    },
  },
  {
    slug: "basic-guidelines",
    page: {
      id: "93000001",
      title: "기본 지침서",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-04-28",
      sourceUrl: `${BASE_URL}/93000001`,
      metadata: {
        docType: "library",
        audience: "beginner",
        status: "published",
        prerequisites: [],
        next: [],
        related: ["91000002"],
      },
      bodyHtml: `
        <h1>기본 지침서</h1>
        <p>프로젝트 진행 전에 확인해야 하는 공통 규칙 모음입니다.</p>
        <h2 id="rules">기본 규칙</h2>
        <p>작게 시작하고, 문서를 맞추고, 검증 가능한 범위로 진행합니다.</p>
      `,
    },
  },
  {
    slug: "templates",
    page: {
      id: "93000002",
      title: "템플릿",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-04-28",
      sourceUrl: `${BASE_URL}/93000002`,
      metadata: {
        docType: "library",
        audience: "beginner",
        status: "published",
        prerequisites: [],
        next: [],
        related: ["91000003"],
      },
      bodyHtml: `
        <h1>템플릿</h1>
        <p>작업을 빠르게 시작하도록 돕는 템플릿 모음입니다.</p>
        <h2 id="types">템플릿 종류</h2>
        <p>설계 메모, 체크리스트, 공통 문서 형식을 포함합니다.</p>
      `,
    },
  },
  {
    slug: "common-questions",
    page: {
      id: "94000001",
      title: "자주 묻는 질문",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-04-28",
      sourceUrl: `${BASE_URL}/94000001`,
      metadata: {
        docType: "faq",
        audience: "beginner",
        status: "published",
        prerequisites: [],
        next: [],
        related: ["91000001", "92000003"],
      },
      bodyHtml: `
        <h1>자주 묻는 질문</h1>
        <p>처음 사용하는 직원이 자주 묻는 질문과 답을 모았습니다.</p>
        <h2 id="questions">질문 목록</h2>
        <p>무엇부터 읽어야 하는지, 어떤 사례를 먼저 보면 좋은지 등의 질문을 다룹니다.</p>
      `,
    },
  },
  {
    slug: "ai-first-perspective",
    page: {
      id: "96000001",
      title: "AI를 이해하는 첫 번째 관점",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-07-30",
      sourceUrl: `${BASE_URL}/96000001`,
      metadata: {
        docType: "lesson",
        audience: "beginner",
        status: "published",
        prerequisites: [],
        next: ["96000002"],
        related: [],
      },
      bodyHtml: `
        <h1>AI를 이해하는 첫 번째 관점</h1>
        <h2 id="scene-why-different">AI는 왜 다르게 대답할까</h2>
        <p>같은 질문도 상황에 따라 다른 답이 나오는 경험을 다뤄봅니다.</p>
        <ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">대본</ac:parameter><ac:rich-text-body><p>여기서는 학습자에게 "왜 다르게 대답했을까요?"라고 질문을 던지고 잠시 기다립니다.</p></ac:rich-text-body></ac:structured-macro>
        <h2 id="scene-model-prompt">모델과 프롬프트의 관계</h2>
        <p>모델은 고정되어 있지만 프롬프트가 답을 바꾼다는 점을 설명합니다.</p>
      `,
    },
  },
  {
    slug: "context-and-memory",
    page: {
      id: "96000002",
      title: "컨텍스트와 기억의 한계",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-07-30",
      sourceUrl: `${BASE_URL}/96000002`,
      metadata: {
        docType: "lesson",
        audience: "beginner",
        status: "published",
        prerequisites: ["96000001"],
        next: [],
        related: [],
      },
      bodyHtml: `
        <h1>컨텍스트와 기억의 한계</h1>
        <h2 id="scene-memory-question">분명 앞에서 말했는데</h2>
        <p>대화가 길어지면 AI가 앞선 내용을 놓치는 경험을 다뤄봅니다.</p>
        <ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">대본</ac:parameter><ac:rich-text-body><p>학습자에게 "왜 방금 말한 걸 잊어버렸을까요?"라고 물어봅니다.</p></ac:rich-text-body></ac:structured-macro>
        <h2 id="scene-context-window">컨텍스트 창이 가득 차면</h2>
        <p>오래된 정보부터 밀려난다는 점을 설명합니다.</p>
      `,
    },
  },
];

export function buildSnapshotWikiDocuments(): WikiDocument[] {
  return SNAPSHOTS.map(({ slug, page }) =>
    normalizeConfluencePage(page, slug),
  );
}

export function getSnapshotPayload(): SnapshotPayload {
  return {
    pages: SNAPSHOTS,
  };
}
