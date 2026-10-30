import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

type Facet = 'warehouse' | 'carrier' | 'owner';

const WAREHOUSES = ['Reno, NV', 'Columbus, OH', 'Savannah, GA'];
const CARRIERS = ['UPS', 'FedEx', 'DHL', 'USPS'];
const OWNERS = ['Avery Collins', 'Kenji Watanabe', 'Lucía Fernández', 'Omar Haddad'];

const FACETS: { id: Facet; label: string; options: string[] }[] = [
  { id: 'warehouse', label: 'Warehouse', options: WAREHOUSES },
  { id: 'carrier', label: 'Carrier', options: CARRIERS },
  { id: 'owner', label: 'Owner', options: OWNERS },
];

/** Open orders, counted per warehouse, carrier and owner. */
const ORDERS = WAREHOUSES.flatMap((warehouse, w) =>
  CARRIERS.flatMap((carrier, c) =>
    OWNERS.map((owner, o) => ({ warehouse, carrier, owner, count: 1 + ((w + 2 * c + 3 * o) % 5) })),
  ),
);
const TOTAL = ORDERS.reduce((sum, row) => sum + row.count, 0);

const NONE: Record<Facet, string | null> = { warehouse: null, carrier: null, owner: null };
const EMPTY: Record<Facet, string> = { warehouse: '', carrier: '', owner: '' };

@Component({
  selector: 'app-combobox-filter-facets',
  imports: [SlButton, SlCombobox, SlComboboxItem, SlInline, SlText],
  template: `
    <div slInline [gap]="2" align="center" wrap="wrap">
      @for (facet of facets; track facet.id) {
        <sl-combobox
          size="sm"
          width="content"
          [fullWidth]="false"
          [aria-label]="facet.label"
          [placeholder]="facet.label"
          [value]="chosen()[facet.id]"
          (valueChange)="choose(facet.id, $event)"
          [inputValue]="texts()[facet.id]"
          (inputValueChange)="type(facet.id, $event)"
        >
          @for (option of facet.options; track option) {
            <sl-combobox-item [value]="option" [label]="option" />
          }
        </sl-combobox>
      }
      <button slButton size="sm" variant="ghost" [disabled]="active() === 0" (click)="clear()">
        Clear filters
      </button>
      <span slText size="sm" tone="muted">{{ matching() }} of {{ total }} orders</span>
    </div>
  `,
})
export class ComboboxFilterFacets {
  protected readonly facets = FACETS;
  protected readonly total = TOTAL;
  protected readonly chosen = signal(NONE);
  protected readonly texts = signal(EMPTY);

  protected readonly matching = computed(() =>
    ORDERS.filter((row) =>
      FACETS.every(
        (facet) => this.chosen()[facet.id] === null || row[facet.id] === this.chosen()[facet.id],
      ),
    ).reduce((sum, row) => sum + row.count, 0),
  );
  protected readonly active = computed(
    () => FACETS.filter((facet) => this.chosen()[facet.id] !== null).length,
  );

  protected choose(facet: Facet, value: string | null) {
    this.chosen.update((held) => ({ ...held, [facet]: value }));
  }

  protected type(facet: Facet, text: string) {
    this.texts.update((held) => ({ ...held, [facet]: text }));
  }

  protected clear() {
    this.chosen.set(NONE);
    this.texts.set(EMPTY);
  }
}
