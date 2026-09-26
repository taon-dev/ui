//#region imports
import { inject, Injectable } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';

import {
  TaonNotificationInput,
  TaonNotificationOptions,
} from './taon-backoffice-notifications.models';
import {
  TaonErrorToastComponent,
  TaonErrorToastData,
} from './taon-error-toast.component';
//#endregion

@Injectable({
  providedIn: 'root',
})
export class TaonBackofficeNotificationsService {
  //#region injections
  private readonly toast = inject(HotToastService);
  //#endregion

  //#region private methods
  private normalize(input: TaonNotificationInput): TaonNotificationOptions {
    return typeof input === 'string' ? { title: input } : input;
  }
  //#endregion

  //#region notifications
  success(input: TaonNotificationInput) {
    const { title } = this.normalize(input);

    return this.toast.success(title);
  }

  error(input: TaonNotificationInput) {
    const { title, details } = this.normalize(input);

    // Normal error - exactly as before
    if (!details) {
      return this.toast.error(title);
    }

    // Error with clickable details
    return this.toast.error<TaonErrorToastData>(TaonErrorToastComponent, {
      data: {
        title,
        details,
      },
    });
  }

  warn(input: TaonNotificationInput) {
    const { title } = this.normalize(input);

    return this.toast.warning(title);
  }

  info(input: TaonNotificationInput) {
    const { title } = this.normalize(input);

    return this.toast.info(title);
  }
  //#endregion
}
