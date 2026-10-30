import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerFooter,
  SlDrawerHeader,
  SlDrawerResizer,
  SlDrawerTitle,
  SlDrawerTrigger,
} from '@slotted/angular/drawer';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlInline } from '@slotted/angular/inline';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import { SlText } from '@slotted/angular/typography';

const WINDOWS = [
  { value: 'morning', label: 'Thursday 8 October, 8 AM to noon' },
  { value: 'afternoon', label: 'Thursday 8 October, 1 to 5 PM' },
  { value: 'friday', label: 'Friday 9 October, 8 AM to noon' },
];

@Component({
  selector: 'app-drawer-sheet',
  imports: [
    SlButton,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerFooter,
    SlDrawerHeader,
    SlDrawerResizer,
    SlDrawerTitle,
    SlDrawerTrigger,
    SlFieldGroup,
    SlFieldGroupLegend,
    SlInline,
    SlRadio,
    SlRadioGroup,
    SlText,
  ],
  template: `
    <div slInline align="center" [gap]="3">
      <span slText size="sm">Pickup: {{ pickupLabel() }}</span>
      <button slButton size="sm" tone="secondary" variant="outline" [slDrawerTrigger]="drawer">
        Reschedule
      </button>
      <sl-drawer #drawer="slDrawer" side="bottom" [open]="open()" (openChange)="toggle($event)">
        <div slDrawerResizer></div>
        <header slDrawerHeader>
          <h2 slDrawerTitle>Reschedule pickup</h2>
          <p slDrawerDescription>Shipment SH-4471, UPS Ground from Reno, NV.</p>
          <button slDrawerClose></button>
        </header>
        <div slDrawerBody>
          <fieldset slFieldGroup>
            <legend slFieldGroupLegend>Pickup window</legend>
            <div slRadioGroup [value]="draft()" (valueChange)="draft.set($event.value ?? draft())">
              @for (window of windows; track window.value) {
                <div slRadio [value]="window.value">{{ window.label }}</div>
              }
            </div>
          </fieldset>
        </div>
        <footer slDrawerFooter>
          <button slButton variant="ghost" tone="secondary" (click)="open.set(false)">
            Cancel
          </button>
          <button slButton (click)="reschedule()">Reschedule</button>
        </footer>
      </sl-drawer>
    </div>
  `,
})
export class DrawerSheet {
  readonly windows = WINDOWS;
  readonly open = signal(false);
  readonly pickup = signal('morning');
  readonly draft = signal(this.pickup());
  readonly pickupLabel = computed(
    () => WINDOWS.find((window) => window.value === this.pickup())?.label,
  );

  toggle(next: boolean): void {
    if (next) this.draft.set(this.pickup());
    this.open.set(next);
  }

  reschedule(): void {
    this.pickup.set(this.draft());
    this.open.set(false);
  }
}
