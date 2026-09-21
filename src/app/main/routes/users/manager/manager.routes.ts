//#region imports
import { Routes } from '@angular/router';
//#endregion

export const ManagerRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./manager.component').then(c => c.ManagerComponent),
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
