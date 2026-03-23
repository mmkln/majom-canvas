import { AI_ASSISTANT_ANALYSIS_TOOLS } from './AiAssistantAnalysisTools.ts';
import { AI_ASSISTANT_SNAPSHOT_TOOLS } from './AiAssistantSnapshotTools.ts';
import type { AiAssistantToolDefinition } from './AiAssistantToolTypes.ts';

export class AiAssistantToolRegistry {
  private readonly definitions = new Map<string, AiAssistantToolDefinition>();

  constructor(definitions: AiAssistantToolDefinition[] = []) {
    definitions.forEach((definition) => {
      this.register(definition);
    });
  }

  public register(definition: AiAssistantToolDefinition): this {
    this.definitions.set(definition.name, definition);
    return this;
  }

  public get(name: string): AiAssistantToolDefinition | null {
    return this.definitions.get(name) ?? null;
  }

  public has(name: string): boolean {
    return this.definitions.has(name);
  }

  public list(): AiAssistantToolDefinition[] {
    return Array.from(this.definitions.values());
  }

  public listByNames(names: readonly string[]): AiAssistantToolDefinition[] {
    const uniqueNames = new Set(names);
    return Array.from(uniqueNames)
      .map((name) => this.get(name))
      .filter((definition): definition is AiAssistantToolDefinition => definition !== null);
  }

  public listForPlanner(): Array<{
    name: string;
    kind: string;
    description: string;
    inputSchema: string;
  }>;
  public listForPlanner(names: readonly string[]): Array<{
    name: string;
    kind: string;
    description: string;
    inputSchema: string;
  }>;
  public listForPlanner(names?: readonly string[]): Array<{
    name: string;
    kind: string;
    description: string;
    inputSchema: string;
  }> {
    const definitions = names && names.length > 0 ? this.listByNames(names) : this.list();
    return definitions.map((definition) => ({
      name: definition.name,
      kind: definition.kind,
      description: definition.description,
      inputSchema: definition.inputSchema,
    }));
  }
}

export function createAiAssistantToolRegistry(): AiAssistantToolRegistry {
  return new AiAssistantToolRegistry([
    ...AI_ASSISTANT_SNAPSHOT_TOOLS,
    ...AI_ASSISTANT_ANALYSIS_TOOLS,
  ]);
}
