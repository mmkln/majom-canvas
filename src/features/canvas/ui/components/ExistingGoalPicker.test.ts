// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

vi.mock('../../../../majom-wrapper/data-access/tasks-api-service.ts', () => ({
  TasksApiService: class {
    public getTags() {
      return of([
        {
          id: 11,
          title: 'Focus',
          slug: 'focus',
          color: '#2563eb',
          description: 'Deep work',
          tasks: [],
        },
        {
          id: 12,
          title: 'Health',
          slug: 'health',
          color: '#16a34a',
          description: 'Energy',
          tasks: [],
        },
      ]);
    }
  },
}));

import { createAppRuntime } from '../../../../app-runtime/index.ts';
import { ExistingGoalPicker } from './ExistingGoalPicker.ts';

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('ExistingGoalPicker query omnibox', () => {
  it('debounces plain free-text search through the dedicated goal query surface', () => {
    vi.useFakeTimers();
    const loadGoalsPage = vi.fn((_params: unknown) =>
      of({
        items: [],
        hasMore: false,
      })
    );
    const picker = new ExistingGoalPicker(
      (params) => loadGoalsPage(params),
      30,
      createAppRuntime()
    );

    picker.open({
      sceneX: 120,
      sceneY: 180,
      onPick: () => {},
      isOnCanvas: () => false,
    });

    try {
      const querySurface = document.querySelector<HTMLElement>(
        '[data-role="goal-picker-query-surface"]'
      );
      const queryInput = document.querySelector<HTMLInputElement>(
        '[data-role="goal-picker-query-input"]'
      );

      expect(querySurface).not.toBeNull();
      expect(queryInput).not.toBeNull();

      loadGoalsPage.mockClear();

      queryInput!.value = 'roadmap';
      queryInput!.dispatchEvent(new Event('input', { bubbles: true }));

      expect(loadGoalsPage).not.toHaveBeenCalled();

      vi.advanceTimersByTime(220);

      expect(loadGoalsPage).toHaveBeenCalledTimes(1);
      expect(loadGoalsPage).toHaveBeenLastCalledWith({
        term: 'roadmap',
        page: 1,
        pageSize: 30,
        tagIds: [],
      });
    } finally {
      picker.close();
    }
  });

  it('keeps a trailing space in plain text input after debounce while still searching with the trimmed term', () => {
    vi.useFakeTimers();
    const loadGoalsPage = vi.fn((_params: unknown) =>
      of({
        items: [],
        hasMore: false,
      })
    );
    const picker = new ExistingGoalPicker(
      (params) => loadGoalsPage(params),
      30,
      createAppRuntime()
    );

    picker.open({
      sceneX: 120,
      sceneY: 180,
      onPick: () => {},
      isOnCanvas: () => false,
    });

    try {
      const queryInput = document.querySelector<HTMLInputElement>(
        '[data-role="goal-picker-query-input"]'
      );
      expect(queryInput).not.toBeNull();

      loadGoalsPage.mockClear();

      queryInput!.value = 'roadmap ';
      queryInput!.dispatchEvent(new Event('input', { bubbles: true }));
      vi.advanceTimersByTime(220);

      expect(queryInput!.value).toBe('roadmap ');
      expect(loadGoalsPage).toHaveBeenCalledTimes(1);
      expect(loadGoalsPage).toHaveBeenLastCalledWith({
        term: 'roadmap',
        page: 1,
        pageSize: 30,
        tagIds: [],
      });
    } finally {
      picker.close();
    }
  });

  it('keeps an exact trailing #slug as draft on debounce and commits it on Enter', () => {
    vi.useFakeTimers();
    const loadGoalsPage = vi.fn((_params: unknown) =>
      of({
        items: [],
        hasMore: false,
      })
    );
    const picker = new ExistingGoalPicker(
      (params) => loadGoalsPage(params),
      30,
      createAppRuntime()
    );

    picker.open({
      sceneX: 120,
      sceneY: 180,
      onPick: () => {},
      isOnCanvas: () => false,
    });

    try {
      const queryInput = document.querySelector<HTMLInputElement>(
        '[data-role="goal-picker-query-input"]'
      );
      expect(queryInput).not.toBeNull();

      loadGoalsPage.mockClear();

      queryInput!.value = 'roadmap #focus';
      queryInput!.dispatchEvent(new Event('input', { bubbles: true }));
      vi.advanceTimersByTime(220);

      expect(queryInput!.value).toBe('roadmap #focus');
      expect(
        document.querySelector(
          '[data-role="goal-picker-query-tag-token"][data-tag-id="11"]'
        )
      ).toBeNull();
      expect(loadGoalsPage).toHaveBeenCalledTimes(1);
      expect(loadGoalsPage).toHaveBeenLastCalledWith({
        term: 'roadmap',
        page: 1,
        pageSize: 30,
        tagIds: [],
      });

      queryInput!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );

      const token = document.querySelector<HTMLElement>(
        '[data-role="goal-picker-query-tag-token"][data-tag-id="11"]'
      );
      const summaryLabel = document.querySelector<HTMLElement>(
        '[data-role="goal-picker-query-summary-label"]'
      );

      expect(token).not.toBeNull();
      expect(token?.textContent).toContain('#focus');
      expect(queryInput!.value).toBe('roadmap');
      expect(summaryLabel?.textContent).toContain('roadmap');
      expect(summaryLabel?.textContent).toContain('#focus');
      expect(loadGoalsPage).toHaveBeenCalledTimes(2);
      expect(loadGoalsPage).toHaveBeenLastCalledWith({
        term: 'roadmap',
        page: 1,
        pageSize: 30,
        tagIds: [11],
      });
    } finally {
      picker.close();
    }
  });

  it('does not swallow a typed space after an exact #slug and lets debounce commit it naturally', () => {
    vi.useFakeTimers();
    const loadGoalsPage = vi.fn((_params: unknown) =>
      of({
        items: [],
        hasMore: false,
      })
    );
    const picker = new ExistingGoalPicker(
      (params) => loadGoalsPage(params),
      30,
      createAppRuntime()
    );

    picker.open({
      sceneX: 120,
      sceneY: 180,
      onPick: () => {},
      isOnCanvas: () => false,
    });

    try {
      const queryInput = document.querySelector<HTMLInputElement>(
        '[data-role="goal-picker-query-input"]'
      );
      expect(queryInput).not.toBeNull();

      loadGoalsPage.mockClear();

      queryInput!.value = 'roadmap #focus';
      queryInput!.dispatchEvent(new Event('input', { bubbles: true }));

      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      const notCancelled = queryInput!.dispatchEvent(spaceEvent);

      expect(notCancelled).toBe(true);

      queryInput!.value = 'roadmap #focus ';
      queryInput!.dispatchEvent(new Event('input', { bubbles: true }));

      expect(queryInput!.value).toBe('roadmap #focus ');

      vi.advanceTimersByTime(220);

      expect(queryInput!.value).toBe('roadmap ');
      expect(loadGoalsPage).toHaveBeenLastCalledWith({
        term: 'roadmap',
        page: 1,
        pageSize: 30,
        tagIds: [11],
      });
    } finally {
      picker.close();
    }
  });

  it('shows #tag suggestions even when free text already exists before the hash fragment', () => {
    const loadGoalsPage = vi.fn((_params: unknown) =>
      of({
        items: [],
        hasMore: false,
      })
    );
    const picker = new ExistingGoalPicker(
      (params) => loadGoalsPage(params),
      30,
      createAppRuntime()
    );

    picker.open({
      sceneX: 120,
      sceneY: 180,
      onPick: () => {},
      isOnCanvas: () => false,
    });

    try {
      const queryInput = document.querySelector<HTMLInputElement>(
        '[data-role="goal-picker-query-input"]'
      );
      expect(queryInput).not.toBeNull();

      loadGoalsPage.mockClear();

      queryInput!.value = 'roadmap #fo';
      queryInput!.dispatchEvent(new Event('input', { bubbles: true }));

      const suggestion = document.querySelector<HTMLButtonElement>(
        '[data-role="goal-picker-query-suggestion"][data-tag-id="11"]'
      );
      expect(suggestion).not.toBeNull();
      expect(suggestion?.textContent).toContain('#focus');

      suggestion!.click();

      expect(queryInput!.value).toBe('roadmap');
      expect(loadGoalsPage).toHaveBeenCalledTimes(1);
      expect(loadGoalsPage).toHaveBeenLastCalledWith({
        term: 'roadmap',
        page: 1,
        pageSize: 30,
        tagIds: [11],
      });
    } finally {
      picker.close();
    }
  });

  it('renders goal-specific empty state for mixed text and tag filters', () => {
    vi.useFakeTimers();
    const loadGoalsPage = vi.fn((_params: unknown) =>
      of({
        items: [],
        hasMore: false,
      })
    );
    const picker = new ExistingGoalPicker(
      (params) => loadGoalsPage(params),
      30,
      createAppRuntime()
    );

    picker.open({
      sceneX: 120,
      sceneY: 180,
      onPick: () => {},
      isOnCanvas: () => false,
    });

    try {
      const queryInput = document.querySelector<HTMLInputElement>(
        '[data-role="goal-picker-query-input"]'
      );
      expect(queryInput).not.toBeNull();

      loadGoalsPage.mockClear();

      queryInput!.value = 'roadmap #focus';
      queryInput!.dispatchEvent(new Event('input', { bubbles: true }));
      queryInput!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );

      const listText = document.body.textContent ?? '';
      expect(listText).toContain('No goals match');
      expect(listText).toContain('roadmap');
      expect(listText).toContain('#focus');
    } finally {
      picker.close();
    }
  });

  it('renders goal-specific error state for mixed text and tag filters', () => {
    vi.useFakeTimers();
    const loadGoalsPage = vi.fn((_params: unknown) =>
      throwError(() => new Error('network'))
    );
    const picker = new ExistingGoalPicker(
      (params) => loadGoalsPage(params),
      30,
      createAppRuntime()
    );

    picker.open({
      sceneX: 120,
      sceneY: 180,
      onPick: () => {},
      isOnCanvas: () => false,
    });

    try {
      const queryInput = document.querySelector<HTMLInputElement>(
        '[data-role="goal-picker-query-input"]'
      );
      expect(queryInput).not.toBeNull();

      loadGoalsPage.mockClear();

      queryInput!.value = 'roadmap #focus';
      queryInput!.dispatchEvent(new Event('input', { bubbles: true }));
      queryInput!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );

      const listText = document.body.textContent ?? '';
      expect(listText).toContain('Failed to load goals');
      expect(listText).toContain('roadmap');
      expect(listText).toContain('#focus');
    } finally {
      picker.close();
    }
  });

  it('clears text and tag filters through the summary actions', () => {
    vi.useFakeTimers();
    const loadGoalsPage = vi.fn((_params: unknown) =>
      of({
        items: [],
        hasMore: false,
      })
    );
    const picker = new ExistingGoalPicker(
      (params) => loadGoalsPage(params),
      30,
      createAppRuntime()
    );

    picker.open({
      sceneX: 120,
      sceneY: 180,
      onPick: () => {},
      isOnCanvas: () => false,
    });

    try {
      const queryInput = document.querySelector<HTMLInputElement>(
        '[data-role="goal-picker-query-input"]'
      );
      expect(queryInput).not.toBeNull();

      loadGoalsPage.mockClear();

      queryInput!.value = 'roadmap #focus';
      queryInput!.dispatchEvent(new Event('input', { bubbles: true }));
      queryInput!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );

      const summaryActions = document.querySelectorAll<HTMLButtonElement>(
        '[data-role="goal-picker-query-summary-actions"] button'
      );
      expect(summaryActions).toHaveLength(2);

      summaryActions[0]?.click();
      expect(loadGoalsPage).toHaveBeenLastCalledWith({
        term: '',
        page: 1,
        pageSize: 30,
        tagIds: [11],
      });

      summaryActions[1]?.click();
      expect(loadGoalsPage).toHaveBeenLastCalledWith({
        term: '',
        page: 1,
        pageSize: 30,
        tagIds: [],
      });
    } finally {
      picker.close();
    }
  });
});
