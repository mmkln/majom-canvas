import { WorkspaceChatApiClient } from './WorkspaceChatApiClient.ts';
import { WorkspaceChatOrchestrator } from './WorkspaceChatOrchestrator.ts';
import { WorkspaceChatPersistence } from './WorkspaceChatPersistence.ts';
import { WorkspaceChatService } from './WorkspaceChatService.ts';
import { WorkspaceChatSessionController } from './WorkspaceChatSessionController.ts';
import type { WorkspaceChatToolHost } from './WorkspaceChatToolTypes.ts';

type WorkspaceChatRuntimeOptions = {
  resolveLiveHost?: () => WorkspaceChatToolHost | null;
  persistence?: WorkspaceChatPersistence;
};

export type WorkspaceChatRuntime = {
  apiClient: WorkspaceChatApiClient;
  orchestrator: WorkspaceChatOrchestrator;
  service: WorkspaceChatService;
  controller: WorkspaceChatSessionController;
};

export function createWorkspaceChatRuntime(
  options: WorkspaceChatRuntimeOptions = {}
): WorkspaceChatRuntime {
  const apiClient = new WorkspaceChatApiClient();
  const orchestrator = new WorkspaceChatOrchestrator({
    apiClient,
  });
  const service = new WorkspaceChatService({
    apiClient,
    orchestrator,
  });
  const controller = new WorkspaceChatSessionController({
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
