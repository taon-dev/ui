import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-under-construction',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './taon-under-construction.component.html',
  styleUrl: './taon-under-construction.component.scss',
})
export class TaonUnderConstructionComponent {
  t = t.for(this);

  title = input(t.gettext('Coming soon'));

  description = input(
    t.gettext(
      'This section is currently under construction and will be available soon.',
    ),
  );

  icon = input('engineering');
}
