# SFOOD AI Wiki — Edge Sidebar 확장 프로그램

## 개요

Microsoft Edge (및 Chrome) 브라우저에서 동작하는 Manifest V3 Side Panel 확장 프로그램이다.  
사내 SFOOD Wiki에 접속하지 않아도 현재 브라우징 중인 탭 옆 사이드 패널에서 위키를 검색하고 가이드를 열람할 수 있다.

- **지원 브라우저:** Microsoft Edge 114+, Chrome 114+
- **위치:** `apps/edge-sidebar/`
- **Manifest 버전:** MV3
- **권한:** `sidePanel`, `storage`, `host_permissions: <all_urls>`

---

## 구성 요소

```
contentScript.ts   — 모든 페이지에 삽입. 플로팅 런처 UI 주입 및 이벤트 처리
background.ts      — Service Worker. 사이드 패널 열기/닫기 상태 관리
sidepanel/         — 사이드 패널 React 앱 (검색, 가이드 뷰어)
  main.tsx
  wikiClient.ts
  styles.css
```

---

## 플로팅 런처

모든 웹 페이지 오른쪽에 주입되는 플로팅 버튼 그룹이다. Shadow DOM으로 격리되어 호스트 페이지 스타일의 영향을 받지 않는다.

### 버튼 구성

| 버튼 | 위치 | 기능 |
|---|---|---|
| 책 아이콘 (메인) | 항상 표시 | 사이드 패널 열기 / 닫기 토글. 드래그로 수직 위치 조정 가능 |
| 홈 아이콘 | 마우스 오버 시 위로 펼침 | Wiki 홈 페이지를 새 탭으로 열기 |
| 설정 아이콘 | 마우스 오버 시 아래로 펼침 | 설정 팝업 열기/닫기 |

### 드래그 위치 조정

책 아이콘을 위아래로 드래그하여 런처의 수직 위치를 조정할 수 있다. 놓으면 자동으로 상단 또는 하단 영역으로 도킹되며 위치가 저장된다.

### 설정 팝업

설정 아이콘 클릭 시 열린다.

| 설정 항목 | 설명 |
|---|---|
| Wiki URL | 사이드 패널이 요청을 보낼 위키 서버 주소 |
| 상단 / 하단 | 런처 도킹 위치 전환 |
| 런처 숨기기 | 런처를 슬라이버 모드로 전환 |

### 런처 숨기기 (슬라이버 모드)

설정 팝업의 "런처 숨기기" 버튼 또는 책 아이콘 우클릭으로 전환된다.

- **숨김 상태:** 런처가 오른쪽으로 46px 슬라이드되어 책 아이콘 좌측 8px 슬라이버만 노출
- **호버 시:** 런처가 0.2s 애니메이션으로 복귀하여 정상 사용 가능
- **마우스 이탈 시:** 다시 슬라이버로 복귀
- **영구 복원:** 사이드 패널 내 눈 아이콘(👁) 버튼 클릭 → `launcherHidden: false` 저장

> 삼성 갤럭시의 Edge Panel과 동일한 UX 패턴이다.

---

## 사이드 패널 열기/닫기

### 열기

- 책 아이콘 클릭
- 브라우저 툴바 확장 아이콘 클릭 (Edge 액션 버튼)

### 닫기

- 책 아이콘 클릭 (토글)
- 패널 우측 상단 X 버튼으로 강제 닫기

### 상태 동기화

패널 열림/닫힘 상태는 `chrome.storage.session`에 탭 단위로 저장되어 Service Worker 재시작 후에도 유지된다.

패널을 X 버튼으로 강제 닫으면, 사이드 패널 앱이 `chrome.runtime.connect` 포트로 연결되어 있어 페이지 언로드 시 포트 단절 이벤트가 발생하고 백그라운드 상태가 자동으로 `false`로 갱신된다. 따라서 강제 닫기 후 1번 클릭으로 다시 열 수 있다.

---

## 사이드 패널 기능

### 검색 (Q&A)

- 하단 텍스트 영역에 질문을 입력하고 Enter 또는 전송 버튼으로 제출
- `Shift+Enter`로 줄바꿈 가능
- 맞춤법 검사 비활성화 (빨간 밑줄 없음)
- 질문/답변이 채팅 형식으로 쌓이며 새 항목이 추가될 때마다 자동 스크롤
- 답변 내 참고 문서 목록 표시

### 가이드 뷰어

