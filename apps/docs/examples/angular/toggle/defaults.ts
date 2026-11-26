import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { provideToggleDefaults, SlToggle } from '@slotted/angular/toggle';

@Component({
  selector: 'app-toggle-defaults',
  imports: [SlInline, SlToggle],
  providers: [provideToggleDefaults({ size: 'sm', variant: 'chips' })],
  template: `
    <div slInline [gap]="2">
      <button slToggle defaultPressed>Late pickups</button>
      <button slToggle>Low stock</button>
      <button slToggle>Backordered</button>
      <button slToggle variant="ghost">Archived</button>
    </div>
  `,
})
export class ToggleDefaults {}
