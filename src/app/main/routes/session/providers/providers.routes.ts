//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoutes } from '@taon-dev/ui/src';

import { ProvidersComponent } from './providers.component';
//#endregion

export const ProvidersRoutes: Routes = [
  {
    path: '',
    component: ProvidersComponent,
    children: [
      {
        path: 'provider-info',
        data: {
          menuItem: 'Provider info tab',
          icon: 'monitoring',
        },
        ...adminLazyRoutes(() =>
          import('./provider-info/provider-info.routes').then(
            m => m.ProviderInfoRoutes,
          ),
        ),
      },
      {
        path: 'provider-items',
        data: {
          menuItem: 'Provider items tab',
          icon: 'monitoring',
        },
        ...adminLazyRoutes(() =>
          import('./provider-items/provider-items.routes').then(
            m => m.ProviderItemsRoutes,
          ),
        ),
      },
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
export default ProvidersRoutes;
