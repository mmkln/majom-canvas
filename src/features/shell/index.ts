export { WorkspaceShell } from './WorkspaceShell.ts';
export { WallpaperService } from './services/WallpaperService.ts';
export type { WorkspaceModule } from './WorkspaceModule.ts';
export type { WorkspaceView } from './WorkspaceView.ts';
export {
  TIME_CLUSTERING_TOGGLE_REQUEST_EVENT,
  TIME_CLUSTERING_VISIBILITY_CHANGED_EVENT,
  WORKSPACE_VIEW_CHANGE_REQUEST_EVENT,
  WORKSPACE_VIEW_CHANGED_EVENT,
  emitTimeClusteringToggleRequested,
  emitTimeClusteringVisibilityChanged,
  emitWorkspaceViewChanged,
  emitWorkspaceViewChangeRequested,
  isWorkspaceView,
  isTimeClusteringToggleRequestDetail,
  isTimeClusteringVisibilityChangedDetail,
  isWorkspaceViewChangeRequestDetail,
  isWorkspaceViewChangedDetail,
  type TimeClusteringToggleRequestDetail,
  type TimeClusteringVisibilityChangedDetail,
  type WorkspaceViewChangeRequestDetail,
  type WorkspaceViewChangedDetail,
} from './workspaceEvents.ts';
export {
  AI_ASSISTANT_TOGGLE_REQUEST_EVENT,
  AI_ASSISTANT_VISIBILITY_CHANGED_EVENT,
  emitAiAssistantToggleRequested,
  emitAiAssistantVisibilityChanged,
  isAiAssistantToggleRequestDetail,
  isAiAssistantVisibilityChangedDetail,
  type AiAssistantToggleRequestDetail,
  type AiAssistantVisibilityChangedDetail,
} from '../ai-assistant/aiAssistantEvents.ts';
