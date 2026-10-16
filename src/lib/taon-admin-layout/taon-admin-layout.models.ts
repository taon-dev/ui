import type { MatIcon } from '@angular/material/icon'; // @browser
import { Route } from '@angular/router';

export interface TaonAdminRoute extends Route {
  /**
   * Used only by TaonAdminLayout to discover lazy navigation children.
   *
   * This loads route metadata, NOT page components.
   */
  loadAdminChildren?: () => Promise<TaonAdminRoutes>;
}

export type TaonAdminRoutes = TaonAdminRoute[];

export interface TaonAdminMenuCallbacks<TContext = unknown> {
  isDisabled?: (params: { context: TContext }) => boolean;
  isDisabledTooltip?: (params: { context: TContext }) => string;
  isVisible?: (params: { context: TContext }) => boolean;
}

export interface TaonAdminRouteOptions<
  TContext = unknown,
> extends TaonAdminMenuCallbacks<TContext> {
  path: string;
  color?: string;
  loader: () => Promise<TaonAdminRoutes>;

  menuItem?: string;

  //#region @browser
  icon?: MatIcon['fontIcon'];
  //#endregion

  expandable?: boolean;

  hideInNavigation?: boolean;
}

export const TaonBaselineBackofficeOutletName = 'admin';

//#region @browser
export function adminLazyRoute<TContext = unknown>(
  options: TaonAdminRouteOptions<TContext>,
): TaonAdminRoute {
  const {
    path,
    loader,
    menuItem,
    icon,
    color,
    expandable,
    hideInNavigation,
    isDisabled,
    isDisabledTooltip,
    isVisible,
  } = options;

  return {
    path,

    data: {
      menuItem,
      color,
      icon,
      expandable,
      hideInNavigation,
      isDisabled,
      isDisabledTooltip,
      isVisible,
    },

    loadChildren: loader,
    loadAdminChildren: loader,
  };
}
//#endregion
