import { describe, expect, it } from 'vitest';
import type { AiAssistantAction } from './aiAssistantActions.ts';
import { getAiAssistantActionGroupButtonLabel } from './aiAssistantActions.ts';

describe('aiAssistantActions', () => {
  it('derives grouped create labels for multi-action collections', () => {
    const actions: AiAssistantAction[] = [
      {
        id: 'task-1',
        kind: 'create_task',
        label: 'Create task',
        title: 'Task A',
        status: 'idle',
      },
      {
        id: 'task-2',
        kind: 'create_task',
        label: 'Create task',
        title: 'Task B',
        status: 'idle',
      },
    ];

    expect(getAiAssistantActionGroupButtonLabel(actions)).toBe('Create all');
  });

  it('derives grouped retry labels when every remaining action failed', () => {
    const actions: AiAssistantAction[] = [
      {
        id: 'update-1',
        kind: 'suggest_update',
        label: 'Apply update',
        title: 'Update title',
        status: 'failed',
        elementId: 'story-1',
        elementKind: 'story',
        patch: { title: 'New title' },
      },
      {
        id: 'update-2',
        kind: 'suggest_update',
        label: 'Apply update',
        title: 'Update description',
        status: 'failed',
        elementId: 'story-2',
        elementKind: 'story',
        patch: { description: 'New description' },
      },
    ];

    expect(getAiAssistantActionGroupButtonLabel(actions)).toBe('Retry all');
  });

  it('can preserve the action label for single pending confirmations', () => {
    const actions: AiAssistantAction[] = [
      {
        id: 'story-1',
        kind: 'create_story',
        label: 'Create story',
        title: 'Checkout story',
        status: 'idle',
      },
    ];

    expect(
      getAiAssistantActionGroupButtonLabel(actions, {
        singleActionMode: 'action-label',
      })
    ).toBe('Create story');
  });
});
