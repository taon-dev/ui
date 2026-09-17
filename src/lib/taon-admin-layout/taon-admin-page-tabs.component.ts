import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  signal,
} from '@angular/core';

import {
  NavigationEnd,
  Route,
  Router,
  RouterLink,
  Routes,
} from '@angular/router';

import { MatTabsModule } from '@angular/material/tabs';

import { filter } from 'rxjs';

import { TaonAdminRoute } from './taon-admin-layout.models';

export interface TaonAdminTabLevel {
  level: number;
  routes: Routes;
  baseSegments: string[];
}

@Component({
  selector: 'taon-admin-page-tabs',
  standalone: true,
  imports: [RouterLink, MatTabsModule],
  templateUrl: './taon-admin-page-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaonAdminPageTabsComponent implements OnInit {
  @Input({ required: true })
  routes!: Routes;

  @Input()
  basePath = '';

  protected readonly levels = signal<TaonAdminTabLevel[]>([]);

  protected readonly currentUrl = signal('');

  constructor(private readonly router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(async () => {
        await this.refresh();
      });
  }

  protected label(route: Route): string {
    return route.data?.['menuItem'] ?? this.startCase(route.path ?? '');
  }

  protected isActive(level: TaonAdminTabLevel, route: Route): boolean {
    if (!route.path) {
      return false;
    }

    const expected = [...level.baseSegments, route.path];

    const current = this.currentSegments();

    return expected.every((segment, index) => current[index] === segment);
  }

  protected link(level: TaonAdminTabLevel, route: Route): string[] {
    return ['/', ...level.baseSegments, route.path!];
  }

  private async refresh(): Promise<void> {
    this.currentUrl.set(this.cleanUrl(this.router.url));

    const current = this.currentSegments();

    const base = this.baseSegments();

    const relative = current.slice(base.length);

    const levels: TaonAdminTabLevel[] = [];

    await this.walk(this.routes, relative, base, 1, levels);

    this.levels.set(levels.filter(level => level.level >= 3));
  }

  private async walk(
    routes: Routes,
    remainingUrl: string[],
    baseSegments: string[],
    level: number,
    result: TaonAdminTabLevel[],
  ): Promise<void> {
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

  private currentSegments(): string[] {
    return this.cleanUrl(this.router.url).split('/').filter(Boolean);
  }

  private baseSegments(): string[] {
    return this.basePath.split('/').filter(Boolean);
  }

  private cleanUrl(url: string): string {
    return url.split('?')[0].split('#')[0];
  }

  private startCase(value: string): string {
    return value
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
