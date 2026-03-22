import type {
  WorkspaceChatInstructionIndexEntry,
  WorkspaceChatInstructionPacket,
} from './WorkspaceChatInstructionTypes.ts';

type WorkspaceChatInstructionDefinition = WorkspaceChatInstructionPacket & {
  summary: string;
  whenToUse: string;
  relatedToolNames: string[];
};

const DEFAULT_INSTRUCTIONS: WorkspaceChatInstructionDefinition[] = [
  {
    id: 'planning.review-selection',
    category: 'planning',
    title: 'Selection Review',
    summary: 'Review the selected work for structure gaps, missing evidence, and planning risks.',
    whenToUse: 'The user asks for a review, critique, assessment, or quality check of selected work.',
    relatedToolNames: [
      'get_focus_bundle',
      'get_selection_cluster',
      'get_related_relations',
      'get_recent_activity',
      'find_structure_gaps',
      'find_dependency_gaps',
      'find_missing_descriptions',
      'find_duplicate_titles',
    ],
    allowedToolNames: [
      'get_focus_bundle',
      'get_selection_cluster',
      'get_related_relations',
      'get_recent_activity',
      'find_structure_gaps',
      'find_dependency_gaps',
      'find_missing_descriptions',
      'find_duplicate_titles',
    ],
    responsePolicy:
      'Prioritize concrete findings and call out missing evidence before proposing actions.',
    body: [
      'Review the targeted canvas work using only retrieved evidence.',
      'Prefer concrete findings over generic advice.',
      'Look for structural gaps, missing descriptions, duplicate titles, and weak dependency modeling.',
      'If tool results are insufficient, request more evidence or ask a follow-up question instead of guessing.',
    ].join('\n'),
  },
  {
    id: 'planning.readiness-check',
    category: 'planning',
    title: 'Readiness Check',
    summary: 'Assess what is still missing before execution can start with confidence.',
    whenToUse: 'The user asks what is missing, what is not ready, or what blockers remain.',
    relatedToolNames: [
      'get_focus_bundle',
      'get_selection_cluster',
      'get_related_relations',
      'find_structure_gaps',
      'find_dependency_gaps',
      'find_missing_descriptions',
    ],
    allowedToolNames: [
      'get_focus_bundle',
      'get_selection_cluster',
      'get_related_relations',
      'find_structure_gaps',
      'find_dependency_gaps',
      'find_missing_descriptions',
    ],
    responsePolicy:
      'Separate hard blockers from smaller refinements and keep suggested updates concrete.',
    body: [
      'Assess execution readiness, not abstract quality.',
      'Identify missing parent/child structure, missing descriptions, and missing dependency signals.',
      'Summarize the readiness verdict clearly and highlight the smallest next refinements that would unblock execution.',
    ].join('\n'),
  },
  {
    id: 'planning.dependency-review',
    category: 'planning',
    title: 'Dependency Review',
    summary: 'Inspect sequencing, blockers, and relationship gaps in the current scope.',
    whenToUse: 'The user asks about dependencies, blockers, sequencing, or ordering.',
    relatedToolNames: [
      'get_focus_bundle',
      'get_related_relations',
      'find_dependency_gaps',
      'get_recent_activity',
    ],
    allowedToolNames: [
      'get_focus_bundle',
      'get_related_relations',
      'find_dependency_gaps',
      'get_recent_activity',
    ],
    responsePolicy:
      'Do not invent relations. Only describe dependency gaps that are supported by retrieved structure and relations.',
    body: [
      'Focus on explicit and missing sequencing signals.',
      'Use relation data before making dependency claims.',
      'If the scope has multiple child items but no non-hierarchical links, call that out as a weak dependency model.',
    ].join('\n'),
  },
  {
    id: 'planning.breakdown',
    category: 'planning',
    title: 'Breakdown',
    summary: 'Break a larger item into children while preserving the existing planning hierarchy.',
    whenToUse: 'The user asks to break down a goal or story into stories or tasks.',
    relatedToolNames: ['get_focus_bundle', 'get_selection_cluster', 'get_recent_activity'],
    allowedToolNames: ['get_focus_bundle', 'get_selection_cluster', 'get_recent_activity'],
    responsePolicy:
      'Return actionable child items grouped cleanly. Do not imply that anything was already created.',
    body: [
      'Break larger work into clear, non-overlapping child items.',
      'Respect the existing hierarchy: goals break into stories, stories break into tasks.',
      'If the focus item is unclear, ask a follow-up question.',
    ].join('\n'),
  },
  {
    id: 'planning.general-question',
    category: 'planning',
    title: 'General Canvas Assistance',
    summary: 'General fallback planning guidance for free-form questions about the canvas.',
    whenToUse: 'The prompt is not clearly a review, readiness check, dependency analysis, or breakdown request.',
    relatedToolNames: [
      'get_focus_bundle',
      'get_selection_cluster',
      'get_related_relations',
      'get_recent_activity',
      'find_structure_gaps',
      'find_dependency_gaps',
      'find_missing_descriptions',
      'find_duplicate_titles',
    ],
    allowedToolNames: [
      'get_focus_bundle',
      'get_selection_cluster',
      'get_related_relations',
      'get_recent_activity',
      'find_structure_gaps',
      'find_dependency_gaps',
      'find_missing_descriptions',
      'find_duplicate_titles',
    ],
    responsePolicy:
      'Stay concise, retrieve only the evidence needed for the user question, and ask follow-ups when the scope is ambiguous.',
    body: [
      'Use the smallest sufficient set of tools.',
      'Prefer evidence from selection or focus before expanding to a wider cluster.',
      'Ask for clarification when the prompt does not identify a usable target.',
    ].join('\n'),
  },
  {
    id: 'response.structured-reply',
    category: 'response',
    title: 'Structured Reply Contract',
    summary: 'Reminder that final answers must follow the workspace structured JSON envelope.',
    whenToUse: 'Whenever the model is about to finalize a user-facing answer.',
    relatedToolNames: [],
    responsePolicy:
      'Final user-facing answers must fit the structured reply envelope and keep actions confirm-first.',
    body: [
      'The final answer must be emitted through the existing structured JSON envelope.',
      'Never claim that canvas changes were already applied.',
      'Only propose actions when evidence is sufficient and the response is specific enough to review before apply.',
    ].join('\n'),
  },
];

