import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'taon-purchase-status-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './taon-purchase-status.dialog.component.html',
})
export class TaonPurchaseStatusDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { success: boolean; message: string },
  ) {}
}
