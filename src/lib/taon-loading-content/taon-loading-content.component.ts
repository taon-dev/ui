import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
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
  /**
   * Estimated number of characters in the content.
   * Used to approximate the number of skeleton lines.
   */
  readonly estimatedContentLength = input<number>(500);

  private readonly charactersPerLine = 75;

  readonly lines = computed(() => {
    const length = Math.max(0, this.estimatedContentLength());

    const count = Math.max(1, Math.ceil(length / this.charactersPerLine));

    return Array.from({ length: count }, (_, index) => {
      const isLast = index === count - 1;

      if (isLast) {
        const remaining = length % this.charactersPerLine;

        return remaining === 0
          ? 75
          : Math.max(
              25,
              Math.min(100, (remaining / this.charactersPerLine) * 100),
            );
      }

      const widths = [100, 96, 88, 98, 92, 100, 85];

      return widths[index % widths.length];
    });
  });
}
