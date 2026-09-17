//#region imports
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaonAdminLayoutComponent } from '@taon-dev/ui/src';

import MainRoutes from './main.routes';
//#endregion

@Component({
  selector: 'app-main',
  templateUrl: './main.container.html',
  styleUrls: ['./main.container.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, RouterOutlet, TaonAdminLayoutComponent],
})
export class MainContainer {
  get adminRoutes() {
    return MainRoutes[0].children;
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    console.log(this.adminRoutes)
  }
}
