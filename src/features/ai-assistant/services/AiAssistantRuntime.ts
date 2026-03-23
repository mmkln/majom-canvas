import { AiAssistantApiClient } from './AiAssistantApiClient.ts';
import { AiAssistantOrchestrator } from './AiAssistantOrchestrator.ts';
import { AiAssistantPersistence } from './AiAssistantPersistence.ts';
import { AiAssistantService } from './AiAssistantService.ts';
import { AiAssistantSessionController } from './AiAssistantSessionController.ts';
import type { AiAssistantToolHost } from './AiAssistantToolTypes.ts';

type AiAssistantRuntimeOptions = {
  resolveLiveHost?: () => AiAssistantToolHost | null;
  persistence?: AiAssistantPersistence;
};

export type AiAssistantRuntime = {
  apiClient: AiAssistantApiClient;
  orchestrator: AiAssistantOrchestrator;
  service: AiAssistantService;
  controller: AiAssistantSessionController;
};

export function createAiAssistantRuntime(
  options: AiAssistantRuntimeOptions = {}
): AiAssistantRuntime {
  const apiClient = new AiAssistantApiClient();
  const orchestrator = new AiAssistantOrchestrator({
    apiClient,
  });
  const service = new AiAssistantService({
    apiClient,
    orchestrator,
  });
  const controller = new AiAssistantSessionController({
    persistence: options.persistence,
    service,
    resolveLiveHost: options.resolveLiveHost,
  });

  return {
    apiClient,
    orchestrator,
    service,
    controller,
  };
}
