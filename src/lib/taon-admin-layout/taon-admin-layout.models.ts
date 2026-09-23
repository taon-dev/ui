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

type MaterialIcon =
  | 'manage_accounts'
  | 'dashboard'
  | 'home'
  | 'settings'
  | 'admin_panel_settings'
  | 'person'
  | 'people'
  | 'group'
  | 'groups'
  | 'account_circle'
  | 'login'
  | 'logout'
  | 'lock'
  | 'lock_open'
  | 'security'
  | 'key'
  | 'verified_user'
  | 'shield'
  | 'email'
  | 'mail'
  | 'inbox'
  | 'send'
  | 'campaign'
  | 'notifications'
  | 'article'
  | 'description'
  | 'edit'
  | 'add'
  | 'delete'
  | 'delete_forever'
  | 'restore_from_trash'
  | 'content_copy'
  | 'save'
  | 'search'
  | 'filter_list'
  | 'refresh'
  | 'sync'
  | 'more_vert'
  | 'more_horiz'
  | 'menu'
  | 'close'
  | 'check'
  | 'done'
  | 'warning'
  | 'error'
  | 'info'
  | 'help'
  | 'visibility'
  | 'visibility_off'
  | 'folder'
  | 'folder_open'
  | 'upload'
  | 'download'
  | 'cloud'
  | 'cloud_upload'
  | 'storage'
  | 'database'
  | 'dns'
  | 'code'
  | 'terminal'
  | 'api'
  | 'extension'
  | 'web'
  | 'language'
  | 'public'
  | 'link'
  | 'shopping_cart'
  | 'shopping_bag'
  | 'store'
  | 'inventory'
  | 'inventory_2'
  | 'payments'
  | 'payment'
  | 'credit_card'
  | 'receipt'
  | 'receipt_long'
  | 'sell'
  | 'local_shipping'
  | 'analytics'
  | 'bar_chart'
  | 'pie_chart'
  | 'query_stats'
  | 'monitoring'
  | 'trending_up'
  | 'history'
  | 'schedule'
  | 'calendar_month'
  | 'build'
  | 'tune'
  | 'apps'
  | 'widgets'
  | 'category'
  | 'supervisor_account';

export interface TaonAdminRouteOptions {
  path: string;
  color?: string;
  loader: () => Promise<TaonAdminRoutes>;

  menuItem?: string;

  icon?: MaterialIcon;

  expandable?: boolean;

  hideInNavigation?: boolean;
}

export function adminLazyRoute(options: TaonAdminRouteOptions): TaonAdminRoute {
  const { path, loader, menuItem, icon, color, expandable, hideInNavigation } =
    options;

  return {
    path,

    data: {
      menuItem,
      color,
      icon,
      expandable,
      hideInNavigation,
    },

    loadChildren: loader,
    loadAdminChildren: loader,
  };
}
