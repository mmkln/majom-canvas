import { Subscription } from 'rxjs';
import { environment } from '../../config/environment.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import { HttpInterceptorClient } from '../../majom-wrapper/data-access/http-interceptor.ts';
import { FlowsApiService } from '../../majom-wrapper/data-access/flows-api-service.ts';
import { FlowsStore } from './state/FlowsStore.ts';
import { FlowsView } from './ui/FlowsView.ts';

type FlowsAppOptions = {
  runtime?: AppRuntime;
  flowsApi?: FlowsApiService;
};

export class FlowsApp {
  private root: HTMLDivElement | null = null;
  private store: FlowsStore | null = null;
  private view: FlowsView | null = null;
  private subscriptions = new Subscription();
  private readonly runtime: AppRuntime;
  private readonly flowsApi: FlowsApiService;

  constructor(options: FlowsAppOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.flowsApi =
      options.flowsApi ??
      new FlowsApiService(new HttpInterceptorClient(environment.apiUrl));
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
      onPatchFlow: (flowId, patch) => store.patchFlow(flowId, patch),
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
