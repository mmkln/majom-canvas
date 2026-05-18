import { Subscription } from 'rxjs';
import { environment } from '../../config/environment.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import { HttpInterceptorClient } from '../../majom-wrapper/data-access/http-interceptor.ts';
import { FlowsApiService } from '../../majom-wrapper/data-access/flows-api-service.ts';
import { GoalsApiService } from '../../majom-wrapper/data-access/goals-api-service.ts';
import { StoriesApiService } from '../../majom-wrapper/data-access/stories-api-service.ts';
import {
  ApiTaskRelationCatalog,
  type TaskRelationCatalogPort,
} from '../tasks/index.ts';
import { FlowsStore } from './state/FlowsStore.ts';
import { FlowsView } from './ui/FlowsView.ts';

type FlowsAppOptions = {
  runtime?: AppRuntime;
  flowsApi?: FlowsApiService;
  goalsApi?: GoalsApiService;
  storiesApi?: StoriesApiService;
  taskRelationCatalog?: TaskRelationCatalogPort;
};

export class FlowsApp {
  private root: HTMLDivElement | null = null;
  private store: FlowsStore | null = null;
  private view: FlowsView | null = null;
  private subscriptions = new Subscription();
  private readonly runtime: AppRuntime;
  private readonly flowsApi: FlowsApiService;
  private readonly taskRelationCatalog: TaskRelationCatalogPort;

  constructor(options: FlowsAppOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
    const http = new HttpInterceptorClient(environment.apiUrl);
    this.flowsApi = options.flowsApi ?? new FlowsApiService(http);
    const goalsApi = options.goalsApi ?? new GoalsApiService(http);
    const storiesApi = options.storiesApi ?? new StoriesApiService(http);
    this.taskRelationCatalog =
      options.taskRelationCatalog ??
      new ApiTaskRelationCatalog({
        goalsApi,
        storiesApi,
      });
  }

  public mount(parent: HTMLElement): void {
    if (this.root) return;

    const root = document.createElement('div');
    root.dataset.module = 'flows';
    root.className = 'h-full w-full';
    parent.appendChild(root);
    this.root = root;

    const store = new FlowsStore(this.flowsApi);
    const view = new FlowsView(root, this.runtime, {
      onCreateFlow: (payload) => store.createFlow(payload),
      onCreateTask: (flowId, title) => store.createFlowTask(flowId, title),
      onLoadTask: (flowId, taskRef) => store.loadFlowTask(flowId, taskRef),
      onPatchTask: (flowId, taskRef, patch) =>
        store.patchFlowTask(flowId, taskRef, patch),
      taskRelationCatalog: this.taskRelationCatalog,
      onPatchFlow: (flowId, patch) => store.patchFlow(flowId, patch),
      onCreateCurrentFlowFocus: (flowId, payload) =>
        store.createCurrentFlowFocus(flowId, payload),
      onPatchFlowFocus: (flowId, focusId, payload) =>
        store.patchFlowFocus(flowId, focusId, payload),
      onCompleteFlowFocus: (flowId, focusId, payload) =>
        store.completeFlowFocus(flowId, focusId, payload),
      onReorderFlow: (flowId, insertionIndex) =>
        store.reorderFlowColumns(flowId, insertionIndex),
      onDeleteFlow: (flowId) => store.deleteFlow(flowId),
    });
    this.store = store;
    this.view = view;

    this.subscriptions.add(
      store.state$.subscribe((state) => view.render(state))
    );
    this.subscriptions.add(
      this.runtime.subscribe(() => {
        view.render(store.snapshot);
      })
    );
    void store.load();
  }

  public unmount(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.store?.destroy();
    this.store = null;
    this.view?.destroy();
    this.view = null;
    this.root?.remove();
    this.root = null;
  }
}
