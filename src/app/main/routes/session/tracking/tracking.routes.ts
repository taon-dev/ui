//#region imports
import { Routes } from '@angular/router';

import { TrackingComponent } from './tracking.component';
//#endregion

export const TrackingRoutes: Routes = [
  {
    path: '',
    component: TrackingComponent,
  },
  // {
  //   path: 'anothermodulepath',
  //   loadChildren: () => import('anothermodule')
  //     .then(m => m.AnotherLazyModule),
  // },
];

/**
 * By default exporting TrackingRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
export default TrackingRoutes;