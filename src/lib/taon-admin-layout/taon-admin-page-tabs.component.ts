import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { NavigationEnd, Route, Router, Routes } from '@angular/router';
import { filter } from 'rxjs';

import { TaonAdminRoute } from './taon-admin-layout.models';

export interface TaonAdminTabLevel {
  level: number;
  routes: Routes;

  /**
   * URL segments before routes from this tab level.
   *
   * Example:
   *
   * ['main', 'session', 'providers']
   */
  baseSegments: string[];
}

@Component({
  selector: 'taon-admin-page-tabs',
  standalone: true,
  imports: [MatTabsModule],
  templateUrl: './taon-admin-page-tabs.component.html',
  styleUrl: './taon-admin-page-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaonAdminPageTabsComponent implements OnInit {
  @Input({ required: true })
  routes!: Routes;

  @Input()
  basePath = '';

  /**
   * Undefined:
   *   normal primary routing
   *
   * "admin":
   *   auxiliary admin outlet
   */
  @Input()
  outlet?: string;

  protected readonly levels = signal<TaonAdminTabLevel[]>([]);

  constructor(private readonly router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(async () => {
        await this.refresh();
      });
  }

  // ===========================================================================
  // UI
  // ===========================================================================

  protected label(route: Route): string {
    return route.data?.['menuItem'] ?? this.startCase(route.path ?? '');
  }

  protected isActive(level: TaonAdminTabLevel, route: Route): boolean {
    if (!route.path) {
      return false;
    }

    const expected = [...level.baseSegments, route.path];

    const current = this.currentOutletSegments();

    if (current.length < expected.length) {
      return false;
    }

    return expected.every((segment, index) => current[index] === segment);
  }

  protected async tabClicked(
    level: TaonAdminTabLevel,
    route: Route,
  ): Promise<void> {
    if (!route.path) {
      return;
    }

    await this.navigateTo([
      ...level.baseSegments.slice(this.basePathSegments.length),
      route.path,
    ]);
  }

  // ===========================================================================
  // NAVIGATION
  // ===========================================================================

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
     * Auxiliary / named outlet.
     *
     * Example:
     *
     * /products/42(admin:main/session/providers/settings)
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
     * Normal primary outlet.
     *
     * Example:
     *
     * /main/session/providers/settings
     */
    return this.router.navigate(['/', ...segments]);
  }

  // ===========================================================================
  // BUILD TAB LEVELS
  // ===========================================================================

  private async refresh(): Promise<void> {
    const current = this.currentOutletSegments();

    const base = this.basePathSegments;

    /**
     * Example:
     *
     * current:
     *   main/session/providers/settings
     *
     * base:
     *   main
     *
     * relative:
     *   session/providers/settings
     */
    const relative = current.slice(base.length);

    const levels: TaonAdminTabLevel[] = [];

    await this.walk(this.routes, relative, base, 1, levels);

    /**
     * Levels:
     *
     * 1 -> aside expansion panel
     * 2 -> aside item
     * 3+ -> tabs
     */
    this.levels.set(levels.filter(level => level.level >= 3));
  }

  private async walk(
    routes: Routes,
    remainingUrl: string[],
    baseSegments: string[],
    level: number,
    result: TaonAdminTabLevel[],
  ): Promise<void> {
    /**
     * Important:
     *
     * Taon lazy route files commonly look like:
     *
     * [
     *   {
     *     path: '',
     *     component: SomeContainer,
     *     children: [...]
     *   }
     * ]
     *
     * path:'' is structural and DOES NOT represent
     * another navigation level.
     */
    routes = this.unwrapEmptyPathRoutes(routes);

    const visibleRoutes = this.navigationRoutes(routes);

    /**
     * Level 3+ becomes tabs.
     */
    if (level >= 3 && visibleRoutes.length > 0) {
      result.push({
        level,
        routes: visibleRoutes,
        baseSegments,
      });
    }

    const currentSegment = remainingUrl[0];

    if (!currentSegment) {
      return;
    }

    const activeRoute = routes.find(route => route.path === currentSegment);

    if (!activeRoute) {
      return;
    }

    let children = await this.loadChildren(activeRoute);

    children = this.unwrapEmptyPathRoutes(children);

    if (!children.length) {
      return;
    }

    await this.walk(
      children,
      remainingUrl.slice(1),
      [...baseSegments, currentSegment],
      level + 1,
      result,
    );
  }

  // ===========================================================================
  // LAZY ROUTES
  // ===========================================================================

  private async loadChildren(route: Route): Promise<Routes> {
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
   * Removes transparent path:'' containers.
   *
   * Example:
   *
   * [
   *   {
   *     path: '',
   *     component: ProvidersComponent,
   *     children: [
   *       { path: 'info' },
   *       { path: 'items' },
   *     ],
   *   },
   * ]
   *
   * becomes:
   *
   * [
   *   { path: 'info' },
   *   { path: 'items' },
   * ]
   */
  private unwrapEmptyPathRoutes(routes: Routes): Routes {
    const result: Routes = [];

    for (const route of routes) {
      if (route.path === '' && route.children) {
        result.push(...this.unwrapEmptyPathRoutes(route.children));

        continue;
      }

      result.push(route);
    }

    return result;
  }

  private navigationRoutes(routes: Routes): Routes {
    return routes.filter(
      route =>
        !!route.path &&
        route.redirectTo === undefined &&
        !route.data?.['hideInNavigation'],
    );
  }

  // ===========================================================================
  // CURRENT ROUTE
  // ===========================================================================

  private currentOutletSegments(): string[] {
    const tree = this.router.parseUrl(this.router.url);

    const outletName = this.outlet || 'primary';

    const group = tree.root.children[outletName];

    if (!group) {
      return [];
    }

    return group.segments.map(segment => segment.path);
  }

  private get basePathSegments(): string[] {
    return this.basePath.split('/').filter(Boolean);
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private startCase(value: string): string {
    return value
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
