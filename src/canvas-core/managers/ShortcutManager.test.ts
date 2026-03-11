import { describe, expect, it } from 'vitest';
import { ShortcutManager } from './ShortcutManager.ts';

type MockKeyboardEventOptions = {
  key?: string;
  code?: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  target?: HTMLElement | null;
};

const createKeyboardEvent = (
  options: MockKeyboardEventOptions = {}
): KeyboardEvent => {
  const event = {
    key: options.key ?? '',
    code: options.code ?? '',
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    metaKey: options.metaKey ?? false,
    target: options.target ?? null,
    preventDefault: () => undefined,
    stopPropagation: () => undefined,
  };
  return event as unknown as KeyboardEvent;
};

describe('canvas-core ShortcutManager', () => {
  it('executes registered handlers for matching combos', () => {
    const manager = new ShortcutManager({ autoAttach: false });
    let calls = 0;
    manager.register('ctrl+a', () => {
      calls += 1;
    });

    const event = createKeyboardEvent({
      key: 'a',
      code: 'KeyA',
      ctrlKey: true,
    });
    manager.handleKeyDown(event);

    expect(calls).toBe(1);
  });

  it('ignores editable targets by default', () => {
    const manager = new ShortcutManager({ autoAttach: false });
    let calls = 0;
    manager.register('ctrl+a', () => {
      calls += 1;
    });

    const editableTarget = {
      tagName: 'INPUT',
      isContentEditable: false,
    } as HTMLElement;
    const event = createKeyboardEvent({
      key: 'a',
      code: 'KeyA',
      ctrlKey: true,
      target: editableTarget,
    });
    manager.handleKeyDown(event);

    expect(calls).toBe(0);
  });
});

