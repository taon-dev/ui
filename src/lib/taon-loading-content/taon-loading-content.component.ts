import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-loading-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './taon-loading-content.component.html',
  styleUrl: './taon-loading-content.component.scss',
})
export class TaonLoadingContentComponent {
  t = t.for(this);

  readonly estimatedContentLength = input<number>(500);

  readonly fullOneLineWidthSplit = input(0, { transform: numberAttribute });

  private readonly charactersPerLine = 75;

  readonly splitCount = computed(() => {
    const count = this.fullOneLineWidthSplit();
    return Number.isSafeInteger(count) && count > 0 ? count : 0;
  });

  readonly lines = computed(() => {
    const splitCount = this.splitCount();

    if (splitCount > 0) {
      return Array.from({ length: splitCount }, () => 100);
    }

    const length = Math.max(0, this.estimatedContentLength());
    const count = Math.max(1, Math.ceil(length / this.charactersPerLine));
    const widths = [100, 96, 88, 98, 92, 100, 85];

    return Array.from({ length: count }, (_, index) => {
      if (index === count - 1) {
        const remaining = length % this.charactersPerLine;

        return remaining === 0
          ? 75
          : Math.max(
              25,
              Math.min(100, (remaining / this.charactersPerLine) * 100),
            );
      }

      return widths[index % widths.length];
    });
  });
}
