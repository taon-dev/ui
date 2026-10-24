//#region imports
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  ElementRef,
  EnvironmentInjector,
  Injectable,
  InjectionToken,
  Injector,
  Input,
  OnDestroy,
  Type,
  ViewChild,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Params,
  Router,
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
//#endregion

//#region tokens
export const TAON_IS_DETACHED_WINDOW = new InjectionToken<boolean>(
  'TAON_IS_DETACHED_WINDOW',
  {
    factory: () => false,
  },
);
//#endregion

//#region models
export interface TaonDetachedRouteState {
  url: string;

  params: Params;

  queryParams: Params;

  fragment: string | null;

  data: Record<string, any>;
}

export interface TaonDetachedWindow {
  id: string;

  title: string;

  component: Type<any>;

  routeState: TaonDetachedRouteState;

  /**
   * Current stacking order of the window.
   *
   * Higher value = window is closer to the user.
   */
  zIndex: number;

  componentRef?: ComponentRef<any>;
}
//#endregion

//#region helpers
function cloneObject<T extends Record<string, any>>(value: T | undefined): T {
  return {
    ...(value || {}),
  } as T;
}

function createDetachedActivatedRoute(
  state: TaonDetachedRouteState,
): ActivatedRoute {
  const params$ = new BehaviorSubject<Params>(cloneObject(state.params));

  const queryParams$ = new BehaviorSubject<Params>(
    cloneObject(state.queryParams),
  );

  const fragment$ = new BehaviorSubject<string | null>(state.fragment);

  const data$ = new BehaviorSubject<Record<string, any>>(
    cloneObject(state.data),
  );

  const snapshot = {
    params: cloneObject(state.params),

    queryParams: cloneObject(state.queryParams),

    fragment: state.fragment,

    data: cloneObject(state.data),

    paramMap: undefined,

    queryParamMap: undefined,
  } as unknown as ActivatedRouteSnapshot;

  return {
    snapshot,

    params: params$.asObservable(),

    queryParams: queryParams$.asObservable(),

    fragment: fragment$.asObservable(),

    data: data$.asObservable(),
  } as unknown as ActivatedRoute;
}
//#endregion

//#region detached windows service
@Injectable({
  providedIn: 'root',
})
export class TaonDetachedWindowsService {
  //#region fields

  /**
   * Base z-index for all detached windows.
   */
  private readonly baseZIndex = 10000;

  /**
   * Monotonically increasing focus counter.
   *
   * Every time a window receives focus it gets the next value.
   */
  private zIndexCounter = this.baseZIndex;

  readonly windows = signal<TaonDetachedWindow[]>([]);

  //#endregion

