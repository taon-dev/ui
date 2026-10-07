//#region imports
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import {
  NavigationEnd,
  Route,
  Router,
  RouterLink,
  RouterOutlet,
  Routes,
} from '@angular/router';
import { filter } from 'rxjs';

import { TaonAdminRoute } from './taon-admin-layout.models';
import { TaonAdminPageTabsComponent } from './taon-admin-page-tabs.component';
//#endregion

@Component({
  selector: 'taon-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,

    MatExpansionModule,
    MatIconModule,

    TaonAdminPageTabsComponent,
  ],
  templateUrl: './taon-admin-layout.component.html',
  styleUrls: ['./taon-admin-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaonAdminLayoutComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  //#region fields and getters

  @Input({ required: true })
  routes!: Routes;

  @Input()
  basePath = '';

  @Input()
  outlet: string;

  protected readonly layoutWidth = signal<number | undefined>(undefined);

  protected readonly layoutHeight = signal<number | undefined>(undefined);

  protected readonly level2Routes = signal(new Map<Route, Routes>());

  protected readonly currentUrl = signal('');

  protected readonly loadingRoutes = signal(new Set<Route>());

  protected readonly asideOpened = signal(window.innerWidth >= 768);

  private resizeObserver?: ResizeObserver;

  private mutationObserver?: MutationObserver;

  private resizing = false;

  private resizeStartX = 0;

  private resizeStartY = 0;

  private resizeStartWidth = 0;

  private resizeStartHeight = 0;

  private readonly minDialogWidth = 500;

  private readonly minDialogHeight = 350;

  protected get isDialogMode(): boolean {
    const windowElement = this.getWindowElement();

    if (!windowElement) {
      return false;
    }

    return !windowElement.classList.contains('taon-fullscreen');
  }

  private get basePathSegments(): string[] {
    return this.basePath.split('/').filter(Boolean);
  }

  protected get normalizedBasePath(): string {
    const value = '/' + this.basePath.split('/').filter(Boolean).join('/');

    return value === '/' ? '/' : value;
  }

  //#endregion

  //#region constructor

  constructor(
    private readonly router: Router,
    private readonly hostElement: ElementRef<HTMLElement>,
  ) {}

  //#endregion

  //#region lifecycle

  async ngOnInit(): Promise<void> {
    await this.loadCurrentLevel1Route();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(async () => {
        await this.loadCurrentLevel1Route();
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const windowElement = this.getWindowElement();
      // console.log('[windowElement] should not be undefined', windowElement);
      this.updateLayoutSize();
      this.startWindowObservers();
    }, 500); // TODO QUICK_FIX
  }

  // private waitForWindowElement(
  //   callback: (windowElement: HTMLElement) => void,
  // ): void {
  //   const check = () => {
  //     console.log('Waiting for window element...');
  //     const windowElement = this.getWindowElement();

  //     if (windowElement) {
  //       callback(windowElement);
  //       return;
  //     }

  //     requestAnimationFrame(check);
  //   };

  //   check();
  // }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();

    window.removeEventListener('pointermove', this.resize);

    window.removeEventListener('pointerup', this.stopResize);
  }

  //#endregion

  //#region window / layout

  private getWindowElement(): HTMLElement | undefined {
    return (
      document.querySelector<HTMLElement>('.taon-window') ??
      document.querySelector<HTMLElement>('.taon-window-full') ??
      undefined
    );
  }

  private getDraggablePanelElement(): HTMLElement | undefined {
    return (
      document.querySelector<HTMLElement>('.taon-draggable-panel') ?? undefined
    );
  }

  private startWindowObservers(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();

    const host = this.hostElement.nativeElement;

    const windowElement = this.getWindowElement();

    // console.log('WINDOW', this.getWindowElement());

    // console.log('PANEL', this.getDraggablePanelElement());

    // ================================================================
    // SIZE CHANGES
    // ================================================================

    const observedElement = windowElement ?? host.parentElement;

    if (observedElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateLayoutSize();
      });

      this.resizeObserver.observe(observedElement);
    }

    // ================================================================
    // DIALOG <-> FULLSCREEN STATE CHANGES
    // ================================================================

    if (windowElement) {
      this.mutationObserver = new MutationObserver(mutations => {
        const classChanged = mutations.some(
          mutation =>
            mutation.type === 'attributes' &&
            mutation.attributeName === 'class',
        );
        // console.log('Class changed:', classChanged);

        if (!classChanged) {
          return;
        }

        this.windowModeChanged(windowElement);
      });

      this.mutationObserver.observe(windowElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }
  }

  private windowModeChanged(windowElement: HTMLElement): void {
    const fullscreen = windowElement.classList.contains('taon-fullscreen');

    if (fullscreen) {
      this.clearWindowResize(windowElement);
    }

    requestAnimationFrame(() => {
      this.updateLayoutSize();
    });
  }

  private clearWindowResize(windowElement: HTMLElement): void {
    windowElement.style.removeProperty('width');

    windowElement.style.removeProperty('height');
  }

  @HostListener('window:resize')
  protected windowResized(): void {
    this.updateLayoutSize();
  }

  private updateLayoutSize(): void {
    const host = this.hostElement.nativeElement;

    const hostRect = host.getBoundingClientRect();

    const windowElement = this.getWindowElement();

    const dialogMode =
      !!windowElement && !windowElement.classList.contains('taon-fullscreen');

    // ================================================================
    // NORMAL / FULLSCREEN
    // ================================================================

    if (!dialogMode) {
      this.layoutWidth.set(Math.floor(hostRect.width));

      this.layoutHeight.set(
        Math.max(0, Math.floor(window.innerHeight - hostRect.top)),
      );

      return;
    }

    // ================================================================
    // DIALOG
    // ================================================================

    const windowRect = windowElement.getBoundingClientRect();

    this.layoutWidth.set(
      Math.max(0, Math.floor(windowRect.right - hostRect.left)),
    );

    this.layoutHeight.set(
      Math.max(0, Math.floor(windowRect.bottom - hostRect.top)),
    );
  }

  //#endregion

  //#region dialog resizing

  protected startResize(event: PointerEvent): void {
    if (!this.isDialogMode) {
      return;
    }

    const windowElement = this.getWindowElement();

    if (!windowElement) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const windowRect = windowElement.getBoundingClientRect();

    this.resizing = true;

    this.resizeStartX = event.clientX;

    this.resizeStartY = event.clientY;

    this.resizeStartWidth = windowRect.width;

    this.resizeStartHeight = windowRect.height;

    window.addEventListener('pointermove', this.resize);

    window.addEventListener('pointerup', this.stopResize);
  }

  private readonly resize = (event: PointerEvent): void => {
    if (!this.resizing) {
      return;
    }

    const windowElement = this.getWindowElement();

    if (!windowElement) {
      return;
    }

    const windowRect = windowElement.getBoundingClientRect();

    const deltaX = event.clientX - this.resizeStartX;

    const deltaY = event.clientY - this.resizeStartY;

    const maxWidth = window.innerWidth - windowRect.left;

    const maxHeight = window.innerHeight - windowRect.top;

    const width = Math.min(
      maxWidth,
      Math.max(this.minDialogWidth, this.resizeStartWidth + deltaX),
    );

    const height = Math.min(
      maxHeight,
      Math.max(this.minDialogHeight, this.resizeStartHeight + deltaY),
    );

    windowElement.style.width = `${width}px`;

    windowElement.style.height = `${height}px`;
  };

  private readonly stopResize = (): void => {
    if (!this.resizing) {
      return;
    }

    this.resizing = false;

    window.removeEventListener('pointermove', this.resize);

    window.removeEventListener('pointerup', this.stopResize);
  };

  //#endregion

  //#region aside

  protected toggleAside(): void {
    this.asideOpened.update(opened => !opened);
  }

  protected closeAside(): void {
    this.asideOpened.set(false);
  }

  private closeAsideOnMobile(): void {
    if (window.innerWidth < 768) {
      this.closeAside();
    }
  }

  //#endregion

  //#region level 1

  protected async level1Clicked(route: Route): Promise<void> {
    if (!route.path) {
      return;
    }

    await this.navigateTo([route.path]);

    await this.ensureLevel2Loaded(route);

    if (!this.isExpandable(route)) {
      this.closeAsideOnMobile();
    }
  }

  protected async panelExpanded(
    route: Route,
    expanded: boolean,
  ): Promise<void> {
    if (!expanded) {
      return;
    }

    await this.ensureLevel2Loaded(route);
  }

  protected isLevel1Active(route: Route): boolean {
    if (!route.path) {
      return false;
    }

    return this.isPathActive([route.path]);
  }

  //#endregion

  //#region level 2

  protected async level2Clicked(level1: Route, level2: Route): Promise<void> {
    if (!level1.path || !level2.path) {
      return;
    }

    await this.navigateTo([level1.path, level2.path]);

    this.closeAsideOnMobile();
  }

  protected getLevel2Routes(route: Route): Routes {
    return this.level2Routes().get(route) ?? [];
  }

  protected isLevel2Active(level1: Route, level2: Route): boolean {
    if (!level1.path || !level2.path) {
      return false;
    }

    return this.isPathActive([level1.path, level2.path]);
  }

  protected level2Link(level1: Route, level2: Route): string[] {
    return [this.normalizedBasePath, level1.path!, level2.path!];
  }

  //#endregion

  //#region navigation

  private outletBaseMatrixParams(): Record<string, string> {
    if (!this.outlet) {
      return {};
    }

    const tree = this.router.parseUrl(this.router.url);

    const outletGroup = tree.root.children[this.outlet];

    return {
      ...outletGroup?.segments[0]?.parameters,
    };
  }

  private async navigateTo(routeSegments: string[]): Promise<boolean> {
    const segments = [...this.basePathSegments, ...routeSegments];

    if (this.outlet) {
      const [firstSegment, ...remainingSegments] = segments;

      if (!firstSegment) {
        return false;
      }

      const matrixParams = this.outletBaseMatrixParams();

      return this.router.navigate([
        {
          outlets: {
            [this.outlet]: [firstSegment, matrixParams, ...remainingSegments],
          },
        },
      ]);
    }

    return this.router.navigate(['/', ...segments]);
  }

  //#endregion

  //#region route loading

  private async ensureLevel2Loaded(level1: Route): Promise<void> {
    if (this.level2Routes().has(level1)) {
      return;
    }

    if (this.loadingRoutes().has(level1)) {
      return;
    }

    this.setLoading(level1, true);

    try {
      const lazyRoutes = await this.loadRouteChildren(level1);

      const level2 = this.unwrapEmptyPathRoutes(lazyRoutes);

      const map = new Map(this.level2Routes());

      map.set(level1, level2);

      this.level2Routes.set(map);
    } finally {
      this.setLoading(level1, false);
    }
  }

  private async loadRouteChildren(route: Route): Promise<Routes> {
    if (route.children) {
      return route.children;
    }

    const adminRoute = route as TaonAdminRoute;

    if (adminRoute.loadAdminChildren) {
      return await adminRoute.loadAdminChildren();
    }

    return [];
  }

  private unwrapEmptyPathRoutes(routes: Routes): Routes {
    const result: Routes = [];

    for (const route of routes) {
      if (route.path === '' && route.children) {
        result.push(...this.unwrapEmptyPathRoutes(route.children));

        continue;
      }

      if (route.redirectTo !== undefined || route.data?.['hideInNavigation']) {
        continue;
      }

      result.push(route);
    }

    return result;
  }

  //#endregion

  //#region direct url support

  private async loadCurrentLevel1Route(): Promise<void> {
    const relativeSegments = this.currentRelativeSegments();

    const level1Path = relativeSegments[0];

    if (!level1Path) {
      return;
    }

    const level1 = this.routes.find(route => route.path === level1Path);

    if (level1) {
      await this.ensureLevel2Loaded(level1);
    }
  }

  //#endregion

  //#region helpers

  protected label(route: Route): string {
    return route.data?.['menuItem'] ?? this.startCase(route.path ?? '');
  }

  protected color(route: Route): string {
    return route.data?.['color'];
  }

  protected icon(route: Route): string | undefined {
    return route.data?.['icon'];
  }

  protected isLoading(route: Route): boolean {
    return this.loadingRoutes().has(route);
  }

  protected isExpandable(route: Route): boolean {
    return route.data?.['expandable'] !== false;
  }

  private isPathActive(routeSegments: string[]): boolean {
    const current = this.currentRelativeSegments();

    if (current.length < routeSegments.length) {
      return false;
    }

    return routeSegments.every((segment, index) => current[index] === segment);
  }

  private currentRelativeSegments(): string[] {
    const current = this.currentOutletSegments();

    return current.slice(this.basePathSegments.length);
  }

  private currentOutletSegments(): string[] {
    const tree = this.router.parseUrl(this.router.url);

    const outletName = this.outlet || 'primary';

    const group = tree.root.children[outletName];

    if (!group) {
      return [];
    }

    return group.segments.map(segment => segment.path);
  }

  private setLoading(route: Route, loading: boolean): void {
    const set = new Set(this.loadingRoutes());

    if (loading) {
      set.add(route);
    } else {
      set.delete(route);
    }

    this.loadingRoutes.set(set);
  }

  private startCase(value: string): string {
    return value
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  //#endregion
}
