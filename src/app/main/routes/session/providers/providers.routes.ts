//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoute } from '@taon-dev/ui/src';
//#endregion

export const ProvidersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./providers.component').then(c => c.ProvidersComponent),
    children: [
      adminLazyRoute({
        path: 'provider-info',
        menuItem: 'Provider info tab',
        icon: 'monitoring',
        loader: () =>
          import('./provider-info/provider-info.routes').then(
            m => m.ProviderInfoRoutes,
          ),
      }),
      adminLazyRoute({
        path: 'provider-items',
        menuItem: 'Provider items tab',
        icon: 'monitoring',
        loader: () =>
          import('./provider-items/provider-items.routes').then(
            m => m.ProviderItemsRoutes,
          ),
      }),
    ],
  },
  // {
  //   path: 'anothermodulepath',
  //   loadChildren: () => import('anothermodule')
  //     .then(m => m.AnotherLazyModule),
  // },
];

/**
 * By default exporting ProvidersRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
// export default ProvidersRoutes;
