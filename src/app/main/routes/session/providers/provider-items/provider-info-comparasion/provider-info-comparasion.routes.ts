//#region imports
import { Routes } from '@angular/router';

import { ProviderInfoComparasionComponent } from './provider-info-comparasion.component';
//#endregion

export const ProviderInfoComparasionRoutes: Routes = [
  {
    path: '',
    component: ProviderInfoComparasionComponent,
  },
  // {
  //   path: 'anothermodulepath',
  //   loadChildren: () => import('anothermodule')
  //     .then(m => m.AnotherLazyModule),
  // },
];

/**
 * By default exporting ProviderInfoComparasionRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
export default ProviderInfoComparasionRoutes;