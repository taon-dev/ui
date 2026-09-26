import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HotToastRef } from '@ngneat/hot-toast';

import { TaonErrorDetailsDialogComponent } from './taon-error-details-dialog.component';

export interface TaonErrorToastData {
  title: string;
  details: string;
}

@Component({
  selector: 'taon-error-toast',
  standalone: true,
  template: `
    <div
      class="taon-error-toast"
      (click)="showDetails()">
      <div>{{ data.title }}</div>

      <small> Click for details </small>
    </div>
  `,
  styles: [
    `
      .taon-error-toast {
        cursor: pointer;
      }

      small {
        display: block;
        margin-top: 4px;
        opacity: 0.7;
      }
    `,
  ],
})
export class TaonErrorToastComponent {
  private readonly toastRef =
    inject<HotToastRef<TaonErrorToastData>>(HotToastRef);

  private readonly dialog = inject(MatDialog);

  readonly data = this.toastRef.data;

  showDetails(): void {
    this.dialog.open(TaonErrorDetailsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: {
        message: this.data.title,
        details: this.data.details,
      },
    });

    this.toastRef.close();
  }
}
