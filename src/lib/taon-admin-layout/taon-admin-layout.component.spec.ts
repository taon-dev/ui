import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet, Routes } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { TaonAdminLayoutComponent } from './taon-admin-layout.component';
import { adminLazyRoute } from './taon-admin-layout.models';
import { TaonAdminMenuContext } from './taon-admin-menu-context';

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template:
    '<router-outlet /><router-outlet name="admin" /><router-outlet name="other" />',
})
class TestShellComponent {}

@Component({
  standalone: true,
  template: '<div style="height: 1200px">Page content</div>',
})
class TestPageComponent {}

const testRoutes = [
  adminLazyRoute({
    path: 'old',
    menuItem: 'Old page',
    search: true,
    loader: async () => [{ path: '', component: TestPageComponent }],
  }),
  adminLazyRoute({
    path: 'destination',
    menuItem: 'Destination',
    search: true,
    loader: async () => [{ path: '', component: TestPageComponent }],
  }),
];

@Component({
  standalone: true,
  imports: [TaonAdminLayoutComponent],
  template:
    '<taon-admin-layout [routes]="routes" basePath="/main" outlet="admin" />',
})
class TestAdminComponent {
  readonly routes = testRoutes;
}

@Component({
  standalone: true,
  imports: [TaonAdminLayoutComponent],
  template: '<taon-admin-layout [routes]="routes" basePath="/main" />',
})
class TestPrimaryAdminComponent {
  readonly routes = testRoutes;
}

