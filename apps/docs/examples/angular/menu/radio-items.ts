import { Component, computed, signal } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuRadioGroup, SlMenuTrigger } from '@slotted/angular/menu';

const GROUPINGS = [
  { value: 'none', label: 'No grouping' },
  { value: 'status', label: 'Status' },
  { value: 'customer', label: 'Customer' },
  { value: 'warehouse', label: 'Warehouse' },
];

@Component({
  selector: 'app-menu-radio-items',
  imports: [SlButton, SlButtonEnd, SlGlyph, SlMenu, SlMenuItem, SlMenuRadioGroup, SlMenuTrigger],
  template: `
    <button slButton variant="outline" [slMenuTriggerFor]="group">
      Group by: {{ current() }}
      <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <sl-menu #group>
      <sl-menu-radio-group aria-label="Group orders by" [(value)]="grouping">
        @for (option of groupings; track option.value) {
          <button slMenuRadioItem [value]="option.value">{{ option.label }}</button>
        }
      </sl-menu-radio-group>
    </sl-menu>
  `,
})
export class MenuRadioItems {
  protected readonly groupings = GROUPINGS;
  protected readonly grouping = signal<string | undefined>('status');
  protected readonly current = computed(
    () => GROUPINGS.find((option) => option.value === this.grouping())?.label,
  );
}
