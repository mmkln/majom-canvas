export interface CanvasPositionReadDTO {
  /** UUID returned by backend */
  id: string;
  /** Canvas UUID */
  canvas: string;
  /** Model name of the element ('task','story','goal', etc.) */
  element_type: string;
  /** UUID of the element */
  element_uuid: string;
  /** X coordinate on canvas */
  x: number;
  /** Y coordinate on canvas */
  y: number;
  /** Optional metadata (size, color, grouping, goalScale, etc.) */
  meta?: Record<string, any> | null;
}

export interface CanvasPositionWriteDTO {
  /** Canvas UUID (required for /canvas/positions/batch/, omitted for bulk) */
  canvas?: string;
  /** Model name of the element ('task','story','goal', etc.) */
  element_type: string;
  /** UUID of the element */
  element_uuid: string;
  /** X coordinate on canvas */
  x?: number;
  /** Y coordinate on canvas */
  y?: number;
  /** Optional metadata (size, color, grouping, goalScale, etc.) */
  meta?: Record<string, any> | null;
}
