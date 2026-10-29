import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-purchase-status-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './taon-purchase-status.dialog.component.html',
})
export class TaonPurchaseStatusDialogComponent {
  readonly t = t.for(this);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { success: boolean; message: string },
  ) {}
}
