// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import { LearningStudioAccessView } from './LearningStudioAccessView.ts';

describe('LearningStudioAccessView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders access data and invokes hooks', () => {
    const onInviteLearner = vi.fn();
    const onCopyShareLink = vi.fn();
    const onRevokeAccess = vi.fn();

    const view = new LearningStudioAccessView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      courseTitle: 'Systems Thinking 101',
      shareLink: 'https://example.com/share/course-1',
      participants: [
        {
          id: 'learner-1',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'learner',
          status: 'active',
        },
      ],
      onInviteLearner,
      onCopyShareLink,
      onRevokeAccess,
    });

    document.body.appendChild(view.element);

    expect(view.element.textContent).toContain('Access and enrollment');
    expect(view.element.textContent).toContain('Systems Thinking 101');
    expect(view.element.textContent).toContain('Ada Lovelace');

    const buttons = Array.from(view.element.querySelectorAll('button'));
    expect(buttons).toHaveLength(3);

    buttons[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    buttons[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    buttons[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onInviteLearner).toHaveBeenCalledTimes(1);
    expect(onCopyShareLink).toHaveBeenCalledTimes(1);
    expect(onRevokeAccess).toHaveBeenCalledWith('learner-1');
  });
});
