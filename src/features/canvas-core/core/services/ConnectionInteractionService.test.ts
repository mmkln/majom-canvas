import { describe, expect, it } from 'vitest';

import type { ConnectionPoint, IShape } from '../interfaces/shape.ts';
import type { PanZoomManager } from '../managers/PanZoomManager.ts';
import { Scene } from '../scene/Scene.ts';
import { ConnectionInteractionService } from './ConnectionInteractionService.ts';

function createShape(
  id: string,
  pointOverrides: Partial<ConnectionPoint> = {}
): IShape {
  const point: ConnectionPoint = {
    x: 24,
    y: 24,
    angle: 0,
    isHovered: false,
    direction: 'right',
    ...pointOverrides,
  };

  return {
    id,
    x: 0,
    y: 0,
    radius: 12,
    fillColor: '#ffffff',
    lineWidth: 1,
    isHovered: false,
    selected: false,
    zIndex: 1,
    draw(): void {},
    contains(): boolean {
      return true;
    },
    getBoundaryPoint(): { x: number; y: number } {
      return { x: 24, y: 24 };
    },
    getConnectionPoints(): ConnectionPoint[] {
      return [point];
    },
    clone(): IShape {
      return createShape(id, pointOverrides);
    },
    getNearestPoint(): { x: number; y: number } {
      return { x: 24, y: 24 };
    },
    drawAnchors(): void {},
    drawConnectionLine(): void {},
  };
}

describe('ConnectionInteractionService', () => {
  it('starts connection creation from interactive points', () => {
    const scene = new Scene();
    scene.addElement(createShape('shape-1'));
    const service = new ConnectionInteractionService(
      scene,
      { scale: 1 } as PanZoomManager
    );

    expect(service.start(24, 24)).toBe(true);
  });

  it('ignores non-interactive connection points', () => {
    const scene = new Scene();
    scene.addElement(
      createShape('shape-1', {
        isInteractive: false,
      })
    );
    const service = new ConnectionInteractionService(
      scene,
      { scale: 1 } as PanZoomManager
    );

    expect(service.start(24, 24)).toBe(false);
  });
});