  //#region open
  open(options: {
    title: string;
    component: Type<any>;
    routeState: TaonDetachedRouteState;
  }): string {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `taon-window-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const zIndex = ++this.zIndexCounter;

    this.windows.update(windows => [
      ...windows,
      {
        id,

        title: options.title,

        component: options.component,

        routeState: options.routeState,

        zIndex,
      },
    ]);

    return id;
  }
  //#endregion

  //#region focus
  focus(id: string): void {
    const windows = this.windows();

    const windowToFocus = windows.find(window => window.id === id);

    if (!windowToFocus) {
      return;
    }

    /**
     * Don't create a new signal value if this window
     * is already the top-most window.
     */
    const highestZIndex = Math.max(...windows.map(window => window.zIndex));

    if (windowToFocus.zIndex === highestZIndex) {
      return;
    }

    const zIndex = ++this.zIndexCounter;

    this.windows.update(currentWindows =>
      currentWindows.map(window =>
        window.id === id
          ? {
              ...window,
              zIndex,
            }
          : window,
      ),
    );
  }
  //#endregion

  //#region close
  close(id: string): void {
    const detachedWindow = this.windows().find(current => current.id === id);

    if (detachedWindow?.componentRef) {
      detachedWindow.componentRef.destroy();
    }

    this.windows.update(windows =>
      windows.filter(current => current.id !== id),
    );
  }
  //#endregion

  //#region register component ref
  registerComponentRef(id: string, componentRef: ComponentRef<any>): void {
    this.windows.update(windows =>
      windows.map(window =>
        window.id === id
          ? {
              ...window,
              componentRef,
            }
          : window,
      ),
    );
  }
  //#endregion
}
//#endregion

//#region detached window
@Component({
  selector: 'taon-detached-window',
  standalone: true,
  imports: [
    CommonModule,
    CdkDrag,
    CdkDragHandle,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }

      .taon-detached-window {
        position: absolute;

        top: 80px;
        left: 80px;

        width: min(900px, calc(100vw - 80px));
        height: min(700px, calc(100vh - 80px));

        min-width: 320px;
        min-height: 200px;

        display: flex;
        flex-direction: column;

        background: var(--mat-sys-surface, white);

        color: var(--mat-sys-on-surface, black);

        border: 1px solid var(--mat-sys-outline-variant, #ccc);

        border-radius: 8px;

        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);

        overflow: hidden;

        resize: both;
      }

      .taon-detached-window-header {
        height: 40px;

        flex: 0 0 40px;

        display: flex;
        align-items: center;

        padding-left: 12px;

        border-bottom: 1px solid var(--mat-sys-outline-variant, #ccc);

        user-select: none;
      }

      .taon-detached-window-drag-handle {
        flex: 1;

        height: 100%;

        display: flex;
        align-items: center;

        cursor: move;

        overflow: hidden;
      }

      .taon-detached-window-title {
        overflow: hidden;

        white-space: nowrap;

        text-overflow: ellipsis;

        font-weight: 500;
      }

      .taon-detached-window-actions {
        display: flex;

        align-items: center;

        padding-right: 4px;
      }

      .taon-detached-window-body {
        flex: 1;

        min-height: 0;

        overflow: auto;
      }

      .taon-detached-window-component-host {
        display: block;

        min-height: 100%;
      }
    `,
  ],
  template: `
    <div
      class="taon-detached-window"
      cdkDrag
      [style.z-index]="window.zIndex"
      (pointerdown)="focus()">
      <header class="taon-detached-window-header">
        <div
          class="taon-detached-window-drag-handle"
          cdkDragHandle>
          <span class="taon-detached-window-title">
            {{ window.title }}
          </span>
        </div>

        <div class="taon-detached-window-actions">
          <button
            mat-icon-button
            type="button"
            matTooltip="Close"
            (click)="close()">
            <mat-icon> close </mat-icon>
          </button>
        </div>
      </header>

      <main class="taon-detached-window-body">
        <div
          #componentHost
          class="taon-detached-window-component-host"></div>
      </main>
    </div>
  `,
})
export class TaonDetachedWindowComponent implements AfterViewInit, OnDestroy {
  //#region injections
  private readonly windowsService = inject(TaonDetachedWindowsService);

  private readonly appRef = inject(ApplicationRef);

  private readonly environmentInjector = inject(EnvironmentInjector);

  private readonly injector = inject(Injector);
  //#endregion

  //#region inputs
  @Input({
    required: true,
  })
  window!: TaonDetachedWindow;
  //#endregion

  //#region view children
  @ViewChild('componentHost', {
    static: true,
  })
  componentHost!: ElementRef<HTMLElement>;
  //#endregion

  //#region fields
  private componentRef?: ComponentRef<any>;
  //#endregion

  //#region lifecycle
  ngAfterViewInit(): void {
    this.createDetachedComponent();
  }

  ngOnDestroy(): void {
    this.destroyDetachedComponent();
  }
  //#endregion

  //#region focus
  focus(): void {
    this.windowsService.focus(this.window.id);
  }
  //#endregion

  //#region create detached component
  private createDetachedComponent(): void {
    const detachedActivatedRoute = createDetachedActivatedRoute(
      this.window.routeState,
    );

    const detachedInjector = Injector.create({
      parent: this.injector,

      providers: [
        {
          provide: ActivatedRoute,
          useValue: detachedActivatedRoute,
        },
        {
          provide: TAON_IS_DETACHED_WINDOW,
          useValue: true,
        },
      ],
    });

    const componentRef = createComponent(this.window.component, {
      environmentInjector: this.environmentInjector,

      elementInjector: detachedInjector,

      hostElement: this.componentHost.nativeElement,
    });

    this.componentRef = componentRef;

    this.appRef.attachView(componentRef.hostView);

    componentRef.changeDetectorRef.detectChanges();

    this.windowsService.registerComponentRef(this.window.id, componentRef);
  }
  //#endregion

