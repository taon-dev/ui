import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
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
import { filter, Subscription } from 'rxjs';

import { TaonDraggableButtonPanelState } from './taon-draggable-button-panel.models';

@Component({
  selector: 'taon-draggable-button-panel',
  standalone: true,
  imports: [
    CdkDrag,
    CdkDragHandle,

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

  protected readonly currentState = signal(
    TaonDraggableButtonPanelState.CLICKABLE_BUTTON,
  );

  private routerSubscription?: Subscription;

  constructor(private readonly router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.ensureOutletBasePath();

    this.restoreStateFromUrl();

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.restoreStateFromUrl();
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private async ensureOutletBasePath(): Promise<void> {
    if (!this.outlet || !this.basePath) {
      return;
    }

    const tree = this.router.parseUrl(this.router.url);

    /**
     * Outlet already exists — don't touch it.
     *
     * For example:
     * (admin:main/session/providers)
     */
    if (tree.root.children[this.outlet]) {
      return;
    }

    const baseSegments = this.basePath.split('/').filter(Boolean);

    if (!baseSegments.length) {
      return;
    }

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
     * We store the panel state on the first segment:
     *
     * admin:
     *
     * main;state=WINDOW/session/providers
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
     * URL restoration should NOT go through
     * the transition state machine.
     *
     * A bookmarked URL is authoritative.
     */
    this.currentState.set(state);

    /**
     * Fullscreen must never inherit an old
     * CdkDrag transform.
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
     * In that case there is nowhere sensible
     * to attach its matrix parameter.
     */
    if (!outletGroup || outletGroup.segments.length === 0) {
      return;
    }

    const rootSegment = outletGroup.segments[0];

    /**
     * Preserve any existing matrix params.
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
