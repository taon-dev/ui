//#region imports
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Translation } from '@taon-dev/i18n/src';
import {
  TaonDatatableComponent,
  TaonDetachableDialogContentComponent,
  TaonDetachedWindowsHostComponent,
} from '@taon-dev/ui/src';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
import { Taon } from 'taon/src';

import { UserApiService } from '../../../../../app';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    RouterOutlet,
    TaonDatatableComponent,
    TaonDetachableDialogContentComponent,
  ],
})
export class TrackingComponent {
  readonly t = t.for(this);

  TrackingComponent = TrackingComponent;

  userApiService = inject(UserApiService);

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public get crud() {
    return this.userApiService.userController as any;
  }

  columns: MtxGridColumn[] = [
    {
      header: this.t.gettext('ID'),
      field: 'id',
      sortable: true,
    },
    {
      header: this.t.gettext('NAME'),
      field: 'name',
      sortable: true,
    },
  ];

  add() {}
}
