export type TempConnectionLine = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export interface ConnectionInteractionAdapter<TConnection = unknown> {
  /**
   * Hit-tests existing connection under pointer.
   */
  hitTest(x: number, y: number): TConnection | null;
  /**
   * Starts connection creation interaction.
   */
  start(x: number, y: number): boolean;
  /**
   * Updates in-progress connection preview endpoint.
   */
  update(x: number, y: number): boolean;
  /**
   * Finalizes in-progress connection creation.
   */
  finish(): boolean;
  /**
   * Returns whether connection creation is currently active.
   */
  isCreating(): boolean;
  /**
   * Cancels in-progress connection creation.
   */
  cancel(): void;
  /**
   * Returns temporary preview line for rendering.
   */
  getTemporaryLine(): TempConnectionLine | null;
}

export type InteractionEventType = 'drag' | 'select' | 'resize';

export type InteractionEventSink<TElement = unknown> = {
  onInteractionStart?: (interactionType: InteractionEventType) => void;
  onInteractionEnd?: (interactionType: InteractionEventType) => void;
  onContextMenuRequested?: (payload: {
    element: TElement | null;
    sceneX: number;
    sceneY: number;
  }) => void;
};

export type MovePositionsMap = Map<string, { x: number; y: number }>;
export type ResizeBoundsMap = Map<
  string,
  { x: number; y: number; width: number; height: number }
>;

export type InteractionCommandSink = {
  /**
   * Executes move command with initial/final positions.
   */
  executeMove?: (initial: MovePositionsMap, final: MovePositionsMap) => void;
  /**
   * Executes resize command with initial/final bounds.
   */
  executeResize?: (initial: ResizeBoundsMap, final: ResizeBoundsMap) => void;
};
