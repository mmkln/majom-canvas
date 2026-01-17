interface ImportMetaEnv {
  readonly VITE_CANVAS_PERF_LOG?: string;
  readonly VITE_CONTENT_TYPE_TASK?: string;
  readonly VITE_CONTENT_TYPE_STORY?: string;
  readonly VITE_CONTENT_TYPE_GOAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
