/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_SEARCH_ENDPOINT?: string;
  readonly VITE_WIKI_DOCUMENTS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
