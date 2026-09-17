import { Component } from '@angular/core';
import { Route, Routes } from '@angular/router';

export interface TaonAdminRoute extends Route {
  /**
   * Used only by TaonAdminLayout to discover lazy navigation children.
   *
   * This loads route metadata, NOT page components.
   */
  loadAdminChildren?: () => Promise<TaonAdminRoutes>;
}

export type TaonAdminRoutes = TaonAdminRoute[];

export function adminLazyRoutes(
  loader: () => Promise<TaonAdminRoutes>,
): Pick<TaonAdminRoute, 'loadChildren' | 'loadAdminChildren'> {
  return {
    loadChildren: loader,
    loadAdminChildren: loader,
  };
}

