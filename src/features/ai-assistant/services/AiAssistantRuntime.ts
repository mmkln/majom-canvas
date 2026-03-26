import { AiAssistantApiClient } from './AiAssistantApiClient.ts';
import { AiAssistantOrchestrator } from './AiAssistantOrchestrator.ts';
import { AiAssistantPersistence } from './AiAssistantPersistence.ts';
import { AiAssistantService } from './AiAssistantService.ts';
import { AiAssistantSessionController } from './AiAssistantSessionController.ts';
import type { AiAssistantToolHost } from './AiAssistantToolTypes.ts';
import type { AppRuntime } from '../../../app-runtime/index.ts';

type AiAssistantRuntimeOptions = {
  resolveLiveHost?: () => AiAssistantToolHost | null;
  persistence?: AiAssistantPersistence;
  runtime?: AppRuntime;
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
    i18n: options.runtime?.i18n,
  });
  const controller = new AiAssistantSessionController({
    persistence: options.persistence,
    service,
    resolveLiveHost: options.resolveLiveHost,
    runtime: options.runtime,
  });

  return {
    apiClient,
    orchestrator,
    service,
    controller,
  };
}
