export interface CanvasPositionDTO {
  /** Optional UUID returned by backend */
  id?: string;
  /** Canvas UUID (required for /canvas/positions/ write, omitted for bulk) */
  canvas?: string;
  /** ContentType ID (Django) for write */
  content_type?: number;
  /** Model name of the element ('task','story','goal', etc.) */
  element_type?: string;
  /** Primary key of the element instance (write) */
  object_id?: number;
  /** Read-only alias of object_id (read) */
  element_id?: number;
  /** X coordinate on canvas */
  x: number;
  /** Y coordinate on canvas */
  y: number;
  /** Optional metadata (size, color, grouping, etc.) */
  meta?: Record<string, any>;
}
