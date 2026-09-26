//#region imports
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
//#endregion

export interface TaonErrorDetailsDialogData {
  message: string;
  details: string;
}

@Component({
  selector: 'taon-error-details-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './taon-error-details-dialog.component.html',
  styleUrls: ['./taon-error-details-dialog.component.scss'],
})
export class TaonErrorDetailsDialogComponent {
  readonly data = inject<TaonErrorDetailsDialogData>(MAT_DIALOG_DATA);
}
