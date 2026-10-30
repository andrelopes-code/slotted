import { Component, computed, signal } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';

const PRODUCTS = [
  'Canvas tote',
  'Merino beanie',
  'Stoneware mug',
  'Linen apron',
  'Trail daypack',
  'Wool throw',
  'Ceramic planter',
  'Field notebook',
  'Rain shell',
  'Leather wallet',
  'Weekender bag',
  'Cotton crewneck',
  'Camp mug',
  'Insulated bottle',
  'Chambray shirt',
  'Waffle towel',
  'Beeswax candle',
  'Rattan basket',
  'Hiking socks',
  'Down vest',
  'Sketchbook',
  'Wool blanket',
  'Market crossbody',
  'Felt slippers',
];
const COLORS = [
  'Natural',
  'Charcoal',
  'Olive',
  'Rust',
  'Navy',
  'Sand',
  'Forest',
  'Slate',
  'Clay',
  'Ink',
];
const SKUS = PRODUCTS.flatMap((product, row) =>
  COLORS.map((color, column) => ({
    sku: `NW-${1001 + row * COLORS.length + column}`,
    label: `${product}, ${color}`,
  })),
);
const PAGE = 30;

@Component({
  selector: 'app-combobox-load-more',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Variant</label>
      <sl-combobox
        placeholder="Search 240 SKUs"
        [filter]="null"
        [inputValue]="query()"
        [loading]="loading()"
        [total]="matching().length"
        (inputValueChange)="type($event)"
        (loadMore)="loadMore()"
      >
        @for (item of visible(); track item.sku; let index = $index) {
          <sl-combobox-item
            [value]="item.sku"
            [label]="item.label"
            [description]="item.sku"
            [position]="index + 1"
          />
        }
      </sl-combobox>
      <span slFieldDescription>Thirty at a time; scrolling to the end fetches the next page.</span>
    </div>
  `,
})
export class ComboboxLoadMore {
  protected readonly query = signal('');
  protected readonly shown = signal(PAGE);
  protected readonly loading = signal(false);
  private request = 0;

  /* The server's answer: every SKU whose label holds the query, a page at a time. */
  protected readonly matching = computed(() => {
    const needle = this.query().trim().toLowerCase();
    return SKUS.filter((item) => item.label.toLowerCase().includes(needle));
  });
  protected readonly visible = computed(() => this.matching().slice(0, this.shown()));

  protected type(text: string) {
    this.request += 1;
    this.query.set(text);
    this.shown.set(PAGE);
    this.loading.set(false);
  }

  protected loadMore() {
    if (this.loading() || this.shown() >= this.matching().length) return;
    const current = ++this.request;
    this.loading.set(true);
    setTimeout(() => {
      if (current !== this.request) return;
      this.shown.update((count) => count + PAGE);
      this.loading.set(false);
    }, 500);
  }
}
