//#region imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { getDefaultModel } from 'ng2-rest/src';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  from,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import {
  Symbols as TaonSymbols,
  TaonBaseCrudController,
  TaonBaseEntity,
  TaonPaginationSort,
  TaonPaginationQuery,
  ClassHelpers,
} from 'taon/src';
import { _, json5 } from 'tnp-core/src';
//#endregion

const defaultColumns: MtxGridColumn[] = [
  {
    header: 'ID',
    field: 'id',
  },
  {
    header: 'NAME',
    field: 'name',
  },
];

type SearchMode = 'simple' | 'advanced';

@Component({
  selector: 'taon-datatable',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,

    MtxGridModule,
  ],
  templateUrl: './taon-datatable.component.html',
  styleUrls: ['./taon-datatable.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaonDatatableComponent implements OnInit {
  //#region fields & getters
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroyRef = inject(DestroyRef);

  //#region inputs

  @Input()
  pageNumber = 1;

  @Input()
  pageSize = 10;

  @Input()
  pageSizeOptions: number[] = [5, 10, 20, 50, 100];

  @Input()
  allowedColumns: string[] = [];

  @Input()
  expansionTemplate?: TemplateRef<any>;

  @Input()
  entityCrudController?: TaonBaseCrudController<any>;

  @Input()
  columns: MtxGridColumn[] = defaultColumns;

  @Input()
  hideSearch = false;

  @Input()
  hideAddButton = false;

  @Input()
  safe = false;

  @Input()
  searchMode: SearchMode = 'advanced';

  /**
   * Optional custom backend pagination method.
   */
  @Input()
  callQueryMethod?: string;

  private _data?: any[];

  @Input()
  set data(value: any[] | undefined | null) {
    this._data = value ?? undefined;

    if (this._data) {
      this.pageNumber = 1;
      this.reload();
    }
  }

  get data(): any[] | undefined {
    return this._data;
  }

  get offlineMode(): boolean {
    return this.data !== undefined;
  }

  //#endregion

  //#region outputs

  @Output()
  readonly expansionChange = new EventEmitter<any>();

  @Output()
  readonly addingItem = new EventEmitter<void>();

  //#endregion

  //#region fields

  rows: any[] = [];

  totalElements = 0;

  isLoading = false;

  expandable = false;

  @Input() showPaginator: boolean;

  advancedSearchOpened = false;

  searchValue = '';

  columnFilters: Record<string, string> = {};

  sort?: TaonPaginationSort;

  private readonly reload$ = new BehaviorSubject<void>(undefined);

  private readonly searchChange$ = new Subject<string>();

  readonly data$: Observable<any[]> = this.reload$.pipe(
    switchMap(() => this.loadData()),
  );

  expandedRows = new Set<any>();

  //#endregion

  //#region getters

  get entity(): typeof TaonBaseEntity | undefined {
    return this.entityCrudController?.entityClassResolveFn();
  }

  get filterableColumns(): MtxGridColumn[] {
    return this.columns.filter(column => Boolean(column.field));
  }

  //#endregion

  //#endregion

  //#region expansion
  onExpansionChange(event: any) {
    // console.log(event);
    // adapt this depending on exact MtxGrid event shape
    if (event.expanded) {
      this.expandedRows.add(event.data);
    } else {
      this.expandedRows.delete(event.data);
    }

    this.expansionChange.emit(event);
  }

  isExpanded(row: any): boolean {
    return this.expandedRows.has(row);
  }

  //#endregion

  //#region hooks

  ngOnInit(): void {
    this.prepareColumns();
    // console.log({ columns: this.columns });
    this.expandable = Boolean(this.expansionTemplate);

    this.showPaginator = _.isBoolean(this.showPaginator)
      ? this.showPaginator
      : Boolean(this.entity) || this.offlineMode;

    this.searchChange$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(search => {
          this.searchValue = search;
          this.pageNumber = 1;
          this.reload();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.data$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(rows => {
      this.rows = rows;
      this.cdr.markForCheck();
    });
  }

  //#endregion

  //#region search

  searchChanged(value: string): void {
    this.searchChange$.next(value);
  }

  clearSearch(): void {
    this.searchValue = '';
    this.columnFilters = {};
    this.pageNumber = 1;

    this.reload();
  }

  applyAdvancedFilters(): void {
    this.pageNumber = 1;
    this.reload();
  }

  toggleAdvancedSearch(): void {
    this.advancedSearchOpened = !this.advancedSearchOpened;
  }

  //#endregion

  //#region pagination

  getNextPage(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;

    this.pageSize = event.pageSize;

    this.reload();
  }

  //#endregion

  //#region sorting

  sortChanged(event: any): void {
    const field = event?.active ?? event?.field;

    const direction = event?.direction ?? '';

    this.sort = {
      field,
      direction,
    };

    this.pageNumber = 1;

    this.reload();
  }

  //#endregion

  //#region data

  reload(): void {
    this.reload$.next();
  }

  private getFieldValue(row: any, field: string): unknown {
    return field.split('.').reduce((value, key) => value?.[key], row);
  }

  private loadOfflineData(): any[] {
    let rows = [...(this.data ?? [])];

    //#region global search

    const search = this.searchValue.trim().toLowerCase();

    if (search) {
      rows = rows.filter(row =>
        this.columns.some(column => {
          if (!column.field) {
            return false;
          }

          const value = this.getFieldValue(row, String(column.field));

          return String(value ?? '')
            .toLowerCase()
            .includes(search);
        }),
      );
    }

    //#endregion

    //#region column filters

    const filters = this.cleanFilters(this.columnFilters);

    for (const [field, filterValue] of Object.entries(filters)) {
      const normalizedFilter = filterValue.toLowerCase();

      rows = rows.filter(row => {
        const value = this.getFieldValue(row, field);

        return String(value ?? '')
          .toLowerCase()
          .includes(normalizedFilter);
      });
    }

    //#endregion

    //#region sorting

    if (this.sort?.field && this.sort.direction) {
      const field = String(this.sort.field);
      const direction = this.sort.direction === 'desc' ? -1 : 1;

      rows.sort((a, b) => {
        const aValue = this.getFieldValue(a, field);
        const bValue = this.getFieldValue(b, field);

        if (aValue === bValue) {
          return 0;
        }

        if (aValue === undefined || aValue === null) {
          return -1 * direction;
        }

        if (bValue === undefined || bValue === null) {
          return 1 * direction;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * direction;
        }

        return (
          String(aValue).localeCompare(String(bValue), undefined, {
            numeric: true,
            sensitivity: 'base',
          }) * direction
        );
      });
    }

    //#endregion

    //#region pagination

    this.totalElements = rows.length;

    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;

    return this.prepareRows(rows.slice(start, end));

    //#endregion
  }

  private loadData(): Observable<any[]> {
    if (this.offlineMode) {
      return of(this.loadOfflineData());
    }

    if (!this.entity || !this.entityCrudController) {
      this.totalElements = 0;
      return of([]);
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    const query: TaonPaginationQuery = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      search: this.searchValue,
      filters: this.cleanFilters(this.columnFilters),
      sort: this.sort,
      callQueryMethod: this.callQueryMethod as any,
    };

    //#region handle info when not allowed method on controller level

    if (!this.safe && !this.entityCrudController.paginationQuery(query)) {
      throw new Error(
        `Please enable paginationQuery() method in your
       controller ${ClassHelpers.getName(this.entityCrudController)}

       @Controller({ allowedMethods: ['paginationQuery'] })
       class ${ClassHelpers.getName(this.entityCrudController)} ..
      `,
      );
    }

    if (this.safe && !this.entityCrudController.paginationQuerySafe(query)) {
      throw new Error(
        `Please enable paginationQuerySafe() method in your controller
       ${ClassHelpers.getName(this.entityCrudController)}

       @Controller({ allowedMethods: ['paginationQuerySafe'] })
       class ${ClassHelpers.getName(this.entityCrudController)} ..
      `,
      );
    }

    //#endregion

    return from(
      (this.safe
        ? this.entityCrudController.paginationQuerySafe
        : this.entityCrudController.paginationQuery)(query).request()
        .observable,
    ).pipe(
      tap(response => {
        this.totalElements =
          Number(response.headers.get(TaonSymbols.old.X_TOTAL_COUNT)) || 0;
      }),

      map(response => this.prepareRows(response.body.json)),

      catchError(error => {
        console.error(
          `[taon-datatable] Unable to load data from ` +
            `${ClassHelpers.getName(this.entityCrudController)} ${
              this.safe ? 'paginationQuerySafe' : 'paginationQuery'
            }`,
          error,
        );

        return of([]);
      }),

      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }),
    );
  }

  //#endregion

  //#region helpers

  private cleanFilters(
    filters: Record<string, string>,
  ): Record<string, string> {
    return Object.fromEntries(
      Object.entries(filters)
        .filter(
          ([, value]) =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== '',
        )
        .map(([key, value]) => [key, String(value).trim()]),
    );
  }

  private prepareRows(rows: any[]): any[] {
    return rows.map(row => {
      // const result = {
      //   ...row,
      // };

      // for (const key of Object.keys(result)) {
      //   if (_.isObject(result[key])) {
      //     result[key] = json5.stringify(result[key]);
      //   }
      // }

      return row;
    });
  }

  private prepareColumns(): void {
    const entityClass = this.entity;

    if (!entityClass) {
      return;
    }

    const usingDefaultColumns = _.isEqual(this.columns, defaultColumns);

    if (!usingDefaultColumns) {
      return;
    }

    try {
      const props = Object.keys(getDefaultModel(entityClass as Function) || {});

      let columns = props
        .filter(prop =>
          this.allowedColumns.length > 0
            ? this.allowedColumns.includes(prop)
            : true,
        )
        .map(
          prop =>
            ({
              header: _.upperCase(prop),
              field: prop,
            }) as MtxGridColumn,
        );

      const extra = this.allowedColumns.filter(field => !props.includes(field));

      columns = [
        ...columns,
        ...extra.map(
          field =>
            ({
              header: _.upperCase(field),
              field,
            }) as MtxGridColumn,
        ),
      ];

      this.columns = columns;
    } catch (error) {
      console.error('[taon-datatable] Unable to generate columns', error);
    }
  }

  //#endregion
}
