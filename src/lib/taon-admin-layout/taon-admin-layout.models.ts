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

export interface TaonAdminRouteOptions {
  path: string;

  loader: () => Promise<TaonAdminRoutes>;

  menuItem?: string;

  icon?: string;

  expandable?: boolean;

  hideInNavigation?: boolean;
}

export function adminLazyRoute(options: TaonAdminRouteOptions): TaonAdminRoute {
  const { path, loader, menuItem, icon, expandable, hideInNavigation } =
    options;

  return {
    path,

    data: {
      menuItem,
      icon,
      expandable,
      hideInNavigation,
    },

    loadChildren: loader,
    loadAdminChildren: loader,
  };
}
