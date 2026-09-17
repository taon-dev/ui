//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoutes } from '@taon-dev/ui/src';

import { SessionComponent } from './session.component';
//#endregion

export const SessionRoutes: Routes = [
  {
    path: '',
    component: SessionComponent,
    children: [
      {
        path: 'tracking',
        data: {
          menuItem: 'Tracking',
          icon: 'monitoring',
        },
        ...adminLazyRoutes(() =>
          import('./tracking/tracking.routes').then(m => m.TrackingRoutes),
        ),
      },
      {
        path: 'providers',
        data: {
          menuItem: 'Providers',
          icon: 'dns',
        },
        ...adminLazyRoutes(() =>
          import('./providers/providers.routes').then(m => m.ProvidersRoutes),
        ),
      },
    ],
  },
];

/**
 * By default exporting SessionRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
export default SessionRoutes;
