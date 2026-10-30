import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlInline } from '@slotted/angular/inline';
import { SlSkeleton } from '@slotted/angular/skeleton';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlText } from '@slotted/angular/typography';
import type { Scheme } from '@slotted/theme';

import { CONTRAST_PAIRS } from '../../core/theming/contrast-pairs';
import type { ContrastReading } from '../../core/theming/contrast-reading';

const SCHEME_NAMES = { light: 'Light', dark: 'Dark', 'high-contrast': 'High contrast' } as const;
const SCHEMES = Object.keys(SCHEME_NAMES) as Scheme[];

/**
 * The contrast readings of a candidate appearance: one row per pair, one
 * column per scheme, each ratio beside the floor it is held to. With no
 * readings yet the rows and the columns stand, and each cell holds a
 * placeholder of a ratio and its mark, which an enclosing skeleton region paints.
 */
@Component({
  selector: 'app-contrast-table',
  imports: [
    SlBadge,
    SlInline,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlSkeleton,
    SlText,
  ],
  styles: `
    .pending {
      inline-size: 11ch;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div slTable variant="framed" [columns]="4" striped data-contrast>
      <div slTableContent>
        <caption slTableCaption>
          Contrast of the chosen colours, as the theme’s recipe computes them
        </caption>
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Pair</th>
            @for (scheme of schemes; track scheme) {
              <th slTableColumnHeader>{{ schemeNames[scheme] }}</th>
            }
          </tr>
        </thead>
        <tbody slTableBody>
          @for (row of rows(); track row.id) {
            <tr slTableRow>
              <th slTableRowHeader>{{ row.label }}</th>
              @for (cell of row.cells; track cell.scheme) {
                <td slTableCell [attr.data-pair]="row.id" [attr.data-scheme]="cell.scheme">
                  @if (cell.reading; as reading) {
                    <span slInline [gap]="2">
                      <span slText size="sm" numeric="tabular" data-ratio>{{ reading.ratio }}</span>
                      <span
                        slBadge
                        size="sm"
                        variant="soft"
                        [tone]="reading.passes ? 'success' : 'danger'"
                        >{{ reading.passes ? 'Meets' : 'Below' }} {{ reading.floor }}:1</span
                      >
                    </span>
                  } @else {
                    <span class="pending" slSkeleton shape="text"></span>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class ContrastTable {
  /** `null` while the readings' module loads. */
  readonly readings = input.required<readonly ContrastReading[] | null>();

  protected readonly schemes = SCHEMES;
  protected readonly schemeNames = SCHEME_NAMES;
  /** One row per pair, one cell per scheme; a cell's reading is `null` until the readings arrive. */
  protected readonly rows = computed(() => {
    const readings = this.readings();
    return CONTRAST_PAIRS.map((pair) => ({
      id: pair.id,
      label: pair.label,
      cells: SCHEMES.map((scheme) => {
        const reading = readings
          ?.find((entry) => entry.scheme === scheme)
          ?.pairs.find((entry) => entry.id === pair.id);
        return {
          scheme,
          reading: reading
            ? {
                ratio: `${reading.ratio.toFixed(2)}:1`,
                floor: reading.floor,
                passes: reading.passes,
              }
            : null,
        };
      }),
    }));
  });
}
