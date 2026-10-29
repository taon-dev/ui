//#region imports
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateDirective, Translation } from '@taon-dev/i18n/src';
import { TaonDetachedWindowsHostComponent } from '@taon-dev/ui/src';
import { Taon } from 'taon/src';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    RouterOutlet,
    TranslateDirective,
    TaonDetachedWindowsHostComponent,
  ],
})
export class SessionComponent {
  t = t.for(this);
}
