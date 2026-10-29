import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HotToastRef } from '@ngneat/hot-toast';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

import { TaonErrorDetailsDialogComponent } from './taon-error-details-dialog.component';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

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

      <small>{{ t.gettext('Click for details') }}</small>
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
  readonly t = t.for(this);

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
