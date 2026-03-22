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
    id: 'planning.clarify-selection',
    category: 'planning',
    title: 'Clarify Selection',
    summary: 'Tighten the wording of the selected item without changing its intent.',
    whenToUse: 'The user asks to clarify, refine, tighten, or rewrite the selected work more clearly.',
    relatedToolNames: ['get_focus_bundle', 'get_selection_cluster'],
    allowedToolNames: ['get_focus_bundle', 'get_selection_cluster'],
    responsePolicy:
      'Prefer specific title or description updates. Keep the original intent and scope stable.',
    body: [
      'Clarify the targeted item using retrieved context from its parent, children, and neighbors.',
      'Prefer concrete wording improvements over abstract advice.',
      'Return suggest_updates only when the improved title or description is specific enough to review before apply.',
    ].join('\n'),
  },
  {
    id: 'planning.fill-details',
    category: 'planning',
    title: 'Fill Missing Details',
    summary: 'Fill obvious title and description gaps without inventing unsupported scope.',
    whenToUse: 'The user asks to fill in missing details, missing descriptions, or incomplete planning notes.',
    relatedToolNames: [
      'get_focus_bundle',
      'get_selection_cluster',
      'find_missing_descriptions',
    ],
    allowedToolNames: [
      'get_focus_bundle',
      'get_selection_cluster',
      'find_missing_descriptions',
    ],
    responsePolicy:
      'Prefer the smallest meaningful clarification. Reject title-only paraphrases; proposed descriptions should add concrete detail that the user can review before apply, using either nearby canvas evidence or explicit user-provided details.',
    body: [
      'Focus on empty or underspecified titles and descriptions.',
      'Use nearby parent, child, and sibling context to infer the smallest safe clarification.',
      'If the user explicitly provides the missing details, treat that as valid source material for a confirm-first update even when the canvas has no supporting neighbors.',
      'Do not suggest a description that only restates the current title in different words.',
      'Only suggest a description when either nearby context or explicit user input supports at least one concrete detail beyond the title itself.',
      'Do not invent timelines, metrics, locations, or acceptance criteria unless tool results support them.',
      'Ask a follow-up question only when both nearby context and user-provided details are too thin to support a meaningful update.',
    ].join('\n'),
  },
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
      'get_selection_cluster',
      'get_related_relations',
      'find_dependency_gaps',
      'get_recent_activity',
    ],
    allowedToolNames: [
      'get_focus_bundle',
      'get_selection_cluster',
      'get_related_relations',
      'find_dependency_gaps',
      'get_recent_activity',
    ],
    responsePolicy:
      'Do not invent relations. When the retrieved evidence supports a concrete link, return suggest_relations. When an existing non-hierarchical link is clearly wrong, return remove_relations. When the link should stay but its meaning should change, return update_relations. Ask a follow-up only when no concrete relation action can be justified yet.',
    body: [
      'Focus on explicit and missing sequencing signals.',
      'Inspect the targeted cluster before proposing relations so suggestions stay anchored in the selected items.',
      'Use relation data before making dependency claims.',
      'If the scope has multiple child items but no non-hierarchical links, call that out as a weak dependency model.',
      'When titles or neighboring structure show an obvious progression inside the selected cluster, propose the strongest supported relation as a confirm-first action.',
      'When an existing non-hierarchical link clearly no longer matches the current structure or the user explicitly asks to unlink it, propose remove_relations instead of only describing the problem.',
      'When an existing non-hierarchical link still makes sense between the same items but the semantics should change, propose update_relations instead of a remove-and-readd description.',
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
    id: 'planning.next-steps',
    category: 'planning',
    title: 'Next Steps',
    summary: 'Recommend the next few planning moves that would best improve execution readiness.',
    whenToUse: 'The user asks what to do next, what sequence to follow, or what the next planning move should be.',
    relatedToolNames: [
      'get_focus_bundle',
      'get_selection_cluster',
      'get_related_relations',
      'get_recent_activity',
      'find_structure_gaps',
      'find_dependency_gaps',
    ],
    allowedToolNames: [
      'get_focus_bundle',
      'get_selection_cluster',
      'get_related_relations',
      'get_recent_activity',
      'find_structure_gaps',
      'find_dependency_gaps',
    ],
    responsePolicy:
      'Recommend the smallest high-leverage next moves first, with clear sequencing and rationale.',
    body: [
      'Use current structure, relations, and recent activity to recommend what should happen next.',
      'Prefer a short ordered sequence over a long brainstorm.',
      'Separate blockers from follow-up polish so the next steps are easy to execute.',
    ].join('\n'),
  },
  {
    id: 'planning.recent-changes',
    category: 'planning',
    title: 'Recent Changes Review',
    summary: 'Review recent canvas activity and explain what changed, what matters, and what may need follow-up.',
    whenToUse: 'The user asks about recent changes, recent activity, or what changed lately on the canvas.',
    relatedToolNames: ['get_recent_activity', 'get_focus_bundle', 'get_selection_cluster'],
    allowedToolNames: ['get_recent_activity', 'get_focus_bundle', 'get_selection_cluster'],
    responsePolicy:
      'Anchor the answer in the recent activity log before inferring impact or follow-up.',
    body: [
      'Summarize recent activity first, then assess why it matters.',
      'Call out risky or incomplete changes when the recent activity suggests follow-up work is needed.',
      'If the activity log is sparse, say that clearly instead of overstating what changed.',
    ].join('\n'),
  },
  {
    id: 'planning.duplicate-review',
    category: 'planning',
    title: 'Duplicate Review',
    summary: 'Find duplicate titles and likely overlap so the plan can be simplified.',
    whenToUse: 'The user asks about duplicates, overlap, redundancy, or potentially repeated work.',
    relatedToolNames: ['get_focus_bundle', 'get_selection_cluster', 'find_duplicate_titles'],
    allowedToolNames: ['get_focus_bundle', 'get_selection_cluster', 'find_duplicate_titles'],
    responsePolicy:
      'Separate exact duplicate evidence from softer overlap hypotheses.',
    body: [
      'Use duplicate-title findings as hard evidence and treat softer overlap as a weaker signal.',
      'Explain why items look duplicate or overlapping before suggesting cleanup.',
      'Prefer consolidation and clearer scoping suggestions over generic comments.',
    ].join('\n'),
  },
  {
    id: 'planning.capability-help',
    category: 'planning',
    title: 'Workspace Chat Capability Help',
    summary:
      'Explain what this workspace chat can help with right now using frontend capability context.',
    whenToUse:
      'The user greets the assistant and asks what it can do, how it can help, or how to use it in this workspace.',
    relatedToolNames: ['get_chat_capabilities'],
    allowedToolNames: ['get_chat_capabilities'],
    responsePolicy:
      'Answer as a concise friendly capability overview grounded in the capability tool result.',
    body: [
      'Treat greetings plus capability questions as valid workspace requests, not as off-topic chat.',
      'Call get_chat_capabilities before answering.',
      'Explain the current grounded workflows, current quick actions, available AI actions, and confirm-first constraints.',
      'Do not promise general open-domain chat support when the capability context says the assistant is workspace-scoped.',
    ].join('\n'),
  },
  {
    id: 'planning.general-question',
    category: 'planning',
    title: 'General Canvas Assistance',
    summary: 'General fallback planning guidance for free-form questions about the canvas.',
    whenToUse: 'The prompt is not clearly a review, readiness check, dependency analysis, or breakdown request.',
    relatedToolNames: [
      'get_chat_capabilities',
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
      'get_chat_capabilities',
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
      'If the user is asking what this chat can do or how to use it, prefer get_chat_capabilities before canvas evidence tools.',
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
