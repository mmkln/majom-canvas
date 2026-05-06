// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../app-runtime/index.ts';
import { FocusBoardApp } from './FocusBoardApp.ts';
import type { FocusBoardRepository } from './data/FocusBoardRepository.ts';
import { createInitialFocusBoardSnapshot } from './state/FocusBoardStore.ts';

function getTodayLabel(runtime: ReturnType<typeof createAppRuntime>): string {
  const today = new Date();
  const date = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12
  );
  return runtime.i18n.formatDate(date, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
});

describe('FocusBoardApp', () => {
  it('formats day column dates through app i18n and refreshes when locale changes', async () => {
    const runtime = createAppRuntime({
      initialLocale: 'uk',
      energyService: null,
    });
    const snapshot = {
      ...createInitialFocusBoardSnapshot(),
      hasActiveCycle: true as const,
    };
    const repository: FocusBoardRepository = {
      load: () => snapshot,
      save: () => undefined,
      searchTasks: () => ({ items: [], nextPage: null, total: 0 }),
      searchGoals: () => ({ items: [], nextPage: null }),
      searchStories: () => ({ items: [], nextPage: null }),
      createTask: (title) => ({
        id: `task-${title}`,
        text: title,
        completed: false,
        isFocus: false,
      }),
      setTaskCompleted: () => undefined,
      toggleHabitCompletion: () => undefined,
    };
    const app = new FocusBoardApp(runtime, repository);
    const root = document.createElement('div');
    document.body.appendChild(root);

    app.mount(root);

    try {
      const getDateText = (): string =>
        document.querySelector<HTMLElement>('.fb-day-date')?.textContent ?? '';

      await Promise.resolve();
      await Promise.resolve();

      expect(getDateText()).toBe(getTodayLabel(runtime));

      runtime.setLocale('en');

      expect(getDateText()).toBe(getTodayLabel(runtime));
    } finally {
      app.unmount();
    }
  });

  it('renders focus-board day habits grouped by priority without card styling', async () => {
    const runtime = createAppRuntime({
      initialLocale: 'uk',
      energyService: null,
    });
    const snapshot = {
      ...createInitialFocusBoardSnapshot(),
      hasActiveCycle: true as const,
      habits: [
        {
          id: 'habit-low',
          text: 'Low routine',
          accent: '#60a5fa',
          badge: 'L',
          priority: 'low' as const,
        },
        {
          id: 'habit-highest',
          text: 'Highest routine',
          accent: '#34d399',
          badge: 'H',
          priority: 'highest' as const,
        },
        {
          id: 'habit-medium',
          text: 'Medium routine',
          accent: '#f59e0b',
          badge: 'M',
          priority: 'medium' as const,
        },
      ],
    };
    const repository: FocusBoardRepository = {
      load: () => snapshot,
      save: () => undefined,
      searchTasks: () => ({ items: [], nextPage: null, total: 0 }),
      searchGoals: () => ({ items: [], nextPage: null }),
      searchStories: () => ({ items: [], nextPage: null }),
      createTask: (title) => ({
        id: `task-${title}`,
        text: title,
        completed: false,
        isFocus: false,
      }),
      setTaskCompleted: () => undefined,
      toggleHabitCompletion: () => undefined,
    };
    const app = new FocusBoardApp(runtime, repository);
    const root = document.createElement('div');
    document.body.appendChild(root);

    app.mount(root);
    await Promise.resolve();
    await Promise.resolve();

    try {
      const trigger =
        document.querySelector<HTMLButtonElement>('.fb-habit-stack');
      expect(trigger).not.toBeNull();

      trigger?.click();

      const rows = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-role="focus-board-habit-day-row"]'
        )
      );
      expect(rows.map((row) => row.dataset.priority)).toEqual([
        'highest',
        'medium',
        'low',
      ]);
      expect(rows.map((row) => row.textContent?.trim())).toEqual([
        'HHighest routine',
        'MMedium routine',
        'LLow routine',
      ]);
      expect(document.body.textContent).toContain('Найвищий');
      expect(document.body.textContent).toContain('Середній');
      expect(document.body.textContent).toContain('Низький');
      expect(
        document.querySelector('svg[data-icon-name="chevron-double-up"]')
      ).not.toBeNull();
      expect(rows[0]?.className).toContain('sm:basis-[calc(50%-0.125rem)]');
      expect(rows[0]?.className).toContain('hover:bg-slate-100/80');
      expect(rows[0]?.className).not.toContain('bg-white');
      expect(rows[0]?.className).not.toContain('border');
      expect(rows[0]?.className).not.toContain('shadow');
    } finally {
      app.unmount();
    }
  });

  it('opens the injected wallpaper picker from the focus board header', async () => {
    const runtime = createAppRuntime({
      initialLocale: 'uk',
      energyService: null,
    });
    const onOpenWallpaperPicker = vi.fn();
    const repository: FocusBoardRepository = {
      load: () => ({
        ...createInitialFocusBoardSnapshot(),
        hasActiveCycle: true,
        goal: 'Launch MVP',
      }),
      save: () => undefined,
      searchTasks: () => ({ items: [], nextPage: null, total: 0 }),
      searchGoals: () => ({ items: [], nextPage: null }),
      searchStories: () => ({ items: [], nextPage: null }),
      createTask: (title) => ({
        id: `task-${title}`,
        text: title,
        completed: false,
        isFocus: false,
      }),
      setTaskCompleted: () => undefined,
      toggleHabitCompletion: () => undefined,
    };
    const app = new FocusBoardApp(runtime, repository, {
      onOpenWallpaperPicker,
    });
    const root = document.createElement('div');
    document.body.appendChild(root);

    app.mount(root);
    await Promise.resolve();
    await Promise.resolve();

    try {
      expect(
        document.querySelector<HTMLInputElement>(
          '[data-role="focus-board-cycle-goal-input"]'
        )?.value
      ).toBe('Launch MVP');

      document
        .querySelector<HTMLButtonElement>(
          'button[data-action="open-wallpaper-picker"]'
        )
        ?.click();

      expect(onOpenWallpaperPicker).toHaveBeenCalledTimes(1);
    } finally {
      app.unmount();
    }
  });

  it('saves cycle goal changes from the native header input', async () => {
    const runtime = createAppRuntime({
      initialLocale: 'uk',
      energyService: null,
    });
    const save = vi.fn();
    const repository: FocusBoardRepository = {
      load: () => ({
        ...createInitialFocusBoardSnapshot(),
        hasActiveCycle: true,
        goal: 'Old goal',
      }),
      save,
      searchTasks: () => ({ items: [], nextPage: null, total: 0 }),
      searchGoals: () => ({ items: [], nextPage: null }),
      searchStories: () => ({ items: [], nextPage: null }),
      createTask: (title) => ({
        id: `task-${title}`,
        text: title,
        completed: false,
        isFocus: false,
      }),
      setTaskCompleted: () => undefined,
      toggleHabitCompletion: () => undefined,
    };
    const app = new FocusBoardApp(runtime, repository);
    const root = document.createElement('div');
    document.body.appendChild(root);

    app.mount(root);
    await Promise.resolve();
    await Promise.resolve();

    try {
      const input = document.querySelector<HTMLInputElement>(
        '[data-role="focus-board-cycle-goal-input"]'
      );
      expect(input).not.toBeNull();

      input!.value = 'New goal';
      input!.dispatchEvent(new FocusEvent('blur'));
      await Promise.resolve();
      await Promise.resolve();

      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({ goal: 'New goal' })
      );
    } finally {
      app.unmount();
    }
  });

  it('renders task-picker filters in the backlog modal', async () => {
    const runtime = createAppRuntime({
      initialLocale: 'uk',
      energyService: null,
    });
    const snapshot = {
      ...createInitialFocusBoardSnapshot(),
      backlogOpen: true as const,
    };
    const repository: FocusBoardRepository = {
      load: () => snapshot,
      save: () => undefined,
      searchTasks: () => ({ items: [], nextPage: null, total: 0 }),
      searchGoals: () => ({ items: [], nextPage: null }),
      searchStories: () => ({ items: [], nextPage: null }),
      createTask: (title) => ({
        id: `task-${title}`,
        text: title,
        completed: false,
        isFocus: false,
      }),
      setTaskCompleted: () => undefined,
      toggleHabitCompletion: () => undefined,
    };
    const app = new FocusBoardApp(runtime, repository);
    const root = document.createElement('div');
    document.body.appendChild(root);

    app.mount(root);
    await Promise.resolve();
    await Promise.resolve();

    try {
      const openPickerButton = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Додати існуючу задачу"]'
      );
      expect(openPickerButton).not.toBeNull();

      openPickerButton?.click();
      await Promise.resolve();
      await Promise.resolve();

      expect(document.body.textContent).toContain('Усі задачі');
      expect(document.body.textContent).toContain('Статус');
      expect(document.body.textContent).toContain('Ціль (goal)');
      expect(document.body.textContent).toContain('Сценарій (story)');
      expect(document.body.textContent).toContain('Усі статуси');
      expect(document.body.textContent).toContain('Усі цілі');
      expect(document.body.textContent).toContain('Усі сценарії');
    } finally {
      app.unmount();
    }
  });
});
