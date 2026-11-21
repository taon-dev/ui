//#region imports
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

export interface AdminStat {
  id: string;
  label: string;
  value: string | number;
  icon: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

@Component({
  selector: 'app-taon-admin-welcome',
  templateUrl: './taon-admin-welcome.component.html',
  styleUrls: ['./taon-admin-welcome.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
})
export class TaonAdminWelcomeComponent {
  t = t.for(this);

  getStarted() {}

  readonly stats = signal<AdminStat[]>([
    {
      id: 'users',
      label: 'Users',
      value: 128,
      icon: 'group',
      change: '+12%',
      trend: 'up',
    },
    {
      id: 'database',
      label: 'Database',
      value: '2.4 GB',
      icon: 'storage',
      change: '+8%',
      trend: 'up',
    },
    {
      id: 'requests',
      label: 'Requests/h',
      value: 356,
      icon: 'receipt_long',
      change: '+18%',
      trend: 'up',
    },
    {
      id: 'uptime',
      label: 'Uptime',
      value: '99.9%',
      icon: 'bolt',
      change: '+0.1%',
      trend: 'up',
    },
  ]);
}
