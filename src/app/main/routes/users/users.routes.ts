//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoutes } from '@taon-dev/ui/src';

import { UsersComponent } from './users.component';
//#endregion

export const UsersRoutes: Routes = [
  {
    path: '',
    component: UsersComponent,
    children: [
      {
        path: 'manager',
        data: {
          menuItem: 'Manager',
          icon: 'admin_panel_settings',
        },
        ...adminLazyRoutes(() =>
          import('./manager/manager.routes').then(m => m.ManagerRoutes),
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
 * By default exporting UsersRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
export default UsersRoutes;
