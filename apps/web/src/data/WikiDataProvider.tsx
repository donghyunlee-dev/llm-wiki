import {
  loadWikiDocuments,
  type WikiDataSourceMode,
  type WikiDocument,
} from "@sfood/wiki-core";
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WikiDataState = {
  documents: WikiDocument[];
  isLoading: boolean;
  errorMessage: string | null;
  sourceMode: WikiDataSourceMode;
};

const WikiDataContext = createContext<WikiDataState | null>(null);

function resolveSourceMode(): WikiDataSourceMode {
  return import.meta.env.VITE_WIKI_DATA_SOURCE === "remote" ? "remote" : "snapshot";
}

function resolveRemoteEndpoint() {
  return (
    import.meta.env.VITE_WIKI_REMOTE_ENDPOINT ??
    import.meta.env.VITE_CONFLUENCE_PUBLIC_ENDPOINT
  );
}

async function fetchWikiDocuments(sourceMode: WikiDataSourceMode) {
  if (sourceMode === "remote") {
    const endpoint = resolveRemoteEndpoint();

    if (!endpoint) {
      throw new Error("공개 문서 위치가 설정되지 않았습니다.");
    }

    return loadWikiDocuments({
      mode: "remote",
      endpoint,
    });
  }

  return loadWikiDocuments();
}

export function WikiDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WikiDataState>({
    documents: [],
    isLoading: true,
    errorMessage: null,
    sourceMode: resolveSourceMode(),
  });

  useEffect(() => {
    let cancelled = false;
    const sourceMode = resolveSourceMode();

    void fetchWikiDocuments(sourceMode)
      .then((documents) => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setState({
            documents,
            isLoading: false,
            errorMessage: null,
            sourceMode,
          });
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        const errorMessage = "문서 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";

        startTransition(() => {
          setState({
            documents: [],
            isLoading: false,
            errorMessage,
            sourceMode,
          });
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return <WikiDataContext.Provider value={value}>{children}</WikiDataContext.Provider>;
}

export function useWikiData() {
  const context = useContext(WikiDataContext);

  if (!context) {
    throw new Error("useWikiData must be used within WikiDataProvider.");
  }

  return context;
}
