export type CanvasLoadingPlaceholder = {
  elementType: 'task' | 'story' | 'goal' | 'routine';
  elementUuid: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CanvasLoadPhase =
  | 'idle'
  | 'loading'
  | 'layout-ready'
  | 'elements-partial-ready'
  | 'elements-ready';
