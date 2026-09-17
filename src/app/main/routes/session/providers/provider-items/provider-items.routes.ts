//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoutes } from '@taon-dev/ui/src';

import { ProviderItemsComponent } from './provider-items.component';
//#endregion

export const ProviderItemsRoutes: Routes = [
  {
    path: '',
    component: ProviderItemsComponent,
    children: [
      {
        path: 'provider-info-comparasion',
        data: {
          menuItem: 'Provider comprasion tab',
          icon: 'monitoring',
        },
        ...adminLazyRoutes(() =>
          import('./provider-info-comparasion/provider-info-comparasion.routes').then(
            m => m.ProviderInfoComparasionRoutes,
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
 * By default exporting ProviderItemsRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
export default ProviderItemsRoutes;
