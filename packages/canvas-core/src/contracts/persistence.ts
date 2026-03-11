import type { GraphEdge, GraphSnapshot } from '../types/graph.ts';

export interface PersistenceAdapter<TNodeData = unknown, TEdgeData = unknown> {
  /**
   * Loads full graph snapshot.
   */
  loadSnapshot(): Promise<GraphSnapshot<TNodeData, TEdgeData>>;
  /**
   * Persists node layout (and optional view state).
   */
  saveLayout(snapshot: GraphSnapshot<TNodeData, TEdgeData>): Promise<void>;
  /**
   * Persists graph relations/edges.
   */
  saveRelations(edges: GraphEdge<TEdgeData>[]): Promise<void>;
}
