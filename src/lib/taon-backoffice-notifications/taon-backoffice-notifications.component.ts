//#region imports
import { Component, DestroyRef, inject, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Translation } from '@taon-dev/i18n/src';
import {
  HttpResponseError,
  Resource,
  RestErrorResponseWrapper,
} from 'ng2-rest/src';
import { Taon } from 'taon/src';
import { _ } from 'tnp-core/src';

import { TaonBackofficeNotificationsService } from './taon-backoffice-notifications.service';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-backoffice-notifications',
  standalone: true,
  templateUrl: './taon-backoffice-notifications.component.html',
  styleUrls: ['./taon-backoffice-notifications.component.scss'],
})
export class TaonBackofficeNotificationsComponent {
  //#region injections
  t = t.for(this);

  private readonly notification = inject(TaonBackofficeNotificationsService);

  private readonly destroyRef = inject(DestroyRef);

  @Input() filter: (
    err: HttpResponseError<RestErrorResponseWrapper>,
  ) => HttpResponseError<RestErrorResponseWrapper>;

  //#endregion

  //#region constructor
  constructor() {
    Resource.listenErrors
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((error: HttpResponseError<RestErrorResponseWrapper>) => {
        if (_.isFunction(this.filter)) {
          error = this.filter(error);
        }
        let jsonMsg = error?.body?.json;
        if (!jsonMsg.message) {
          console.log({ error });
        }
        this.notification.error(jsonMsg?.message || t.gettext('Unknown error'));
      });
  }
  //#endregion
}
