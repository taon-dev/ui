import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface TaonConfirmDialogData {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'taon-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './taon-confirm-dialog.component.html',
})
export class TaonConfirmDialogComponent {
  readonly data = inject<TaonConfirmDialogData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject(MatDialogRef<TaonConfirmDialogComponent>);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
