import type { Signal } from '@angular/core';
import { assertInInjectionContext, inject } from '@angular/core';
import type { MatIcon } from '@angular/material/icon'; // @browser
import { Route } from '@angular/router';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Router,
} from '@angular/router';

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

export interface TaonAdminSearchOptions {
  label?: string | (() => string) | Signal<string>;
  keywords?: readonly string[];
}

export interface TaonAdminRouteOptions<
  TContext = unknown,
> extends TaonAdminMenuCallbacks<TContext> {
  path: string;
  color?: string;
  loader: () => Promise<TaonAdminRoutes>;

  menuItem?: string | (() => string) | Signal<string>;

  //#region @browser
  icon?: MatIcon['fontIcon'];
  //#endregion

  expandable?: boolean;

  hideInNavigation?: boolean;

  /** Opt this route into admin page search. */
  search?: boolean | TaonAdminSearchOptions;
}

export const TaonBaselineBackofficeOutletName = 'admin';

export function resolveTaonAdminMenuItem(
  menuItem: TaonAdminRouteOptions['menuItem'],
): string | undefined {
  return typeof menuItem === 'function' ? menuItem() : menuItem;
}

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
    search,
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
      search,
      isDisabled,
      isDisabledTooltip,
      isVisible,
    },

    loadChildren: loader,
    loadAdminChildren: loader,
  };
}
//#endregion

export function injectNavigateTo() {
  assertInInjectionContext(injectNavigateTo);

  const router = inject(Router);
  const route = inject(ActivatedRoute);

  function findOutlet(
    snapshot: ActivatedRouteSnapshot,
    outletName: string,
  ): ActivatedRouteSnapshot | undefined {
    if (snapshot.outlet === outletName) {
      return snapshot;
    }

    for (const child of snapshot.children) {
      const found = findOutlet(child, outletName);

      if (found) {
        return found;
      }
    }

    return undefined;
  }

  return (path: string, fragment?: string): Promise<boolean> => {
    const adminOutlet = findOutlet(router.routerState.snapshot.root, 'admin');

    return router.navigate(
      [
        {
          outlets: {
            primary: path,
            ...(adminOutlet
              ? {
                  admin: adminOutlet.url.map(segment => segment.path),
                }
              : {}),
          },
        },
      ],
      {
        relativeTo: route.root,
        fragment: fragment?.replace(/^#/, ''),
      },
    );
  };
}
