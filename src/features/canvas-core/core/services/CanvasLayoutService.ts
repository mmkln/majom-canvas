import type {
  CanvasLayoutMetrics,
  ICanvasLayoutContainer,
} from '../../elements/interfaces/canvasLayoutContainer.ts';
import type { IStructuredCanvasNode } from '../../elements/interfaces/structuredCanvasNode.ts';

type ChildInsertPlan = {
  position: { x: number; y: number };
  nextHeight: number;
};

type AlignChildrenPlan = {
  positions: Map<string, { x: number; y: number }>;
  nextHeight: number;
};

type ResizeChildrenPlan<TChild extends IStructuredCanvasNode> = {
  positions: Map<string, { x: number; y: number }>;
  nextWidth: number;
  nextHeight: number;
  orderedChildren: TChild[];
};

export class CanvasLayoutService {
  public planAddChild<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    container: TContainer,
    children: TChild[]
  ): ChildInsertPlan {
    const inside = this.getLayoutChildren(container, children);
    const metrics = container.getLayoutMetrics();
    const columns = this.getColumns(container);
    const occupied = inside.map((child) => this.getNodeRect(child));

    let row = 0;
    while (true) {
      for (let col = 0; col < columns; col += 1) {
        const position = this.getCellPosition(container, row, col);
        const candidate = {
          x: position.x,
          y: position.y,
          width: metrics.childWidth,
          height: metrics.childHeight,
        };
        if (!this.intersectsAny(candidate, occupied)) {
          const nextHeight = this.getRequiredHeight(container, row + 1);
          return { position, nextHeight };
        }
      }
      row += 1;
    }
  }

  public planAlignChildren<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    container: TContainer,
    children: TChild[]
  ): AlignChildrenPlan {
    const inside = this.getLayoutChildren(container, children);
    if (inside.length === 0) {
      return { positions: new Map(), nextHeight: container.height };
    }
    const ordered = this.getOrderedChildren(inside);
    const columns = this.getColumns(container);
    const positions = new Map<string, { x: number; y: number }>();
    ordered.forEach((child, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      positions.set(child.id, this.getCellPosition(container, row, col));
    });
    const rows = Math.ceil(ordered.length / columns);
    const nextHeight = this.getRequiredHeight(container, rows);
    return { positions, nextHeight };
  }

  public planResize<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    container: TContainer,
    children: TChild[],
    nextWidth: number,
    nextHeight: number
  ): ResizeChildrenPlan<TChild> {
    const layoutChildren = this.getLayoutChildren(container, children);
    return this.planLayoutForSortedChildren(
      container,
      layoutChildren,
      nextWidth,
      nextHeight
    );
  }

  public planLayoutForSortedChildren<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    container: TContainer,
    layoutChildren: TChild[],
    nextWidth: number,
    nextHeight: number
  ): ResizeChildrenPlan<TChild> {
    const ordered = this.getOrderedChildren(layoutChildren);
    return this.planLayoutForOrderedChildren(
      container,
      ordered,
      nextWidth,
      nextHeight
    );
  }

  public planLayoutForOrderedChildren<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    container: TContainer,
    orderedChildren: TChild[],
    nextWidth: number,
    nextHeight: number
  ): ResizeChildrenPlan<TChild> {
    const ordered = [...orderedChildren];
    const hasChildren = ordered.length > 0;
    const metrics = container.getLayoutMetrics();
    const minWidth = hasChildren ? this.getMinWidth(metrics) : 1;
    const clampedWidth = Math.max(nextWidth, minWidth, 1);
    const columns = hasChildren
      ? this.getColumnsForWidth(clampedWidth, metrics)
      : 1;
    const rows = hasChildren ? Math.ceil(ordered.length / columns) : 0;
    const requiredHeight = hasChildren
      ? this.getRequiredHeightForRows(rows, metrics)
      : 0;
    const clampedHeight = Math.max(nextHeight, requiredHeight, 1);
    const positions = new Map<string, { x: number; y: number }>();
    ordered.forEach((child, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      positions.set(child.id, this.getCellPosition(container, row, col));
    });
    return {
      positions,
      nextWidth: clampedWidth,
      nextHeight: clampedHeight,
      orderedChildren: ordered,
    };
  }

  public getInsertionIndex<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    container: TContainer,
    existingChildCount: number,
    pointX: number,
    pointY: number,
    width: number = container.width
  ): number {
    const metrics = container.getLayoutMetrics();
    const columns = this.getColumnsForWidth(width, metrics);
    const cellWidth = metrics.childWidth + metrics.gap;
    const cellHeight = metrics.childHeight + metrics.gap;
    const startX = container.x + metrics.paddingX;
    const startY = container.y + metrics.header + metrics.paddingY;
    const col = Math.max(
      0,
      Math.min(
        columns - 1,
        Math.floor((pointX - startX + metrics.childWidth / 2) / cellWidth)
      )
    );
    const row = Math.max(
      0,
      Math.floor((pointY - startY + metrics.childHeight / 2) / cellHeight)
    );
    const index = row * columns + col;
    return Math.max(0, Math.min(existingChildCount, index));
  }

  public getLayoutChildren<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    container: TContainer,
    children: TChild[]
  ): TChild[] {
    const orderedChildren = container.getOrderedLayoutChildren();
    if (orderedChildren.length === 0) {
      return this.getChildrenInsideContainer(container, children);
    }

    const childById = new Map(children.map((child) => [child.id, child]));
    const ordered: TChild[] = [];
    const seen = new Set<string>();

    orderedChildren.forEach((childRef) => {
      const child = childById.get(childRef.id);
      if (!child || !container.acceptsLayoutChild(child)) return;
      ordered.push(child);
      seen.add(child.id);
    });

    const missingInside = this.getChildrenInsideContainer(container, children)
      .filter((child) => !seen.has(child.id))
      .sort((a, b) => {
        if (a.y === b.y) return a.x - b.x;
        return a.y - b.y;
      });

    const combined =
      missingInside.length > 0 ? [...ordered, ...missingInside] : ordered;

    return this.getOrderedChildren(combined);
  }

  private getColumns<TChild extends IStructuredCanvasNode>(
    container: ICanvasLayoutContainer<TChild>
  ): number {
    return this.getColumnsForWidth(container.width, container.getLayoutMetrics());
  }

  private getColumnsForWidth(
    width: number,
    metrics: CanvasLayoutMetrics
  ): number {
    const availableWidth = Math.max(0, width - metrics.paddingX * 2);
    return Math.max(
      1,
      Math.floor(
        (availableWidth + metrics.gap) / (metrics.childWidth + metrics.gap)
      )
    );
  }

  private getCellPosition<TChild extends IStructuredCanvasNode>(
    container: ICanvasLayoutContainer<TChild>,
    row: number,
    col: number
  ): { x: number; y: number } {
    const metrics = container.getLayoutMetrics();
    const x =
      container.x + metrics.paddingX + col * (metrics.childWidth + metrics.gap);
    const y =
      container.y +
      metrics.header +
      metrics.paddingY +
      row * (metrics.childHeight + metrics.gap);
    return { x, y };
  }

  private getRequiredHeight<TChild extends IStructuredCanvasNode>(
    container: ICanvasLayoutContainer<TChild>,
    rows: number
  ): number {
    return Math.max(
      container.height,
      this.getRequiredHeightForRows(rows, container.getLayoutMetrics())
    );
  }

  private getRequiredHeightForRows(
    rows: number,
    metrics: CanvasLayoutMetrics
  ): number {
    if (rows <= 0) {
      return metrics.header + metrics.paddingY * 2;
    }
    return (
      metrics.header +
      metrics.paddingY * 2 +
      rows * metrics.childHeight +
      Math.max(0, rows - 1) * metrics.gap
    );
  }

  private getMinWidth(metrics: CanvasLayoutMetrics): number {
    return metrics.paddingX * 2 + metrics.childWidth;
  }

  private getOrderedChildren<TChild extends IStructuredCanvasNode>(
    children: TChild[]
  ): TChild[] {
    return [...children].sort((a, b) => {
      if (a.y === b.y) return a.x - b.x;
      return a.y - b.y;
    });
  }

  private getChildrenInsideContainer<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    container: TContainer,
    children: TChild[]
  ): TChild[] {
    const containerRect = {
      x: container.x,
      y: container.y,
      width: container.width,
      height: container.height,
    };
    return children.filter((child) =>
      this.intersects(containerRect, this.getNodeRect(child))
    );
  }

  private getNodeRect(child: IStructuredCanvasNode): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return {
      x: child.x,
      y: child.y,
      width: child.width,
      height: child.height,
    };
  }

  private intersectsAny(
    candidate: { x: number; y: number; width: number; height: number },
    occupied: Array<{ x: number; y: number; width: number; height: number }>
  ): boolean {
    return occupied.some((rect) => this.intersects(candidate, rect));
  }

  private intersects(
    left: { x: number; y: number; width: number; height: number },
    right: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(
      left.x + left.width <= right.x ||
      right.x + right.width <= left.x ||
      left.y + left.height <= right.y ||
      right.y + right.height <= left.y
    );
  }
}
