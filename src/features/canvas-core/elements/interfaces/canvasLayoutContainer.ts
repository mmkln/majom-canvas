import type { IStructuredCanvasNode } from './structuredCanvasNode.ts';
import type { PanZoomManager } from '../../core/managers/PanZoomManager.ts';

export type CanvasLayoutMetrics = {
  paddingX: number;
  paddingY: number;
  gap: number;
  header: number;
  childWidth: number;
  childHeight: number;
};

export interface ICanvasLayoutContainer<
  TChild extends IStructuredCanvasNode = IStructuredCanvasNode,
> extends IStructuredCanvasNode {
  getLayoutMetrics(): CanvasLayoutMetrics;
  getOrderedLayoutChildren(): TChild[];
  replaceOrderedLayoutChildren(children: TChild[]): void;
  acceptsLayoutChild(element: IStructuredCanvasNode): element is TChild;
  getResizeHandleDirectionAt?(
    px: number,
    py: number,
    panZoom: PanZoomManager
  ): 'nw' | 'ne' | 'se' | 'sw' | null;
}
