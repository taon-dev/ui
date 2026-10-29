//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoute } from '@taon-dev/ui/src';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

import { SessionComponent } from './session.component';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

export const SessionRoutes: Routes = [
  {
    path: '',
    component: SessionComponent,
    children: [
      adminLazyRoute({
        path: 'tracking',
        menuItem: t.signal.gettext('Tracking'),
        icon: 'monitoring',
        loader: () =>
          import('./tracking/tracking.routes').then(m => m.TrackingRoutes),
      }),
      adminLazyRoute({
        path: 'providers',
        menuItem: t.signal.gettext('Providers'),
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