describe('admin route search', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('searches cached metadata, respects navigation and keeps the outlet mounted', async () => {
    const menuContext = new TaonAdminMenuContext();
    menuContext.context.set(false);
    const childLoader = vi.fn(async () => []);
    const loader = vi.fn(async () => [
      {
        path: '',
        children: [
          adminLazyRoute({
            path: 'users',
            menuItem: () => 'Users',
            search: { keywords: ['people'] },
            loader: childLoader,
          }),
          adminLazyRoute({
            path: 'secret',
            search: true,
            hideInNavigation: true,
            loader: childLoader,
          }),
          adminLazyRoute({
            path: ':id',
            search: true,
            loader: childLoader,
          }),
          adminLazyRoute({
            path: 'disabled',
            menuItem: 'Disabled',
            search: true,
            isDisabled: () => true,
            loader: childLoader,
          }),
          adminLazyRoute({
            path: 'custom',
            menuItem: 'Original',
            search: { label: () => 'Custom label' },
            loader: childLoader,
          }),
          adminLazyRoute<boolean>({
            path: 'dynamic',
            menuItem: 'Dynamic',
            search: true,
            isVisible: ({ context }) => context,
            loader: childLoader,
          }),
        ],
      },
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TaonAdminMenuContext, useValue: menuContext },
      ],
    });
    const fixture = TestBed.createComponent(TaonAdminLayoutComponent);
    fixture.componentRef.setInput('routes', [
      adminLazyRoute({ path: 'team', menuItem: 'Team', loader }),
    ]);
    fixture.componentRef.setInput('basePath', '/main');
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
    fixture.nativeElement.style.width = '900px';

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    expect(input.getBoundingClientRect().width).toBe(200);
    expect(
      getComputedStyle(
        fixture.nativeElement.querySelector('.admin-search-button'),
      ).display,
    ).toBe('none');
    const content: HTMLElement =
      fixture.nativeElement.querySelector('.admin-content');
    const outlet = content.querySelector('router-outlet');
    input.focus();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Start typing to see results',
    );

    input.value = 'PEOPLE';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();
    let result: HTMLAnchorElement = fixture.nativeElement.querySelector(
      '.admin-search-result',
    );
    expect(result.textContent?.trim()).toBe('Users');
    expect(result.getAttribute('href')).toBe('/main/team/users');
    expect(content.querySelector('router-outlet')).toBe(outlet);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(childLoader).toHaveBeenCalledTimes(4);

    for (const query of ['disabled', 'secret', ':id', 'dynamic']) {
      input.value = query;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No results found');
    }

    menuContext.context.set(true);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('.admin-search-result')
        .textContent.trim(),
    ).toBe('Dynamic');

    input.value = 'custom label';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('.admin-search-result')
        .textContent.trim(),
    ).toBe('Custom label');

    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Start typing to see results',
    );

    input.value = 'people';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();
    result = fixture.nativeElement.querySelector('.admin-search-result');
    result.focus();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('.admin-search-results'),
    ).not.toBeNull();
    const menuButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.admin-menu-button');
    menuButton.focus();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.admin-search-results'),
    ).toBeNull();
    input.focus();
    await fixture.whenStable();
    fixture.detectChanges();
    result = fixture.nativeElement.querySelector('.admin-search-result');
    result.focus();
    result.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.admin-search-results'),
    ).toBeNull();

    input.focus();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('.admin-search-result')
        .textContent.trim(),
    ).toBe('Users');
    expect(loader).toHaveBeenCalledTimes(1);
    fixture.destroy();
    fixture.nativeElement.remove();
  });

  it('uses the layout width for compact search and focuses the expanded input', async () => {
    await page.viewport(1280, 720);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(TaonAdminLayoutComponent);
    fixture.componentRef.setInput('routes', []);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
    fixture.nativeElement.style.width = '500px';
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.admin-search-button',
    );
    const header: HTMLElement = fixture.nativeElement.querySelector(
      '.admin-header-content',
    );

    expect(window.innerWidth).toBeGreaterThan(600);
    expect(getComputedStyle(button).display).not.toBe('none');
    expect(getComputedStyle(input).display).toBe('none');
    button.click();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(document.activeElement).toBe(input);
    expect(getComputedStyle(header).display).toBe('none');
    expect(input.getBoundingClientRect().width).toBeGreaterThan(200);
    fixture.destroy();
    fixture.nativeElement.remove();
  });

  it.each([0, 1, 2])(
    'preserves other URL state when navigating from an outlet at depth %i',
    async depth => {
      let routes: Routes = [
        { path: 'primary', component: TestPageComponent },
        {
          path: 'main',
          outlet: 'admin',
          component: TestAdminComponent,
          children: testRoutes,
        },
        { path: 'chat', outlet: 'other', component: TestPageComponent },
      ];
      for (let i = 0; i < depth; i++) {
        routes = [
          { path: '', component: TestShellComponent, children: routes },
        ];
      }
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideRouter(routes)],
      });
      const fixture = TestBed.createComponent(TestShellComponent);
      fixture.autoDetectChanges();
      document.body.appendChild(fixture.nativeElement);
      const router = TestBed.inject(Router);
      await router.navigateByUrl(
        '/primary(admin:main;state=WINDOW/old//other:chat)?x=1#frag',
      );
      await fixture.whenStable();
      fixture.detectChanges();

      const layout: HTMLElement =
        fixture.nativeElement.querySelector('taon-admin-layout');
      layout.style.width = '900px';
      const input: HTMLInputElement = layout.querySelector('input')!;
      const content: HTMLElement = layout.querySelector('.admin-content')!;
      const oldPage = content.querySelector('ng-component');
      expect(oldPage).not.toBeNull();
      content.style.height = '100px';
      content.scrollTop = 300;
      input.focus();
      await fixture.whenStable();
      fixture.detectChanges();
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      await fixture.whenStable();
      fixture.detectChanges();
      expect(content.querySelector('ng-component')).toBe(oldPage);
      expect(content.scrollTop).toBe(300);

      input.focus();
      input.value = 'destination';
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      fixture.detectChanges();
      const link: HTMLAnchorElement = layout.querySelector(
        '.admin-search-result',
      )!;
      expect(link.getAttribute('href')).toBe(
        '/primary(admin:main;state=WINDOW/destination//other:chat)?x=1#frag',
      );
      link.focus();
      link.click();
      await fixture.whenStable();
      expect(router.url).toBe(
        '/primary(admin:main;state=WINDOW/destination//other:chat)?x=1#frag',
      );
      fixture.destroy();
      fixture.nativeElement.remove();
    },
  );

  it('navigates to search results in the primary outlet', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          {
            path: 'main',
            component: TestPrimaryAdminComponent,
            children: testRoutes,
          },
        ]),
      ],
    });
    const fixture = TestBed.createComponent(TestShellComponent);
    fixture.autoDetectChanges();
    document.body.appendChild(fixture.nativeElement);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/main/old?x=1#frag');
    await fixture.whenStable();
    const layout: HTMLElement =
      fixture.nativeElement.querySelector('taon-admin-layout');
    layout.style.width = '900px';
    const input: HTMLInputElement = layout.querySelector('input')!;
    input.focus();
    input.value = 'destination';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();
    const link: HTMLAnchorElement = layout.querySelector(
      '.admin-search-result',
    )!;
    expect(link.getAttribute('href')).toBe('/main/destination?x=1#frag');
    link.click();
    await fixture.whenStable();
    expect(router.url).toBe('/main/destination?x=1#frag');
    fixture.destroy();
    fixture.nativeElement.remove();
  });
});
