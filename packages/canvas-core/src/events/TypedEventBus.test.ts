import { describe, expect, it } from 'vitest';
import { TypedEventBus } from './TypedEventBus.ts';

type CanvasCoreEvents = {
  selectionChanged: { selectedIds: string[] };
  inspectorRequested: { elementId: string };
};

describe('canvas-core TypedEventBus', () => {
  it('subscribes and emits typed payloads', () => {
    const bus = new TypedEventBus<CanvasCoreEvents>();
    let captured: string[] = [];

    bus.on('selectionChanged', (payload) => {
      captured = payload.selectedIds;
    });
    bus.emit('selectionChanged', { selectedIds: ['a', 'b'] });

    expect(captured).toEqual(['a', 'b']);
  });

  it('supports unsubscribe', () => {
    const bus = new TypedEventBus<CanvasCoreEvents>();
    let callCount = 0;
    const unsubscribe = bus.on('inspectorRequested', () => {
      callCount += 1;
    });

    bus.emit('inspectorRequested', { elementId: 'x' });
    unsubscribe();
    bus.emit('inspectorRequested', { elementId: 'x' });

    expect(callCount).toBe(1);
  });
});

