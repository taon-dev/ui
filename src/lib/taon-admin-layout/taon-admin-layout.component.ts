//#region imports
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ActivatedRoute,
  NavigationEnd,
  Route,
  Router,
  RouterLink,
  RouterOutlet,
  Routes,
  UrlTree,
} from '@angular/router';
import { Translation } from '@taon-dev/i18n/src';
import { filter, Subscription } from 'rxjs';
import { Taon } from 'taon/src';

import { TaonAdminContentFooterService } from './taon-admin-content-footer.service';
import {
  resolveTaonAdminMenuItem,
  TaonAdminRoute,
  TaonAdminSearchOptions,
} from './taon-admin-layout.models';
import { TaonAdminMenuContext } from './taon-admin-menu-context';
import { TaonAdminPageTabsComponent } from './taon-admin-page-tabs.component';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

interface AdminSearchPage {
  route: Route;
  ancestors: Route[];
  segments: string[];
  options: TaonAdminSearchOptions;
}

@Component({
  selector: 'taon-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,

    MatExpansionModule,
    MatIconModule,
    MatTooltipModule,

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

  protected readonly t = t.for(this);

  protected readonly menuContext =
    inject(TaonAdminMenuContext, { optional: true }) ??
    new TaonAdminMenuContext();

  protected readonly taonAdminContentFooterService = inject(
    TaonAdminContentFooterService,
  );

  private _routes: Routes = [];

  @Input({ required: true })
  set routes(routes: Routes) {
    this._routes = routes.filter(f => !f.redirectTo);
    this.searchPages.set([]);
    this.searchLoadVersion++;
    this.searchLoading.set(false);
    this.searchLoaded = false;
    this.searchError.set(false);
    if (this.searchOpen()) {
      this.loadSearchPages();
    }
  }

  get routes(): Routes {
    return this._routes;
  }

  @Input()
  basePath = '';

  @Input()
  outlet!: string;

  protected readonly layoutWidth = signal<number | undefined>(undefined);

  protected readonly layoutHeight = signal<number | undefined>(undefined);

  protected readonly level2Routes = signal(new Map<Route, Routes>());

  protected readonly currentUrl = signal('');

  protected readonly loadingRoutes = signal(new Set<Route>());

  protected readonly searchOpen = signal(false);

  protected readonly searchQuery = signal('');

  protected readonly searchLoading = signal(false);

  protected readonly searchError = signal(false);

  private readonly searchPages = signal<AdminSearchPage[]>([]);

  private searchLoaded = false;

  private searchLoadVersion = 0;

  private readonly childrenCache = new WeakMap<Route, Promise<Routes>>();

  @ViewChild('searchInput')
  private searchInput?: ElementRef<HTMLInputElement>;

  protected readonly asideOpened = signal(window.innerWidth >= 768);

  private resizeObserver?: ResizeObserver;

  private mutationObserver?: MutationObserver;

  private resizing = false;

  private resizeStartX = 0;

  private resizeStartY = 0;

  private resizeStartWidth = 0;

  private resizeStartHeight = 0;

  readonly sub = new Subscription();

  private readonly cdr = inject(ChangeDetectorRef);

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
    private readonly activatedRoute: ActivatedRoute,
    private readonly hostElement: ElementRef<HTMLElement>,
  ) {}

  //#endregion

  //#region lifecycle

  async ngOnInit(): Promise<void> {
    await this.loadCurrentLevel1Route();

    this.sub.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(async () => {
          this.searchOpen.set(false);
          await this.loadCurrentLevel1Route();
        }),
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const windowElement = this.getWindowElement();
      // console.log('[windowElement] should not be undefined', windowElement);
      this.updateLayoutSize();
      this.startWindowObservers();

      // TODO @LAST issue with reloading transation without setOneLanguagePernament
      // this.sub.add(
      //   this.t.isLoadingLang$.subscribe(() => {
      //     setTimeout(() => {
      //       console.log('RERENDER! after timeout', Translation.manager);
      //       this.cdr.detectChanges();
      //     }, 1000);
      //   }),
      // );
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
    this.sub.unsubscribe();

    window.removeEventListener('pointermove', this.resize);

    window.removeEventListener('pointerup', this.stopResize);
  }

  //#endregion

  //#region search

  protected openSearch(): void {
    this.searchOpen.set(true);
    this.loadSearchPages();
  }

  protected expandSearch(): void {
    this.openSearch();
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  protected closeSearch(): void {
    this.searchOpen.set(false);
    this.searchInput?.nativeElement.blur();
  }

  protected searchFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.hostElement.nativeElement.contains(next)) {
      const element = next instanceof Element ? next : next.parentElement;
      if (element?.closest('.admin-search, .admin-search-results')) {
        return;
      }
    }
    this.searchOpen.set(false);
  }

  protected focusSearchResult(event: PointerEvent): void {
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.focus({ preventScroll: true });
    }
  }

  protected get searchResults(): {
    page: AdminSearchPage;
    label: string;
    url: UrlTree;
  }[] {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    if (!query) {
      return [];
    }

    return this.searchPages()
      .filter(page =>
        [...page.ancestors, page.route].every(
          route =>
            this.menuContext.isVisible(route) &&
            !this.menuContext.isDisabled(route),
        ),
      )
      .map(page => ({
        page,
        label:
          resolveTaonAdminMenuItem(page.options.label) ??
          this.label(page.route),
      }))
      .filter(({ page, label }) =>
        [label, ...(page.options.keywords ?? [])].some(value =>
          value.toLocaleLowerCase().includes(query),
        ),
      )
      .map(({ page, label }) => ({
        page,
        label,
        url: this.searchUrl(page.segments),
      }));
  }

  private loadSearchPages(): void {
    if (this.searchLoaded || this.searchLoading()) {
      return;
    }
    const version = ++this.searchLoadVersion;
    this.searchLoading.set(true);
    this.searchError.set(false);
    try {
      const pages = this.collectSearchPages(this.routes, [], []);
      console.log('pages', pages, this.routes);
      if (version === this.searchLoadVersion) {
        this.searchPages.set(pages);
        this.searchLoaded = true;
      }
    } catch (error) {
      if (version === this.searchLoadVersion) {
        console.error('Failed to load admin search routes', error);
        this.searchError.set(true);
      }
    } finally {
      if (version === this.searchLoadVersion) {
        this.searchLoading.set(false);
      }
    }
  }

  private collectSearchPages(
    routes: Routes,
    segments: string[] = [],
    ancestors: Route[] = [],
  ): AdminSearchPage[] {
    return routes.flatMap(route => {
      if (
        route.redirectTo !== undefined ||
        route.data?.['hideInNavigation'] ||
        route.path === undefined
      ) {
        return [];
      }

      const pathSegments = route.path.split('/').filter(Boolean);
      if (
        pathSegments.some(
          segment => segment === '**' || segment.startsWith(':'),
        )
      ) {
        return [];
      }

      const nextSegments = [...segments, ...pathSegments];
      const search: boolean | TaonAdminSearchOptions | undefined =
        route.data?.['search'];

      const current: AdminSearchPage[] = search
        ? [
            {
              route,
              ancestors,
              segments: nextSegments,
              options: search === true ? {} : search,
            },
          ]
        : [];

      return current.concat(
        this.collectSearchPages(route.children ?? [], nextSegments, [
          ...ancestors,
          route,
        ]),
      );
    });
  }

  private searchUrl(routeSegments: string[]): UrlTree {
    const segments = [...this.basePathSegments, ...routeSegments];
    if (!this.outlet) {
      return this.router.createUrlTree(['/', ...segments], {
        queryParamsHandling: 'preserve',
        preserveFragment: true,
      });
    }

    let outletRoute: ActivatedRoute | null = this.activatedRoute;
    while (outletRoute && outletRoute.outlet !== this.outlet) {
      outletRoute = outletRoute.parent;
    }
    if (!outletRoute?.parent || !segments.length) {
      throw new Error(`Cannot find active admin outlet "${this.outlet}"`);
    }
    const [first, ...rest] = segments;
    const matrixParams = outletRoute.snapshot.url[0]?.parameters ?? {};
    return this.router.createUrlTree(
      [{ outlets: { [this.outlet]: [first, matrixParams, ...rest] } }],
      {
        relativeTo: outletRoute.parent,
        queryParamsHandling: 'preserve',
        preserveFragment: true,
      },
    );
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
    if (
      !route.path ||
      !this.menuContext.isVisible(route) ||
      this.menuContext.isDisabled(route)
    ) {
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
    if (
      !expanded ||
      !this.menuContext.isVisible(route) ||
      this.menuContext.isDisabled(route)
    ) {
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
    if (
      !level1.path ||
      !level2.path ||
      !this.menuContext.isVisible(level1) ||
      this.menuContext.isDisabled(level1) ||
      !this.menuContext.isVisible(level2) ||
      this.menuContext.isDisabled(level2)
    ) {
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
      let loading = this.childrenCache.get(route);
      if (!loading) {
        loading = adminRoute.loadAdminChildren().catch(error => {
          this.childrenCache.delete(route);
          throw error;
        });
        this.childrenCache.set(route, loading);
      }
      return await loading;
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
    return (
      resolveTaonAdminMenuItem(route.data?.['menuItem']) ??
      this.startCase(route.path ?? '')
    );
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
