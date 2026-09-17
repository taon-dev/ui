import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  template: '',
})
export abstract class TaonBaseAdminLayoutPage {
  @ViewChild(RouterOutlet)
  routerOutlet!: RouterOutlet;

  get hasActiveChildRoute(): boolean {
    return this.routerOutlet?.isActivated ?? false;
  }
}
