import { GoalElement } from '../../elements/GoalElement.ts';
import type { AiAssistantGoalBlueprintAction } from '../../../ai-assistant/aiAssistantActions.ts';

export type GoalPlacementRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GoalPlacementPoint = {
  x: number;
  y: number;
};

type BlueprintRelativePositions = Map<string, GoalPlacementPoint>;

type GoalBlueprintPlacementOptions = {
  occupiedRects: GoalPlacementRect[];
  preferredCenter: GoalPlacementPoint;
  preferDownward?: boolean;
  gapX?: number;
  gapY?: number;
  maxRing?: number;
};

type GoalPlacementOptions = GoalBlueprintPlacementOptions;

export class GoalPlacementService {
  private readonly defaultGapX = GoalElement.width + 96;
  private readonly defaultGapY = GoalElement.height + 120;
  private readonly defaultMaxRing = 24;

  public planGoalPosition(
    options: GoalPlacementOptions
  ): GoalPlacementPoint {
    const positions = this.planTranslatedPositions(
      new Map([['goal', { x: 0, y: 0 }]]),
      options
    );
    return positions.get('goal') ?? options.preferredCenter;
  }

  public planBlueprintPositions(
    action: AiAssistantGoalBlueprintAction,
    options: GoalBlueprintPlacementOptions
  ): Map<string, GoalPlacementPoint> {
    const basePositions =
      action.pattern === 'goal_graph'
        ? this.buildGoalGraphRelativePositions(action)
        : this.buildGoalTreeRelativePositions(action);

    return this.planTranslatedPositions(basePositions, options);
  }

  private planTranslatedPositions(
    basePositions: BlueprintRelativePositions,
    options: GoalBlueprintPlacementOptions
  ): Map<string, GoalPlacementPoint> {
    const occupied = [...options.occupiedRects];
    const gapX = options.gapX ?? this.defaultGapX;
    const gapY = options.gapY ?? this.defaultGapY;
    const maxRing = options.maxRing ?? this.defaultMaxRing;

    for (let ring = 0; ring <= maxRing; ring += 1) {
      const offsets = this.getPlacementOffsets(ring, options.preferDownward);
      for (const offset of offsets) {
        const candidateCenter = {
          x: options.preferredCenter.x + offset.col * gapX,
          y: options.preferredCenter.y + offset.row * gapY,
        };
        const translated = this.translatePositions(basePositions, candidateCenter);
        if (!this.intersectsAny(translated, occupied)) {
          return translated;
        }
      }
    }

    return this.translatePositions(basePositions, options.preferredCenter);
  }

  private buildGoalGraphRelativePositions(
    action: AiAssistantGoalBlueprintAction
  ): Map<string, GoalPlacementPoint> {
    const positions = new Map<string, GoalPlacementPoint>();
    const columnCount = Math.max(2, Math.ceil(Math.sqrt(action.goals.length)));
    const horizontalGap = GoalElement.width + 96;
    const verticalGap = GoalElement.height + 120;
    const rowCount = Math.ceil(action.goals.length / columnCount);

    action.goals.forEach((goal, index) => {
      const column = index % columnCount;
      const row = Math.floor(index / columnCount);
      const x = (column - (columnCount - 1) / 2) * horizontalGap;
      const y = (row - (rowCount - 1) / 2) * verticalGap;
      positions.set(goal.ref, { x, y });
    });

    return positions;
  }

