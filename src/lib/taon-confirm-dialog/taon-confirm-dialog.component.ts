import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

export interface TaonConfirmDialogData {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './taon-confirm-dialog.component.html',
})
export class TaonConfirmDialogComponent {
  readonly t = t.for(this);

  readonly data = inject<TaonConfirmDialogData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject(MatDialogRef<TaonConfirmDialogComponent>);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
