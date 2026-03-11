import { describe, expect, it } from 'vitest';
import { CommandManager } from './CommandManager.ts';

type StubBindingTarget = {
  register(combo: string, handler: (event: KeyboardEvent) => void): void;
  unregister(combo: string, handler?: (event: KeyboardEvent) => void): void;
};

describe('canvas-core CommandManager', () => {
  it('binds shortcuts and executes registered commands', () => {
    const handlers = new Map<string, ((event: KeyboardEvent) => void)[]>();
    const target: StubBindingTarget = {
      register(combo, handler) {
        const existing = handlers.get(combo) ?? [];
        existing.push(handler);
        handlers.set(combo, existing);
      },
      unregister(combo, handler) {
        if (!handler) {
          handlers.delete(combo);
          return;
        }
        const existing = handlers.get(combo) ?? [];
        handlers.set(
          combo,
          existing.filter((candidate) => candidate !== handler)
        );
      },
    };
    const manager = new CommandManager(target);
    let calls = 0;
    manager.register('save', () => {
      calls += 1;
    });
    manager.bindShortcut('save', 'ctrl+s');

    const registered = handlers.get('ctrl+s');
    expect(registered).toBeDefined();
    registered?.forEach((handler) => handler({} as KeyboardEvent));
    expect(calls).toBe(1);
  });
});

