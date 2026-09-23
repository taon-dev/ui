//#region imports
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router } from '@angular/router';
import { filter, firstValueFrom, Subscription, take } from 'rxjs';

import { TaonDraggableButtonPanelState } from './taon-draggable-button-panel.models';
//#endregion

@Component({
  selector: 'taon-draggable-button-panel',
  standalone: true,
  imports: [
    CdkDrag,
    CdkDragHandle,
    NgIf,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './taon-draggable-button-panel.component.html',
  styleUrls: ['./taon-draggable-button-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaonDraggableButtonPanelComponent implements OnInit, OnDestroy {
  readonly State = TaonDraggableButtonPanelState;

  @ViewChild(CdkDrag)
  private drag?: CdkDrag;

  @Input()
  basePath = '';

  @Input()
  buttonIcon = 'admin_panel_settings';

  @Input()
  title = 'Admin';

  /**
   * Named outlet containing this panel's application.
   *
   * Example:
   *
   * outlet="admin"
   *
   * /products/42(admin:main;state=WINDOW/session/providers)
   */
  @Input()
  outlet?: string;

  /**
   * Matrix parameter used for persisting the panel state.
   */
  @Input()
  stateParamName = 'state';

  @Input()
  set state(state: TaonDraggableButtonPanelState) {
    this.currentState.set(state);
  }

  @Output()
  readonly stateChange = new EventEmitter<TaonDraggableButtonPanelState>();

  protected readonly forceFullScreen = signal(window.innerWidth < 900);

  private readonly resizeListener = (): void => {
    const wasForceFullScreen = this.forceFullScreen();
    const forceFullScreen = window.innerWidth < 900;

    this.forceFullScreen.set(forceFullScreen);

    // Desktop -> mobile: remove old CDK drag x/y transform.
    if (!wasForceFullScreen && forceFullScreen) {
      this.resetDragPosition();
    }
  };

  protected readonly currentState = signal(
    TaonDraggableButtonPanelState.CLICKABLE_BUTTON,
  );

  private routerSubscription?: Subscription;

  constructor(private readonly router: Router) {}

  async ngOnInit(): Promise<void> {
    window.addEventListener('resize', this.resizeListener);
    /**
     * IMPORTANT:
     *
     * The component may be created while Angular is still processing
     * the application's initial navigation.
     *
     * For example:
     *
     *   / -> redirectTo: /app
     *
     * If we create:
     *
     *   (admin:main)
     *
     * before that redirect finishes, the auxiliary outlet navigation
     * may effectively replace/interfere with the primary navigation,
     * producing:
     *
     *   /(admin:main)
     *
     * instead of:
     *
     *   /app(admin:main)
     */
    await this.waitForInitialNavigation();

    /**
     * Ensure the auxiliary outlet exists only AFTER the primary
     * application route has settled.
     */
    await this.ensureOutletBasePath();

    /**
     * The outlet may already contain persisted state, e.g.
     *
     * (admin:main;state=WINDOW/dashboard)
     */
    this.restoreStateFromUrl();

    /**
     * From this point on keep the component state synchronized
     * with subsequent router navigations.
     */
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.restoreStateFromUrl();
      });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeListener);
    this.routerSubscription?.unsubscribe();
  }

  protected toogleFullscreen(event: Event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    event.preventDefault();
    if (this.forceFullScreen()) {
      return;
    }
    if (this.currentState() === TaonDraggableButtonPanelState.WINDOW) {
      this.resetDragPosition();
      void this.setState(TaonDraggableButtonPanelState.FULL_SCREEN_LOCKED);
    } else if (
      [
        TaonDraggableButtonPanelState.FULL_SCREEN_DRAGGABLE,
        TaonDraggableButtonPanelState.FULL_SCREEN_LOCKED,
      ].includes(this.currentState())
    ) {
      this.resetDragPosition();
      void this.setState(TaonDraggableButtonPanelState.WINDOW);
    }
  }

  protected effectiveState(): TaonDraggableButtonPanelState {
    if (
      this.forceFullScreen() &&
      this.currentState() !== TaonDraggableButtonPanelState.CLICKABLE_BUTTON
    ) {
      return TaonDraggableButtonPanelState.FULL_SCREEN_LOCKED;
    }

    return this.currentState();
  }

  // ===========================================================================
  // INITIAL ROUTING
  // ===========================================================================

  private async waitForInitialNavigation(): Promise<void> {
    /**
     * Router already completed at least one navigation.
     */
    if (this.router.navigated) {
      return;
    }

    /**
     * Wait until redirects/lazy routing/etc. belonging to the initial
     * navigation have settled.
     */
    await firstValueFrom(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        take(1),
      ),
    );
  }

  private async ensureOutletBasePath(): Promise<void> {
    if (!this.outlet || !this.basePath) {
      return;
    }

    /**
     * IMPORTANT:
     *
     * Parse the URL only AFTER initial navigation has completed.
     *
     * At this point:
     *
     *   /
     *
     * may already have become:
     *
     *   /app
     */
    const tree = this.router.parseUrl(this.router.url);

    /**
     * Outlet already exists — preserve it exactly as it is.
     *
     * Examples:
     *
     *   /app(admin:main)
     *
     *   /app(admin:main;state=WINDOW/dashboard)
     */
    if (tree.root.children[this.outlet]) {
      return;
    }

    const baseSegments = this.basePath.split('/').filter(Boolean);

    if (!baseSegments.length) {
      return;
    }

    /**
     * Add the auxiliary outlet while preserving the current
     * primary route.
     *
     * Example:
     *
     *   /app
     *
     * becomes:
     *
     *   /app(admin:main)
     */
    await this.router.navigate(
      [
        {
          outlets: {
            [this.outlet]: baseSegments,
          },
        },
      ],
      {
        replaceUrl: true,
      },
    );
  }

  // ===========================================================================
  // STATE
  // ===========================================================================

  protected async setState(next: TaonDraggableButtonPanelState): Promise<void> {
    if (!this.isTransitionAllowed(next)) {
      return;
    }

    this.currentState.set(next);

    this.stateChange.emit(next);

    await this.saveStateToUrl(next);
  }

  protected open(): void {
    void this.setState(TaonDraggableButtonPanelState.WINDOW);
  }

  protected returnToButton(): void {
    void this.setState(TaonDraggableButtonPanelState.CLICKABLE_BUTTON);
  }

  protected windowMode(): void {
    void this.setState(TaonDraggableButtonPanelState.WINDOW);
  }

  protected fullScreenDraggable(): void {
    this.resetDragPosition();

    void this.setState(TaonDraggableButtonPanelState.FULL_SCREEN_DRAGGABLE);
  }

  protected lockFullScreen(): void {
    this.resetDragPosition();

    void this.setState(TaonDraggableButtonPanelState.FULL_SCREEN_LOCKED);
  }

  protected isDraggingEnabled(): boolean {
    if (this.forceFullScreen()) {
      return false;
    }

    return (
      this.currentState() === TaonDraggableButtonPanelState.WINDOW ||
      this.currentState() ===
        TaonDraggableButtonPanelState.FULL_SCREEN_DRAGGABLE
    );
  }

  // ===========================================================================
  // URL STATE
  // ===========================================================================

  private restoreStateFromUrl(): void {
    if (!this.outlet) {
      return;
    }

    const tree = this.router.parseUrl(this.router.url);

    const outletGroup = tree.root.children[this.outlet];

    if (!outletGroup) {
      return;
    }

    /**
     * State is stored on the first auxiliary outlet segment:
     *
     * admin:
     *
     * main;state=WINDOW/dashboard
     * └────────────────┘
     */
    const rootSegment = outletGroup.segments[0];

    if (!rootSegment) {
      return;
    }

    const state = rootSegment.parameters[this.stateParamName];

    if (!this.isValidState(state)) {
      return;
    }

    /**
     * URL restoration should NOT go through the transition
     * state machine.
     *
     * A bookmarked/refreshed URL is authoritative.
     */
    this.currentState.set(state);

    /**
     * Fullscreen must never inherit an old CdkDrag transform.
     */
    if (
      state === TaonDraggableButtonPanelState.FULL_SCREEN_DRAGGABLE ||
      state === TaonDraggableButtonPanelState.FULL_SCREEN_LOCKED
    ) {
      queueMicrotask(() => {
        this.resetDragPosition();
      });
    }
  }

  private async saveStateToUrl(
    state: TaonDraggableButtonPanelState,
  ): Promise<void> {
    if (!this.outlet) {
      return;
    }

    const tree = this.router.parseUrl(this.router.url);

    const outletGroup = tree.root.children[this.outlet];

    /**
     * The outlet might not yet exist.
     *
     * In that case there is nowhere sensible to attach
     * its matrix parameter.
     */
    if (!outletGroup || outletGroup.segments.length === 0) {
      return;
    }

    const rootSegment = outletGroup.segments[0];

    /**
     * Preserve any existing matrix parameters.
     */
    rootSegment.parameters = {
      ...rootSegment.parameters,

      [this.stateParamName]: state,
    };

    await this.router.navigateByUrl(tree, {
      replaceUrl: true,
    });
  }

  private isValidState(
    value: string | undefined,
  ): value is TaonDraggableButtonPanelState {
    return Object.values(TaonDraggableButtonPanelState).includes(
      value as TaonDraggableButtonPanelState,
    );
  }

  // ===========================================================================
  // DRAG
  // ===========================================================================

  private resetDragPosition(): void {
    this.drag?.reset();
  }

  // ===========================================================================
  // TRANSITIONS
  // ===========================================================================

  private isTransitionAllowed(next: TaonDraggableButtonPanelState): boolean {
    const current = this.currentState();

    const transitions: Record<
      TaonDraggableButtonPanelState,
      TaonDraggableButtonPanelState[]
    > = {
      [TaonDraggableButtonPanelState.CLICKABLE_BUTTON]: [
        TaonDraggableButtonPanelState.WINDOW,
      ],

      [TaonDraggableButtonPanelState.WINDOW]: [
        TaonDraggableButtonPanelState.CLICKABLE_BUTTON,
        TaonDraggableButtonPanelState.FULL_SCREEN_DRAGGABLE,
        TaonDraggableButtonPanelState.FULL_SCREEN_LOCKED,
      ],

      [TaonDraggableButtonPanelState.FULL_SCREEN_DRAGGABLE]: [
        TaonDraggableButtonPanelState.CLICKABLE_BUTTON,
        TaonDraggableButtonPanelState.WINDOW,
        TaonDraggableButtonPanelState.FULL_SCREEN_LOCKED,
      ],

      [TaonDraggableButtonPanelState.FULL_SCREEN_LOCKED]: [
        TaonDraggableButtonPanelState.CLICKABLE_BUTTON,
        TaonDraggableButtonPanelState.WINDOW,
        TaonDraggableButtonPanelState.FULL_SCREEN_DRAGGABLE,
      ],
    };

    return transitions[current].includes(next);
  }
}
