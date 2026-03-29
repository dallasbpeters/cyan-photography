/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Set by `pnpm dev:local` — ignore VITE_API_BASE_URL and use same-origin /api → Vite proxy */
  readonly VITE_USE_LOCAL_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
