//#region imports
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
//#endregion

@Component({
  selector: 'app-provider-items',
  templateUrl: './provider-items.component.html',
  styleUrls: ['./provider-items.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, RouterOutlet],
})
export class ProviderItemsComponent {}