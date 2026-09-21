//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoute } from '@taon-dev/ui/src';

//#endregion

export const UsersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./users.component').then(c => c.UsersComponent),
    children: [
      adminLazyRoute({
        path: 'manager',
        menuItem: 'Manager',
        icon: 'admin_panel_settings',
        loader: () =>
          import('./manager/manager.routes').then(m => m.ManagerRoutes),
      }),
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
