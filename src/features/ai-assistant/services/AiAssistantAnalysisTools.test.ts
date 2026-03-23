import { describe, expect, it } from 'vitest';
import { AI_ASSISTANT_ANALYSIS_TOOLS } from './AiAssistantAnalysisTools.ts';
import {
  createAiAssistantTestMemory,
  createAiAssistantTestSnapshot,
} from './AiAssistantTestUtils.ts';

function getTool(name: string) {
  const tool = AI_ASSISTANT_ANALYSIS_TOOLS.find((entry) => entry.name === name);
  if (!tool) {
    throw new Error(`Missing tool ${name}`);
  }
  return tool;
}

function executeAnalysisTool(name: string, input: Record<string, unknown> = {}) {
  return getTool(name).execute(input, {
    runtime: {
      snapshot: createAiAssistantTestSnapshot({
        elements: createAiAssistantTestSnapshot().elements.map((element) =>
          element.id === 'task-1'
            ? {
                ...element,
                parentId: null,
              }
            : element
        ),
      }),
      memory: createAiAssistantTestMemory(),
      prompt: 'Analyze the selected work',
      contextMode: 'selection',
    },
    previousResults: [],
  });
}

describe('AiAssistantAnalysisTools', () => {
  it('finds structure gaps', async () => {
    const result = await executeAnalysisTool('find_structure_gaps', {
      ids: ['task-1'],
    });
    const findings = (result as { findings: Array<{ code: string }> }).findings;

    expect(findings.map((finding) => finding.code)).toEqual([
      'task_without_parent',
    ]);
  });

  it('finds dependency gaps', async () => {
    const result = await executeAnalysisTool('find_dependency_gaps', {
      ids: ['task-2', 'task-3'],
    });
    const findings = (result as { findings: Array<{ code: string }> }).findings;

    expect(findings.map((finding) => finding.code)).toContain(
      'missing_cluster_dependencies'
    );
  });

  it('finds missing descriptions', async () => {
    const result = await executeAnalysisTool('find_missing_descriptions', {
      ids: ['story-2', 'task-1'],
    });
    const findings = (result as { findings: Array<{ code: string }> }).findings;

    expect(findings.map((finding) => finding.code)).toEqual([
      'missing_description',
      'missing_description',
    ]);
  });

  it('finds duplicate titles', async () => {
    const result = await executeAnalysisTool('find_duplicate_titles', {
      scope: 'canvas',
    });
    const findings = (result as { findings: Array<{ code: string; targetIds: string[] }> }).findings;

    expect(findings[0]?.code).toBe('duplicate_title');
    expect(findings[0]?.targetIds).toEqual(['task-2', 'task-3']);
  });
});
