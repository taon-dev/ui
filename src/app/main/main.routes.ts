//#region imports
import { Routes } from '@angular/router';
import { Translation } from '@taon-dev/i18n/src';
import { adminLazyRoute } from '@taon-dev/ui/src';
import { Taon } from 'taon/src';

//#endregion
const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

export const MainRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./main.container').then(c => c.MainContainer),
    children: [
      adminLazyRoute({
        path: 'dashboard',
        menuItem: t.signal.gettext('Dashboard'),
        icon: 'dashboard',
        expandable: false,
        loader: () =>
          import('./routes/dashboard/dashboard.routes').then(
            m => m.DashboardRoutes,
          ),
      }),

      adminLazyRoute({
        path: 'session',
        menuItem: t.signal.gettext('Session'),
        icon: 'manage_accounts',
        loader: () =>
          import('./routes/session/session.routes').then(m => m.SessionRoutes),
      }),

      adminLazyRoute({
        path: 'users',
        menuItem: t.signal.gettext('Users'),
        icon: 'group',
        loader: () =>
          import('./routes/users/users.routes').then(m => m.UsersRoutes),
      }),
    ],
  },
];

/**
 * By default exporting MainRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
export default MainRoutes;
