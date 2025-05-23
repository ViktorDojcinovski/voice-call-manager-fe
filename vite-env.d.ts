interface ImportMetaEnv {
  VITE_BACKEND_URL: string;
  VITE_BACKEND_DOMAIN: string;
  MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