export class WorkspaceChatInstructionRegistry {
  private readonly definitions = new Map<string, WorkspaceChatInstructionDefinition>();

  constructor(definitions: WorkspaceChatInstructionDefinition[] = DEFAULT_INSTRUCTIONS) {
    definitions.forEach((definition) => {
      this.register(definition);
    });
  }

  public register(definition: WorkspaceChatInstructionDefinition): this {
    this.definitions.set(definition.id, definition);
    return this;
  }

  public has(id: string): boolean {
    return this.definitions.has(id);
  }

  public getPacket(id: string): WorkspaceChatInstructionPacket | null {
    const definition = this.definitions.get(id);
    if (!definition) return null;
    return toInstructionPacket(definition);
  }

  public getPackets(ids: readonly string[]): WorkspaceChatInstructionPacket[] {
    const packets: WorkspaceChatInstructionPacket[] = [];
    ids.forEach((id) => {
      const packet = this.getPacket(id);
      if (packet) {
        packets.push(packet);
      }
    });
    return packets;
  }

  public listIndex(): WorkspaceChatInstructionIndexEntry[] {
    return Array.from(this.definitions.values()).map((definition) => ({
      id: definition.id,
      category: definition.category,
      title: definition.title,
      summary: definition.summary,
      whenToUse: definition.whenToUse,
      relatedToolNames: definition.relatedToolNames.slice(),
    }));
  }
}

export function createWorkspaceChatInstructionRegistry(): WorkspaceChatInstructionRegistry {
  return new WorkspaceChatInstructionRegistry();
}

function toInstructionPacket(
  definition: WorkspaceChatInstructionDefinition
): WorkspaceChatInstructionPacket {
  return {
    id: definition.id,
    category: definition.category,
    title: definition.title,
    body: definition.body,
    allowedToolNames: definition.allowedToolNames?.slice(),
    responsePolicy: definition.responsePolicy,
  };
}
