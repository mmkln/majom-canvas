interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly VITE_API_URL?: string;
  readonly VITE_CANVAS_PERF_LOG?: string;
  readonly VITE_ENABLE_KANBAN_DEV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
