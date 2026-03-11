import type { IViewState } from '../interfaces/viewState.ts';

export type NodeBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface GraphNode<TData = unknown> {
  id: string;
  kind: string;
  bounds: NodeBounds;
  data: TData;
  selected?: boolean;
  zIndex?: number;
}

export interface GraphEdge<TData = unknown> {
  id: string;
  from: string;
  to: string;
  type: string;
  data: TData;
  selected?: boolean;
}

export interface GraphSnapshot<TNodeData = unknown, TEdgeData = unknown> {
  nodes: GraphNode<TNodeData>[];
  edges: GraphEdge<TEdgeData>[];
  view?: IViewState;
}

