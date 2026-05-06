/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WIKI_DATA_SOURCE?: "snapshot" | "remote";
  readonly VITE_WIKI_REMOTE_ENDPOINT?: string;
  readonly VITE_CONFLUENCE_PUBLIC_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
