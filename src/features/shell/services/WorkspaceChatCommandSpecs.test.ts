import { describe, expect, it } from 'vitest';
import { getWorkspaceChatCommandSpec } from './WorkspaceChatCommandSpecs.ts';
import {
  createWorkspaceChatTestMemory,
  createWorkspaceChatTestSnapshot,
} from './WorkspaceChatTestUtils.ts';

function createFocusedFillDetailsSnapshot() {
  const baseSnapshot = createWorkspaceChatTestSnapshot();
  return {
    ...baseSnapshot,
    selectionIds: ['story-2'],
    focusId: 'story-2',
    summary: {
      ...baseSnapshot.summary,
      selectedCount: 1,
    },
    elements: baseSnapshot.elements.map((element) => ({
      ...element,
      selected: element.id === 'story-2',
      focused: element.id === 'story-2',
    })),
  };
}

describe('WorkspaceChatCommandSpecs', () => {
  it('rejects fill-details description updates that only restate the current item', () => {
    const spec = getWorkspaceChatCommandSpec('fill_details');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'Fill missing details',
      memory: createWorkspaceChatTestMemory(),
      toolResults: [],
      snapshot: createFocusedFillDetailsSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown: 'I prepared one update.',
        actions: [
          {
            kind: 'suggest_update',
            elementId: 'story-2',
            patch: {
              description: 'Clarify the post-purchase scope for the current plan.',
            },
            reason: 'This keeps the wording general without inventing extra scope.',
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBe(
      'Fill_details description must add context-backed detail instead of restating the current item.'
    );
  });

  it('accepts fill-details description updates that use nearby canvas evidence', () => {
    const spec = getWorkspaceChatCommandSpec('fill_details');
    expect(spec).not.toBeNull();

    const compiledContext = spec!.buildCompiledContext({
      prompt: 'Fill missing details',
      memory: createWorkspaceChatTestMemory(),
      toolResults: [],
      snapshot: createFocusedFillDetailsSnapshot(),
    });

    const error = spec!.validateEnvelope({
      envelope: {
        replyMarkdown: 'I found one concrete detail to add.',
        actions: [
          {
            kind: 'suggest_update',
            elementId: 'story-2',
            patch: {
              description:
                'Cover the receipt email follow-up after purchase so the next step is explicit.',
            },
            reason:
              'This uses the child task about the receipt email to make the story scope concrete.',
          },
        ],
      },
      compiledContext,
    });

    expect(error).toBeNull();
  });
});
