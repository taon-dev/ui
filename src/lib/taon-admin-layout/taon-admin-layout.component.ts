//#region imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
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
export class TaonAdminLayoutComponent implements OnInit {
  //#region fields and gettrs
  @Input({ required: true })
  routes!: Routes;

  @Input()
  basePath = '';

  @Input()
  outlet: string;

  /**
   * Children discovered for each level-1 route.
   *
   * Session -> [Tracking, Providers]
   * Users   -> [Manager]
   */
  protected readonly level2Routes = signal(new Map<Route, Routes>());

  protected readonly currentUrl = signal('');

  protected readonly loadingRoutes = signal(new Set<Route>());

  protected readonly asideOpened = signal(window.innerWidth >= 768);

  private get basePathSegments(): string[] {
    return this.basePath.split('/').filter(Boolean);
  }
  //#endregion

  //#region constructor
  constructor(private readonly router: Router) {}
  //#endregion

  //#region methods
  protected toggleAside(): void {
    this.asideOpened.update(opened => !opened);
  }

  protected closeAside(): void {
    this.asideOpened.set(false);
  }

  async ngOnInit(): Promise<void> {
    await this.loadCurrentLevel1Route();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(async () => {
        await this.loadCurrentLevel1Route();
      });
  }

  // ---------------------------------------------------------------------------
  // LEVEL 1
  // ---------------------------------------------------------------------------

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

  protected async level2Clicked(level1: Route, level2: Route): Promise<void> {
    if (!level1.path || !level2.path) {
      return;
    }

    await this.navigateTo([level1.path, level2.path]);

    this.closeAsideOnMobile();
  }

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

    /**
     * Named / auxiliary outlet:
     *
     * /products/123(admin:main/session/providers)
     */

    if (this.outlet) {
      const [firstSegment, ...remainingSegments] = segments;

      if (!firstSegment) {
        return false;
      }

      const matrixParams = this.outletBaseMatrixParams();

      return this.router.navigate([
        {
          outlets: {
            [this.outlet]: [
              firstSegment,

              /**
               * Angular interprets an object following
               * a segment as matrix parameters.
               */
              matrixParams,

              ...remainingSegments,
            ],
          },
        },
      ]);
    }

    /**
     * Normal primary outlet:
     *
     * /main/session/providers
     */
    return this.router.navigate(['/', ...segments]);
  }

  private closeAsideOnMobile(): void {
    if (window.innerWidth < 768) {
      this.closeAside();
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

  // ---------------------------------------------------------------------------
  // LEVEL 2
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // ROUTE LOADING
  // ---------------------------------------------------------------------------

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

      /**
       * Your lazy modules have this shape:
       *
       * [
       *   {
       *     path: '',
       *     component: SessionComponent,
       *     children: [
       *       { path: 'tracking' },
       *       { path: 'providers' }
       *     ]
       *   }
       * ]
       *
       * The path:'' wrapper DOES NOT represent a navigation
       * level, so unwrap it.
       */
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

  /**
   * Removes structural path:'' wrappers.
   *
   * [
   *   {
   *     path: '',
   *     component: SessionComponent,
   *     children: [...]
   *   }
   * ]
   *
   * becomes:
   *
   * [...]
   */
  private unwrapEmptyPathRoutes(routes: Routes): Routes {
    const result: Routes = [];

    for (const route of routes) {
      if (route.path === '' && route.children) {
        result.push(...this.unwrapEmptyPathRoutes(route.children));

        continue;
      }

      /**
       * redirects etc. shouldn't become menu entries.
       */
      if (route.redirectTo !== undefined || route.data?.['hideInNavigation']) {
        continue;
      }

      result.push(route);
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // DIRECT URL SUPPORT
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  protected label(route: Route): string {
    return route.data?.['menuItem'] ?? this.startCase(route.path ?? '');
  }

  protected icon(route: Route): string | undefined {
    return route.data?.['icon'];
  }

  protected isLoading(route: Route): boolean {
    return this.loadingRoutes().has(route);
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

  protected isExpandable(route: Route): boolean {
    return route.data?.['expandable'] !== false;
  }

  protected get normalizedBasePath(): string {
    const value = '/' + this.basePath.split('/').filter(Boolean).join('/');

    return value === '/' ? '/' : value;
  }

  private cleanUrl(url: string): string {
    return url.split('?')[0].split('#')[0];
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