  //#region destroy detached component
  private destroyDetachedComponent(): void {
    if (!this.componentRef) {
      return;
    }

    try {
      this.appRef.detachView(this.componentRef.hostView);
    } catch {}

    if (!this.componentRef.hostView.destroyed) {
      this.componentRef.destroy();
    }

    this.componentRef = undefined;
  }
  //#endregion

  //#region close
  close(): void {
    this.windowsService.close(this.window.id);
  }
  //#endregion
}
//#endregion

//#region detached windows host
@Component({
  selector: 'taon-detached-windows-host',
  standalone: true,
  imports: [CommonModule, TaonDetachedWindowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        position: fixed;

        inset: 0;

        pointer-events: none;

        /*
         * This only establishes the workspace stacking
         * context. Individual windows control their
         * own z-index.
         */
        z-index: 10000;
      }

      taon-detached-window {
        pointer-events: auto;
      }
    `,
  ],
  template: `
    @for (window of windowsService.windows(); track window.id) {
      <taon-detached-window [window]="window" />
    }
  `,
})
export class TaonDetachedWindowsHostComponent {
  readonly windowsService = inject(TaonDetachedWindowsService);
}
//#endregion

//#region detachable dialog content
@Component({
  selector: 'taon-detachable-dialog-content',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }

      .taon-detachable-content {
        display: flex;

        flex-direction: column;

        min-height: 0;
      }

      .taon-detachable-content-toolbar {
        min-height: 36px;

        display: flex;

        align-items: center;

        justify-content: flex-end;

        border-bottom: 1px solid var(--mat-sys-outline-variant, #ddd);
      }

      .taon-detachable-content-body {
        min-height: 0;
      }
    `,
  ],
  template: `
    <section class="taon-detachable-content">
      @if (!isDetached) {
        <header class="taon-detachable-content-toolbar">
          <button
            mat-icon-button
            type="button"
            matTooltip="Detach"
            (click)="detach()">
            <mat-icon> open_in_new </mat-icon>
          </button>
        </header>
      }

      <div class="taon-detachable-content-body">
        <ng-content />
      </div>
    </section>
  `,
})
export class TaonDetachableDialogContentComponent {
  //#region injections
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly windowsService = inject(TaonDetachedWindowsService);

  readonly isDetached = inject(TAON_IS_DETACHED_WINDOW);
  //#endregion

  //#region inputs
  @Input({
    required: true,
  })
  component!: Type<any>;

  @Input()
  title?: string;
  //#endregion

  //#region detach
  detach(): void {
    if (this.isDetached) {
      return;
    }

    const snapshot = this.route.snapshot;

    const routeState: TaonDetachedRouteState = {
      url: this.router.url,

      params: this.collectParams(snapshot),

      queryParams: cloneObject(snapshot.queryParams),

      fragment: snapshot.fragment,

      data: this.collectData(snapshot),
    };

    this.windowsService.open({
      title: this.title || this.component.name || 'Detached window',

      component: this.component,

      routeState,
    });
  }
  //#endregion

  //#region route utils
  private collectParams(snapshot: ActivatedRouteSnapshot): Params {
    const params: Params = {};

    let current: ActivatedRouteSnapshot | null = snapshot;

    while (current) {
      Object.assign(params, current.params);

      current = current.parent;
    }

    return params;
  }

  private collectData(snapshot: ActivatedRouteSnapshot): Record<string, any> {
    const data: Record<string, any> = {};

    let current: ActivatedRouteSnapshot | null = snapshot;

    while (current) {
      Object.assign(data, current.data);

      current = current.parent;
    }

    return data;
  }
  //#endregion
}
//#endregion
