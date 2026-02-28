export { WorkspaceShell } from './WorkspaceShell.ts';
export { WallpaperService } from './services/WallpaperService.ts';
export type { WorkspaceModule } from './WorkspaceModule.ts';
export type { WorkspaceView } from './WorkspaceView.ts';
export {
  WORKSPACE_VIEW_CHANGE_REQUEST_EVENT,
  WORKSPACE_VIEW_CHANGED_EVENT,
  emitWorkspaceViewChanged,
  emitWorkspaceViewChangeRequested,
  isWorkspaceView,
  isWorkspaceViewChangeRequestDetail,
  isWorkspaceViewChangedDetail,
  type WorkspaceViewChangeRequestDetail,
  type WorkspaceViewChangedDetail,
} from './workspaceEvents.ts';
