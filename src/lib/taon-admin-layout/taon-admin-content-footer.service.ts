import { Injectable, TemplateRef, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TaonAdminContentFooterService {
  readonly currentTemplate = signal<TemplateRef<unknown> | undefined>(
    undefined,
  );

  readonly appHeader = signal<TemplateRef<unknown> | undefined>(undefined);

  readonly appTopLeftTitleBar = signal<TemplateRef<unknown> | undefined>(
    undefined,
  );

  setAppHeader(template?: TemplateRef<unknown>): void {
    this.appHeader.set(template);
  }

  setAppTopLeftTitlebar(template?: TemplateRef<unknown>): void {
    this.appTopLeftTitleBar.set(template);
  }

  setTemplate(template?: TemplateRef<unknown>): void {
    this.currentTemplate.set(template);
  }
}
