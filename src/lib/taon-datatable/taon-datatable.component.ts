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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { getDefaultModel } from 'ng2-rest/src';

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

  showPaginator = true;

  advancedSearchOpened = false;

  searchValue = '';

  columnFilters: Record<string, string> = {};

  sort?: TaonPaginationSort;

  private readonly reload$ = new BehaviorSubject<void>(undefined);

  private readonly searchChange$ = new Subject<string>();

  readonly data$: Observable<any[]> = this.reload$.pipe(
    switchMap(() => this.loadData()),
  );

  //#endregion

  //#region getters

  get entity(): typeof TaonBaseEntity | undefined {
    return this.entityCrudController?.entityClassResolveFn();
  }

  get filterableColumns(): MtxGridColumn[] {
    return this.columns.filter(column => Boolean(column.field));
  }

  //#endregion

  //#region init

  ngOnInit(): void {
    this.prepareColumns();
    // console.log({ columns: this.columns });
    this.expandable = Boolean(this.expansionTemplate);

    this.showPaginator = Boolean(this.entity);

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

  private loadData(): Observable<any[]> {
    if (!this.entity || !this.entityCrudController) {
      return of(this.rows);
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
        // console.log({ totalElements: this.totalElements });
      }),

      map(response => this.prepareRows(response.body.json)),

      catchError(error => {
        console.error(
          `[taon-datatable] Unable to load data from ` +
            `${ClassHelpers.getName(this.entityCrudController)} ${
              this.safe ? 'paginationQuerySafe' : 'paginationQuery'
            }`,
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
      const result = {
        ...row,
      };

      for (const key of Object.keys(result)) {
        if (_.isObject(result[key])) {
          result[key] = json5.stringify(result[key]);
        }
      }

      return result;
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
