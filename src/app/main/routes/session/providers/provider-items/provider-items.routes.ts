//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoute } from '@taon-dev/ui/src';

//#endregion

export const ProviderItemsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./provider-items.component').then(c => c.ProviderItemsComponent),
    children: [
      adminLazyRoute({
        path: 'provider-info-comparasion',

        menuItem: 'Provider comprasion tab',
        icon: 'monitoring',

        loader: () =>
          import('./provider-info-comparasion/provider-info-comparasion.routes').then(
            m => m.ProviderInfoComparasionRoutes,
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
 * By default exporting ProviderItemsRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
// export default ProviderItemsRoutes;
