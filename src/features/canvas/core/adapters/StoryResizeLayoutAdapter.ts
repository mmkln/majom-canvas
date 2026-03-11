import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import type { PanZoomManager } from '../managers/PanZoomManager.ts';

export type ResizeHandleDirection = 'nw' | 'ne' | 'se' | 'sw';

export type ResizableCanvasElement = ICanvasElement & {
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
  hoveredResizeHandle?: ResizeHandleDirection | null;
  getResizeHandleDirectionAt(
    sceneX: number,
    sceneY: number,
    panZoom: PanZoomManager
  ): ResizeHandleDirection | null;
};

export type ResizeMovedTasks = {
  initial: Map<string, { x: number; y: number }>;
  final: Map<string, { x: number; y: number }>;
};

export type StoryResizeStartContext = {
  story: ResizableCanvasElement;
  sceneElements: ICanvasElement[];
};

export type StoryResizeUpdateContext = {
  story: ResizableCanvasElement;
  sceneElements: ICanvasElement[];
  nextWidth: number;
  nextHeight: number;
};

export type StoryResizeUpdateResult = {
  nextWidth: number;
  nextHeight: number;
};

export interface StoryResizeLayoutAdapter {
  onResizeStart(context: StoryResizeStartContext): void;
  onResizeUpdate(context: StoryResizeUpdateContext): StoryResizeUpdateResult;
  collectMovedTasks(sceneElements: ICanvasElement[]): ResizeMovedTasks;
  clear(): void;
}

export class NoopStoryResizeLayoutAdapter implements StoryResizeLayoutAdapter {
  public onResizeStart(_context: StoryResizeStartContext): void {
    // no-op
  }

  public onResizeUpdate(
    context: StoryResizeUpdateContext
  ): StoryResizeUpdateResult {
    return {
      nextWidth: context.nextWidth,
      nextHeight: context.nextHeight,
    };
  }

  public collectMovedTasks(_sceneElements: ICanvasElement[]): ResizeMovedTasks {
    return {
      initial: new Map<string, { x: number; y: number }>(),
      final: new Map<string, { x: number; y: number }>(),
    };
  }

  public clear(): void {
    // no-op
  }
}
