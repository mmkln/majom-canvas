// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import { LearningStudioSettingsView } from './LearningStudioSettingsView.ts';

describe('LearningStudioSettingsView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders settings metadata and invokes hooks', () => {
    const onPublish = vi.fn();
    const onArchive = vi.fn();
    const onDuplicate = vi.fn();

    const view = new LearningStudioSettingsView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      courseTitle: 'Systems Thinking 101',
      courseStatusLabel: 'Draft',
      courseDescription: 'A prototype learning canvas.',
      moduleCount: 2,
      lessonCount: 8,
      learnerCount: 3,
      updatedAt: '2026-03-27T10:00:00.000Z',
      publishedAt: null,
      onPublish,
      onArchive,
      onDuplicate,
    });

    document.body.appendChild(view.element);

    expect(view.element.textContent).toContain('Course settings');
    expect(view.element.textContent).toContain('Systems Thinking 101');
    expect(view.element.textContent).toContain('A prototype learning canvas.');

    const buttons = Array.from(view.element.querySelectorAll('button'));
    expect(buttons).toHaveLength(3);

    buttons[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    buttons[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    buttons[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onPublish).toHaveBeenCalledTimes(1);
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onDuplicate).toHaveBeenCalledTimes(1);
  });
});
