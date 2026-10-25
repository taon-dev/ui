//#region imports
import { Component, DestroyRef, inject, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Translation } from '@taon-dev/i18n/src';
import {
  HttpResponseError,
  Resource,
  RestErrorResponseWrapper,
} from 'ng2-rest/src';
import { getHttpStatus, Taon, TaonAdminService } from 'taon/src';
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

  private readonly taonAdminService = inject(TaonAdminService);

  @Input() filter: (
    err: HttpResponseError<RestErrorResponseWrapper>,
  ) => HttpResponseError<RestErrorResponseWrapper>;

  private readonly shownNotifications = new Set<string>();

  private showErrorNotification(title: string, details?: string): void {
    const key = JSON.stringify([title, details]);

    if (this.shownNotifications.has(key)) {
      return;
    }

    this.shownNotifications.add(key);

    this.notification.error({
      title,
      details,
    });
  }

  //#endregion

  //#region constructor
  constructor() {
    Resource.listenErrors
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((error: HttpResponseError<RestErrorResponseWrapper>) => {
        if (_.isFunction(this.filter)) {
          error = this.filter(error);
        }

        const jsonMsg = error?.body?.json;

        if (!jsonMsg?.message) {
          console.log({ error });
        }

        const statusCode = jsonMsg.status ?? error.statusCode;

        const code = jsonMsg?.code || getHttpStatus(statusCode);
        if (this.taonAdminService.shouldSkipShowingError(code as any)) {
          console.log(
            `[@taon-dev/sudo] Skipping notificaiton for message "${jsonMsg.message}" (code=${statusCode})`,
          );
        } else {
          const title =
            t.translate(jsonMsg.message) || t.gettext('Unknown error');

          const details = jsonMsg?.details;

          this.showErrorNotification(title, details);
        }
      });
  }
  //#endregion
}
