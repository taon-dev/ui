//#region imports
import { Routes } from '@angular/router';

import { ProvidersComponent } from './providers.component';
//#endregion

export const ProvidersRoutes: Routes = [
  {
    path: '',
    component: ProvidersComponent,
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