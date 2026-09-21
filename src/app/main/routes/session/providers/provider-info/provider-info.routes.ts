//#region imports
import { Routes } from '@angular/router';

//#endregion

export const ProviderInfoRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./provider-info.component').then(c => c.ProviderInfoComponent),
  },
  // {
  //   path: 'anothermodulepath',
  //   loadChildren: () => import('anothermodule')
  //     .then(m => m.AnotherLazyModule),
  // },
];

/**
 * By default exporting ProviderInfoRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
export default ProviderInfoRoutes;
