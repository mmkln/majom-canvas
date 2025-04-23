export interface CanvasPositionDTO {
  /** Optional ID returned by backend */
  id?: number;
  /** ID of Canvas to which this position belongs */
  canvas: number;
  /** ContentType ID (Django) of the element */
  content_type: number;
  /** Model name of the element ('task','story','goal', etc.) */
  element_type: string;
  /** Primary key of the element instance */
  object_id: number;
  /** Read-only alias of object_id */
  element_id: number;
  /** X coordinate on canvas */
  x: number;
  /** Y coordinate on canvas */
  y: number;
  /** Optional metadata (size, color, grouping, etc.) */
  meta?: Record<string, any>;
}
