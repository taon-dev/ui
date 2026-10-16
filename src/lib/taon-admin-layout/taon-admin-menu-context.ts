import { Injectable, signal } from '@angular/core';
import { Route } from '@angular/router';

import { TaonAdminMenuCallbacks } from './taon-admin-layout.models';

@Injectable()
export class TaonAdminMenuContext {
  readonly context = signal<unknown>(undefined);

  isVisible(route: Route): boolean {
    return (
      !route.data?.['hideInNavigation'] &&
      this.callbacks(route)?.isVisible?.({ context: this.context() }) !== false
    );
  }

  isDisabled(route: Route): boolean {
    return (
      this.callbacks(route)?.isDisabled?.({ context: this.context() }) === true
    );
  }

  disabledTooltip(route: Route): string {
    return this.isDisabled(route)
      ? (this.callbacks(route)?.isDisabledTooltip?.({
          context: this.context(),
        }) ?? '')
      : '';
  }

  private callbacks(route: Route): TaonAdminMenuCallbacks | undefined {
    // Angular Route.data erases the application's context type at the router boundary.
    return route.data as TaonAdminMenuCallbacks | undefined;
  }
}
