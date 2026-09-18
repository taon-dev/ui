//#region imports
import { Routes } from '@angular/router';

import { TaonDraggableButtonPanelComponent } from './taon-draggable-button-panel.component';
//#endregion

export const TaonDraggableButtonPanelRoutes: Routes = [
  {
    path: '',
    component: TaonDraggableButtonPanelComponent,
  },
  // {
  //   path: 'anothermodulepath',
  //   loadChildren: () => import('anothermodule')
  //     .then(m => m.AnotherLazyModule),
  // },
];

/**
 * By default exporting TaonDraggableButtonPanelRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
export default TaonDraggableButtonPanelRoutes;