검색 결과의 참고 문서를 클릭하면 사이드 패널 내부에서 가이드 본문을 열람할 수 있다.

- 좌측 상단 `←` 버튼으로 검색 화면 복귀
- 가이드 본문 내 링크 클릭 동작:
  - 위키 내부 링크 → 사이드 패널 안에서 해당 가이드로 이동
  - 외부 링크 → 새 탭으로 열기
- **관련 페이지 섹션:** 가이드 하단에 `metadata.related`에 등록된 관련 문서 목록을 링크로 표시. 클릭 시 해당 가이드로 이동

### 위키 홈 이동

패널 상단 홈 아이콘 클릭 → Wiki 홈 페이지를 새 탭으로 열기

### 런처 복원

패널 상단 눈 아이콘 클릭 → 숨겨진 런처를 다시 표시

---

## 기술 구조

### 상태 관리

| 저장소 | 키 | 내용 |
|---|---|---|
| `chrome.storage.local` | `sfoodWikiSidebar.baseUrl` | Wiki 서버 URL |
| `chrome.storage.local` | `sfoodWikiSidebar.launcherDock` | 런처 도킹 위치 (`top` / `bottom`) |
| `chrome.storage.local` | `sfoodWikiSidebar.launcherHidden` | 런처 숨김 상태 |
| `chrome.storage.local` | `sfoodWikiSidebar.launcherOffsetY` | 런처 수직 위치(px) |
| `chrome.storage.session` | `sfoodWikiSidebar.panelOpenByTarget` | 탭별 패널 열림 상태 (SW 재시작 복원용) |

### 패널 열기/닫기 API

`chrome.sidePanel` API (Manifest V3)를 사용한다.

| 동작 | 방법 |
|---|---|
| 탭 단위 열기 | `sidePanel.setOptions({ tabId, enabled: true })` + `sidePanel.open({ tabId })` |
| 탭 단위 닫기 | `sidePanel.setOptions({ tabId, enabled: false })` |

> `sidePanel.close({ windowId })`는 윈도우 단위 패널에만 유효하므로 탭 단위 패널에는 사용하지 않는다.

### 포트 기반 닫힘 감지

패널 앱 마운트 시 `chrome.runtime.connect({ name: "sfood-wiki:tab:{tabId}" })`로 백그라운드와 장기 연결을 맺는다. 패널이 닫히면 페이지가 언로드되면서 포트가 단절되고, 백그라운드의 `onDisconnect` 핸들러가 상태를 `false`로 갱신한다.

### 파일별 역할

| 파일 | 역할 |
|---|---|
| `contentScript.ts` | 런처 Shadow DOM 주입, 드래그, 설정 팝업, 숨기기 토글 |
| `background.ts` | Service Worker. 패널 열기/닫기, 상태 저장/복원, 포트 감지 |
| `sidepanel/main.tsx` | React 앱. 검색 UI, 가이드 뷰어, 포트 연결 |
| `sidepanel/wikiClient.ts` | Wiki API 요청, 응답 정규화, 관련 문서 해석 |
| `chrome.d.ts` | Chrome Extension API 타입 선언 |
| `public/manifest.json` | 확장 프로그램 설정 (MV3) |

---

## 빌드 및 설치

### 빌드

```bash
# 전체 워크스페이스 루트에서
pnpm --filter @sfood/edge-sidebar build

# edge-sidebar 디렉토리에서
pnpm build
```

빌드 결과물은 `apps/edge-sidebar/dist/`에 생성된다.

### Edge/Chrome에 설치 (개발용)

1. `edge://extensions` 또는 `chrome://extensions` 열기
2. 개발자 모드 활성화
3. "압축 해제된 확장 프로그램 로드" 클릭
4. `apps/edge-sidebar/dist/` 선택

### Wiki URL 변경

설치 후 런처의 설정 아이콘(⚙) → Wiki URL 입력란에 실제 위키 서버 주소 입력 후 Enter.

기본값: `http://localhost:5173`

---

## 알려진 제약

| 제약 | 설명 |
|---|---|
| Edge 114+ / Chrome 114+ 필요 | `chrome.sidePanel` API 지원 버전 |
| 탭 이동 시 패널 상태 독립 | 탭마다 별도 패널 상태를 관리하므로, 탭 전환 시 패널이 닫힐 수 있음 |
| 가이드 본문 Confluence 링크 | Confluence 절대 URL은 `isInternalWikiHref` 판정에서 외부 링크로 처리되어 새 탭으로 열림 |
