import { Injectable, TemplateRef, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TaonAdminContentFooterService {
  readonly currentTemplate = signal<TemplateRef<unknown> | undefined>(
    undefined,
  );

  setTemplate(template?: TemplateRef<unknown>): void {
    this.currentTemplate.set(template);
  }
}
