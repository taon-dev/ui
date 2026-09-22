//#region imports
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { RouterOutlet, Routes } from '@angular/router';

import { TaonAdminLayoutComponent } from '../taon-admin-layout/taon-admin-layout.component';
//#endregion

@Component({
  selector: 'taon-backoffice',
  templateUrl: './taon-backoffice.component.html',
  styleUrls: ['./taon-backoffice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, RouterOutlet,TaonAdminLayoutComponent],
})
export class TaonBackofficeComponent implements OnInit {
  @Input({ required: true })
  routes!: Routes;

  @Input({})
  title: string = 'Application Title';

  @Input()
  basePath = '';

  @Input()
  outlet: string;

  ngOnInit(): void {
    if (!Array.isArray(this.routes)) {
      throw new Error(`Please pass children Array as routes input`);
    }
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
  }
}
