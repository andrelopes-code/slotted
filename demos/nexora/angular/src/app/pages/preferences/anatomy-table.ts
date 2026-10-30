import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
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

import type { AnatomyLayer, AnatomyLayerId, AxisAnatomy } from '../../core/theming/theme-anatomy';

/** One change a reader made, in words, with the layers it writes. */
export interface ChangeRow extends AxisAnatomy {
  readonly label: string;
  readonly value: string;
}

/** The layers in the order a theme is built, as the table names them. */
const LAYERS: readonly {
  readonly id: AnatomyLayerId;
  readonly label: string;
  readonly what: string;
}[] = [
  { id: 'seeds', label: 'Seeds', what: 'The five colours every other colour is derived from' },
  { id: 'recipe', label: 'Recipe', what: 'Derivations that differ from the library’s' },
  { id: 'base', label: 'Scales', what: 'Type, weights, space, corners and lines' },
  { id: 'schemes', label: 'Schemes', what: 'Shadows and the chart palette, per scheme' },
  { id: 'densities', label: 'Densities', what: 'Control heights, insets and sizes' },
  { id: 'motion', label: 'Motion', what: 'Durations and easings' },
  { id: 'components', label: 'Components', what: 'The families’ own tokens' },
  { id: 'rules', label: 'Rules', what: 'CSS for what no token reaches' },
  { id: 'fonts', label: 'Fonts', what: 'The faces the theme brings' },
];
/** How many entries a cell lists before it counts the rest. */
const SHOWN = 6;

/**
 * A theme object read layer by layer: how many entries each layer declares
 * over the library's own theme, and the first of them. With no anatomy yet
 * the nine rows stand, and the count and the entries hold placeholders.
 */
@Component({
  selector: 'app-anatomy-table',
  imports: [
    SlSkeleton,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlText,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .layer {
      display: grid;
      gap: var(--slotted-space-1);
    }
    /* Token names and selectors are code. */
    .entries {
      font-family: var(--slotted-font-family-mono);
      overflow-wrap: anywhere;
    }
    .pending-count {
      inline-size: 3ch;
    }
    .pending-entries {
      inline-size: 24ch;
    }
    .tables {
      display: grid;
      gap: var(--slotted-space-6);
    }
  `,
  template: `
    <div class="tables">
      <div slTable variant="framed" [columns]="3" layout="fixed" striped data-anatomy>
        <div slTableContent>
          <caption slTableCaption>
            {{
              caption()
            }}
          </caption>
          <thead slTableHead>
            <tr slTableRow>
              <th slTableColumnHeader>Layer</th>
              <th slTableColumnHeader data-align="end">Entries</th>
              <th slTableColumnHeader>What it sets</th>
            </tr>
          </thead>
          <tbody slTableBody>
            @for (row of rows(); track row.id) {
              <tr slTableRow [attr.data-layer]="row.id">
                <th slTableRowHeader>
                  <span class="layer">
                    <span slText size="sm" weight="medium">{{ row.label }}</span>
                    <span slText size="xs" tone="muted">{{ row.what }}</span>
                  </span>
                </th>
                <td slTableCell data-align="end">
                  @if (row.layer; as layer) {
                    <span slText size="sm" numeric="tabular" data-count>{{ layer.count }}</span>
                  } @else {
                    <span class="pending-count" slSkeleton shape="text"></span>
                  }
                </td>
                <td slTableCell>
                  @if (row.layer; as layer) {
                    <span class="entries" slText size="xs" data-entries>{{ row.entries }}</span>
                  } @else {
                    <span class="pending-entries" slSkeleton shape="text"></span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </div>
      </div>
      @if (changes().length > 0) {
        <div slTable variant="framed" [columns]="3" layout="fixed" striped data-change-anatomy>
          <div slTableContent>
            <caption slTableCaption>
              Your changes, and the layers each one writes
            </caption>
            <thead slTableHead>
              <tr slTableRow>
                <th slTableColumnHeader>Change</th>
                <th slTableColumnHeader>Value</th>
                <th slTableColumnHeader>Layers it writes</th>
              </tr>
            </thead>
            <tbody slTableBody>
              @for (change of changeRows(); track change.axis) {
                <tr slTableRow [attr.data-change]="change.axis">
                  <th slTableRowHeader>
                    <span slText size="sm" weight="medium">{{ change.label }}</span>
                  </th>
                  <td slTableCell>
                    <span slText size="sm">{{ change.value }}</span>
                  </td>
                  <td slTableCell>
                    <span class="entries" slText size="xs" data-layers>{{ change.layers }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </div>
        </div>
      }
    </div>
  `,
})
export class AnatomyTable {
  /** `null` while the theme module loads. */
  readonly anatomy = input.required<readonly AnatomyLayer[] | null>();
  /** The theme the anatomy reads, as the reader knows it. */
  readonly name = input.required<string>();
  /** The reader's changes over the theme, each with the layers it writes; none for a theme as it comes. */
  readonly changes = input<readonly ChangeRow[]>([]);

  protected readonly changeRows = computed(() =>
    this.changes().map((change) => ({
      axis: change.axis,
      label: change.label,
      value: change.value,
      layers: change.layers
        .map((layer) => `${LAYERS.find((entry) => entry.id === layer.id)!.label} · ${layer.count}`)
        .join(', '),
    })),
  );

  protected readonly caption = computed(
    () => `The layers of ${this.name()}, as its theme object declares them over the library’s`,
  );
  protected readonly rows = computed(() => {
    const anatomy = this.anatomy();
    return LAYERS.map((layer) => {
      const read = anatomy?.find((entry) => entry.id === layer.id) ?? null;
      const rest = (read?.items.length ?? 0) - SHOWN;
      return {
        ...layer,
        layer: read,
        entries:
          read === null || read.items.length === 0
            ? '—'
            : `${read.items.slice(0, SHOWN).join(', ')}${rest > 0 ? `, +${rest} more` : ''}`,
      };
    });
  });
}
