import type {
  AiAssistantTelemetryCollector,
  AiAssistantTelemetryEvent,
} from './AiAssistantTelemetryTypes.ts';

class InMemoryAiAssistantTelemetryCollector
  implements AiAssistantTelemetryCollector
{
  private readonly events: AiAssistantTelemetryEvent[] = [];

  public record(event: AiAssistantTelemetryEvent): void {
    this.events.push(cloneTelemetryEvent(event));
  }

  public snapshot(): AiAssistantTelemetryEvent[] {
    return this.events.map((event) => cloneTelemetryEvent(event));
  }

  public clear(): void {
    this.events.length = 0;
  }
}

export const sharedAiAssistantTelemetryCollector =
  new InMemoryAiAssistantTelemetryCollector();

export function createAiAssistantTelemetryCollector(): AiAssistantTelemetryCollector {
  return new InMemoryAiAssistantTelemetryCollector();
}

export function getSharedAiAssistantTelemetryCollector(): AiAssistantTelemetryCollector {
  return sharedAiAssistantTelemetryCollector;
}

function cloneTelemetryEvent<T extends AiAssistantTelemetryEvent>(event: T): T {
  if (event.kind === 'interaction') {
    return {
      ...event,
      context: { ...event.context },
      tokenUsage: event.tokenUsage ? { ...event.tokenUsage } : undefined,
    };
  }

  if (event.kind === 'repair') {
    return {
      ...event,
      context: { ...event.context },
    };
  }

  return {
    ...event,
    context: { ...event.context },
    actionKinds: [...event.actionKinds],
  };
}
