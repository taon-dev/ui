//#region imports
import { Routes } from '@angular/router';

import { DashboardComponent } from './dashboard.component';
//#endregion

export const DashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  // {
  //   path: 'anothermodulepath',
  //   loadChildren: () => import('anothermodule')
  //     .then(m => m.AnotherLazyModule),
  // },
];

/**
 * By default exporting DashboardRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
export default DashboardRoutes;