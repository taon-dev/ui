//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoutes } from '@taon-dev/ui/src';

import { MainContainer } from './main.container';
//#endregion

export const MainRoutes: Routes = [
  {
    path: '',
    component: MainContainer,
    children: [
      {
        path: 'dashboard',
        data: {
          menuItem: 'Dashboard',
          icon: 'dashboard',
        },
        ...adminLazyRoutes(() =>
          import('./routes/dashboard/dashboard.routes').then(
            m => m.DashboardRoutes,
          ),
        ),
      },
      {
        path: 'session',
        data: {
          menuItem: 'Session',
          icon: 'manage_accounts',
        },
        ...adminLazyRoutes(() =>
          import('./routes/session/session.routes').then(m => m.SessionRoutes),
        ),
      },
      {
        path: 'users',
        data: {
          menuItem: 'Users',
          icon: 'group',
        },
        ...adminLazyRoutes(() =>
          import('./routes/users/users.routes').then(m => m.UsersRoutes),
        ),
      },
    ],
  },
];

/**
 * By default exporting MainRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
export default MainRoutes;
