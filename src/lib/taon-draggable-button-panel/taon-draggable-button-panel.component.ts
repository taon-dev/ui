import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

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
export class TaonDraggableButtonPanelComponent {
  readonly State = TaonDraggableButtonPanelState;

  @ViewChild(CdkDrag)
  private drag?: CdkDrag;

  @Input()
  buttonIcon = 'admin_panel_settings';

  @Input()
  title = 'Admin';

  @Input()
  set state(state: TaonDraggableButtonPanelState) {
    this.currentState.set(state);
  }

  @Output()
  readonly stateChange = new EventEmitter<TaonDraggableButtonPanelState>();

  private resetDragPosition(): void {
    this.drag?.reset();
  }

  protected readonly currentState = signal(
    TaonDraggableButtonPanelState.CLICKABLE_BUTTON,
  );

  protected setState(next: TaonDraggableButtonPanelState): void {
    if (!this.isTransitionAllowed(next)) {
      return;
    }

    this.currentState.set(next);
    this.stateChange.emit(next);
  }

  protected open(): void {
    this.setState(TaonDraggableButtonPanelState.WINDOW);
  }

  protected returnToButton(): void {
    this.setState(TaonDraggableButtonPanelState.CLICKABLE_BUTTON);
  }

  protected windowMode(): void {
    this.setState(TaonDraggableButtonPanelState.WINDOW);
  }

  protected fullScreenDraggable(): void {
    this.resetDragPosition();

    this.setState(TaonDraggableButtonPanelState.FULL_SCREEN_DRAGGABLE);
  }

  protected lockFullScreen(): void {
    this.resetDragPosition();

    this.setState(TaonDraggableButtonPanelState.FULL_SCREEN_LOCKED);
  }

  protected isDraggingEnabled(): boolean {
    return (
      this.currentState() === TaonDraggableButtonPanelState.WINDOW ||
      this.currentState() ===
        TaonDraggableButtonPanelState.FULL_SCREEN_DRAGGABLE
    );
  }

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
