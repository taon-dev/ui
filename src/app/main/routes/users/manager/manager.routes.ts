//#region imports
import { Routes } from '@angular/router';

import { ManagerComponent } from './manager.component';
//#endregion

export const ManagerRoutes: Routes = [
  {
    path: '',
    component: ManagerComponent,
  },
  // {
  //   path: 'anothermodulepath',
  //   loadChildren: () => import('anothermodule')
  //     .then(m => m.AnotherLazyModule),
  // },
];

/**
 * By default exporting ManagerRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
export default ManagerRoutes;