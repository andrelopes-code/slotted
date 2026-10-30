import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerFooter,
  SlDrawerHeader,
  SlDrawerTitle,
  SlDrawerTrigger,
} from '@slotted/angular/drawer';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlInline } from '@slotted/angular/inline';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const ORDERS = [
  { id: 'SO-1182', status: 'processing', warehouse: 'RNO' },
  { id: 'SO-1183', status: 'shipped', warehouse: 'CMH' },
  { id: 'SO-1184', status: 'on-hold', warehouse: 'RNO' },
  { id: 'SO-1185', status: 'processing', warehouse: 'SAV' },
  { id: 'SO-1186', status: 'shipped', warehouse: 'RNO' },
  { id: 'SO-1187', status: 'processing', warehouse: 'CMH' },
  { id: 'SO-1188', status: 'on-hold', warehouse: 'SAV' },
  { id: 'SO-1189', status: 'processing', warehouse: 'RNO' },
];

interface Filters {
  statuses: readonly string[];
  warehouse: string;
}

const ALL: Filters = { statuses: ['processing', 'shipped', 'on-hold'], warehouse: 'any' };

const matching = (filters: Filters) =>
  ORDERS.filter(
    (order) =>
      filters.statuses.includes(order.status) &&
      (filters.warehouse === 'any' || order.warehouse === filters.warehouse),
  ).length;

@Component({
  selector: 'app-drawer-filters',
  imports: [
    SlButton,
    SlCheckbox,
    SlCheckboxGroup,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerFooter,
    SlDrawerHeader,
    SlDrawerTitle,
    SlDrawerTrigger,
    SlFieldGroup,
    SlFieldGroupLegend,
    SlInline,
    SlRadio,
    SlRadioGroup,
    SlStack,
    SlText,
  ],
  template: `
    <div slInline align="center" [gap]="3">
      <span slText size="sm">{{ shown() }} of {{ total }} orders</span>
      <button slButton size="sm" tone="secondary" variant="outline" [slDrawerTrigger]="drawer">
        Filters
      </button>
      <sl-drawer #drawer="slDrawer" size="sm" [open]="open()" (openChange)="toggle($event)">
        <header slDrawerHeader>
          <h2 slDrawerTitle>Filter orders</h2>
          <button slDrawerClose></button>
        </header>
        <div slDrawerBody>
          <div slStack [gap]="6">
            <fieldset slFieldGroup>
              <legend slFieldGroupLegend>Status</legend>
              <div
                slCheckboxGroup
                [value]="draft().statuses"
                (valueChange)="draft.set({ statuses: $event.value, warehouse: draft().warehouse })"
              >
                <div slCheckbox value="processing">Processing</div>
                <div slCheckbox value="shipped">Shipped</div>
                <div slCheckbox value="on-hold">On hold</div>
              </div>
            </fieldset>
            <fieldset slFieldGroup>
              <legend slFieldGroupLegend>Warehouse</legend>
              <div
                slRadioGroup
                [value]="draft().warehouse"
                (valueChange)="
                  draft.set({ statuses: draft().statuses, warehouse: $event.value ?? 'any' })
                "
              >
                <div slRadio value="any">Any warehouse</div>
                <div slRadio value="RNO">Reno, NV</div>
                <div slRadio value="CMH">Columbus, OH</div>
                <div slRadio value="SAV">Savannah, GA</div>
              </div>
            </fieldset>
          </div>
        </div>
        <footer slDrawerFooter>
          <button slButton variant="ghost" tone="secondary" (click)="draft.set(all)">Reset</button>
          <button slButton (click)="apply()">Show {{ count() }} orders</button>
        </footer>
      </sl-drawer>
    </div>
  `,
})
export class DrawerFilters {
  readonly all = ALL;
  readonly total = ORDERS.length;
  readonly open = signal(false);
  readonly applied = signal<Filters>(ALL);
  readonly draft = signal<Filters>(ALL);
  readonly shown = computed(() => matching(this.applied()));
  readonly count = computed(() => matching(this.draft()));

  toggle(next: boolean): void {
    if (next) this.draft.set(this.applied());
    this.open.set(next);
  }

  apply(): void {
    this.applied.set(this.draft());
    this.open.set(false);
  }
}
