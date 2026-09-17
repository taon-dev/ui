//#region imports
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
//#endregion

@Component({
  selector: 'app-provider-info-comparasion',
  templateUrl: './provider-info-comparasion.component.html',
  styleUrls: ['./provider-info-comparasion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, RouterOutlet],
})
export class ProviderInfoComparasionComponent {}