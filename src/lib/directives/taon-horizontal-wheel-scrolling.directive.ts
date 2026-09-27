//#region imports
import {
  AfterViewInit,
  Directive,
  ElementRef,
  inject,
  OnDestroy,
} from '@angular/core';
//#endregion

@Directive({
  selector: '[taonHorizontalWheelScroll]',
  standalone: true,
})
export class TaonHorizontalWheelScrollDirective
  implements AfterViewInit, OnDestroy
{
  //#region fields

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  private wheelAccumulator = 0;

  /**
   * Amount of wheel movement required before triggering
   * Material's previous/next pagination.
   */
  private readonly wheelThreshold = 40;

  //#endregion

  //#region lifecycle

  ngAfterViewInit(): void {
    this.elementRef.nativeElement.addEventListener('wheel', this.onWheel, {
      passive: false,
    });
  }

  ngOnDestroy(): void {
    this.elementRef.nativeElement.removeEventListener('wheel', this.onWheel);
  }

  //#endregion

  //#region wheel

  private readonly onWheel = (event: WheelEvent): void => {
    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    if (!delta) {
      return;
    }

    this.wheelAccumulator += delta;

    if (Math.abs(this.wheelAccumulator) < this.wheelThreshold) {
      return;
    }

    const direction = this.wheelAccumulator > 0 ? 'after' : 'before';

    this.wheelAccumulator = 0;

    // @ts-ignore
    const pagination = this.elementRef.nativeElement.querySelector<HTMLElement>(
      `.mat-mdc-tab-header-pagination-${direction}`,
    );

    if (!pagination) {
      return;
    }

    const disabled = pagination.classList.contains(
      'mat-mdc-tab-header-pagination-disabled',
    );

    if (disabled) {
      return;
    }

    event.preventDefault();

    pagination.click();
  };

  //#endregion
}
