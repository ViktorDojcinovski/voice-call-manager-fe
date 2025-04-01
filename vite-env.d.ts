interface ImportMetaEnv {
  VITE_BACKEND_URL: string;
  MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
