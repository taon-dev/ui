import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  Input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TaonAdminService } from 'taon/src';

@Component({
  selector: 'taon-items-hamburger',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,

  templateUrl: './taon-items-hamburger.component.html',

  styleUrl: './taon-items-hamburger.component.scss',
})
export class TaonItemsHamburgerComponent {
  @Input() icon = 'menu';

  readonly taonAdminService = inject(TaonAdminService);

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly opened = signal(false);

  toggle(event: MouseEvent): void {
    event.stopPropagation();

    this.opened.update(opened => !opened);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;

    if (
      this.opened() &&
      target &&
      !this.elementRef.nativeElement.contains(target)
    ) {
      this.opened.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.opened.set(false);
  }
}
