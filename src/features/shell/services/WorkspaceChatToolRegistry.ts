import { WORKSPACE_CHAT_ANALYSIS_TOOLS } from './WorkspaceChatAnalysisTools.ts';
import { WORKSPACE_CHAT_SNAPSHOT_TOOLS } from './WorkspaceChatSnapshotTools.ts';
import type { WorkspaceChatToolDefinition } from './WorkspaceChatToolTypes.ts';

export class WorkspaceChatToolRegistry {
  private readonly definitions = new Map<string, WorkspaceChatToolDefinition>();

  constructor(definitions: WorkspaceChatToolDefinition[] = []) {
    definitions.forEach((definition) => {
      this.register(definition);
    });
  }

  public register(definition: WorkspaceChatToolDefinition): this {
    this.definitions.set(definition.name, definition);
    return this;
  }

  public get(name: string): WorkspaceChatToolDefinition | null {
    return this.definitions.get(name) ?? null;
  }

  public has(name: string): boolean {
    return this.definitions.has(name);
  }

  public list(): WorkspaceChatToolDefinition[] {
    return Array.from(this.definitions.values());
  }

  public listByNames(names: readonly string[]): WorkspaceChatToolDefinition[] {
    const uniqueNames = new Set(names);
    return Array.from(uniqueNames)
      .map((name) => this.get(name))
      .filter((definition): definition is WorkspaceChatToolDefinition => definition !== null);
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

export function createWorkspaceChatToolRegistry(): WorkspaceChatToolRegistry {
  return new WorkspaceChatToolRegistry([
    ...WORKSPACE_CHAT_SNAPSHOT_TOOLS,
    ...WORKSPACE_CHAT_ANALYSIS_TOOLS,
  ]);
}
