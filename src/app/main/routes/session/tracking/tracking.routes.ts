//#region imports
import { Routes } from '@angular/router';

//#endregion

export const TrackingRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tracking.component').then(c => c.TrackingComponent),
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
