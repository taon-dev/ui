//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoute } from '@taon-dev/ui/src';

import { SessionComponent } from './session.component';
//#endregion

export const SessionRoutes: Routes = [
  {
    path: '',
    component: SessionComponent,
    children: [
      adminLazyRoute({
        path: 'tracking',
        menuItem: 'Tracking',
        icon: 'monitoring',
        loader: () =>
          import('./tracking/tracking.routes').then(m => m.TrackingRoutes),
      }),
      adminLazyRoute({
        path: 'providers',
        menuItem: 'Providers',
        icon: 'dns',
        loader: () =>
          import('./providers/providers.routes').then(m => m.ProvidersRoutes),
      }),
    ],
  },
];

/**
 * By default exporting SessionRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
export default SessionRoutes;