  private buildGoalTreeRelativePositions(
    action: AiAssistantGoalBlueprintAction
  ): Map<string, GoalPlacementPoint> {
    const childrenByParent = new Map<
      string | null,
      AiAssistantGoalBlueprintAction['goals']
    >();
    action.goals.forEach((goal) => {
      const key = goal.parentRef ?? null;
      const bucket = childrenByParent.get(key) ?? [];
      bucket.push(goal);
      childrenByParent.set(key, bucket);
    });

    const leafCounts = new Map<string, number>();
    const depthByRef = new Map<string, number>();
    const countLeaves = (ref: string): number => {
      const cached = leafCounts.get(ref);
      if (typeof cached === 'number') {
        return cached;
      }
      const children = childrenByParent.get(ref) ?? [];
      const count =
        children.length === 0
          ? 1
          : children.reduce((total, child) => total + countLeaves(child.ref), 0);
      leafCounts.set(ref, count);
      return count;
    };
    const collectDepth = (ref: string, depth: number): number => {
      depthByRef.set(ref, depth);
      const children = childrenByParent.get(ref) ?? [];
      if (children.length === 0) {
        return depth;
      }
      return children.reduce((maxDepth, child) => {
        return Math.max(maxDepth, collectDepth(child.ref, depth + 1));
      }, depth);
    };

    const roots = childrenByParent.get(null) ?? action.goals.slice(0, 1);
    const totalLeaves = Math.max(
      1,
      roots.reduce((total, root) => total + countLeaves(root.ref), 0)
    );
    const maxDepth = roots.reduce((depth, root) => {
      return Math.max(depth, collectDepth(root.ref, 0));
    }, 0);

    const horizontalGap = GoalElement.width + 96;
    const verticalGap = GoalElement.height + 120;
    const positions = new Map<string, GoalPlacementPoint>();

    const assign = (goalRef: string, startLeafIndex: number): void => {
      const leafCount = leafCounts.get(goalRef) ?? 1;
      const depth = depthByRef.get(goalRef) ?? 0;
      const x =
        (startLeafIndex + (leafCount - 1) / 2 - (totalLeaves - 1) / 2) *
        horizontalGap;
      const y = (depth - maxDepth / 2) * verticalGap;
      positions.set(goalRef, { x, y });

      let childStartLeafIndex = startLeafIndex;
      const children = childrenByParent.get(goalRef) ?? [];
      children.forEach((child) => {
        assign(child.ref, childStartLeafIndex);
        childStartLeafIndex += leafCounts.get(child.ref) ?? 1;
      });
    };

    let currentLeafIndex = 0;
    roots.forEach((root) => {
      assign(root.ref, currentLeafIndex);
      currentLeafIndex += leafCounts.get(root.ref) ?? 1;
    });

    action.goals.forEach((goal) => {
      if (!positions.has(goal.ref)) {
        positions.set(goal.ref, { x: 0, y: 0 });
      }
    });

    return positions;
  }

  private translatePositions(
    positions: BlueprintRelativePositions,
    center: GoalPlacementPoint
  ): Map<string, GoalPlacementPoint> {
    const translated = new Map<string, GoalPlacementPoint>();
    positions.forEach((position, ref) => {
      translated.set(ref, {
        x: center.x + position.x,
        y: center.y + position.y,
      });
    });
    return translated;
  }

  private getPlacementOffsets(
    ring: number,
    preferDownward: boolean = false
  ): Array<{ col: number; row: number }> {
    if (ring === 0) {
      return [{ col: 0, row: 0 }];
    }

    const offsets: Array<{ col: number; row: number }> = [];
    for (let row = -ring; row <= ring; row += 1) {
      for (let col = -ring; col <= ring; col += 1) {
        if (Math.max(Math.abs(col), Math.abs(row)) !== ring) {
          continue;
        }
        offsets.push({ col, row });
      }
    }

    offsets.sort((left, right) => {
      if (preferDownward) {
        const leftPriority = left.row < 0 ? 1 : 0;
        const rightPriority = right.row < 0 ? 1 : 0;
        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }
        if (left.row !== right.row) {
          return left.row - right.row;
        }
      } else {
        const leftDistance = Math.abs(left.row) + Math.abs(left.col);
        const rightDistance = Math.abs(right.row) + Math.abs(right.col);
        if (leftDistance !== rightDistance) {
          return leftDistance - rightDistance;
        }
      }
      if (Math.abs(left.col) !== Math.abs(right.col)) {
        return Math.abs(left.col) - Math.abs(right.col);
      }
      return left.col - right.col;
    });

    return offsets;
  }

  private intersectsAny(
    positions: Map<string, GoalPlacementPoint>,
    occupied: GoalPlacementRect[]
  ): boolean {
    for (const position of positions.values()) {
      const candidate = this.getRect(position);
      if (occupied.some((rect) => this.intersects(candidate, rect))) {
        return true;
      }
    }
    return false;
  }

  private getRect(position: GoalPlacementPoint): GoalPlacementRect {
    return {
      x: position.x - GoalElement.width / 2,
      y: position.y - GoalElement.height / 2,
      width: GoalElement.width,
      height: GoalElement.height,
    };
  }

  private intersects(
    left: GoalPlacementRect,
    right: GoalPlacementRect
  ): boolean {
    return (
      left.x < right.x + right.width &&
      left.x + left.width > right.x &&
      left.y < right.y + right.height &&
      left.y + left.height > right.y
    );
  }
}
