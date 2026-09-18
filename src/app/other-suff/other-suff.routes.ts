//#region imports
import { Routes } from '@angular/router';

import { OtherSuffComponent } from './other-suff.component';
//#endregion

export const OtherSuffRoutes: Routes = [
  {
    path: '',
    component: OtherSuffComponent,
  },
  // {
  //   path: 'anothermodulepath',
  //   loadChildren: () => import('anothermodule')
  //     .then(m => m.AnotherLazyModule),
  // },
];

/**
 * By default exporting OtherSuffRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
export default OtherSuffRoutes;