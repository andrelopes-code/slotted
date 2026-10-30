import { Component, signal } from '@angular/core';
import type { ChangeRequest } from '@slotted/core/state';
import { SlStack } from '@slotted/angular/stack';
import { SlTab, SlTabList, SlTabPanel, SlTabs } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

const STEPS = [
  { value: 'picking', label: 'Picking', panel: '18 lines to pick in zone C.' },
  { value: 'packing', label: 'Packing', panel: '6 orders waiting at station 2.' },
  { value: 'loading', label: 'Loading', panel: 'Atlas Freight trailer at dock 4 until 15:30.' },
];

@Component({
  selector: 'app-tabs-keyboard',
  imports: [SlStack, SlTab, SlTabList, SlTabPanel, SlTabs, SlText],
  template: `
    <div slStack [gap]="5">
      <div slTabs defaultValue="picking" (valueChange)="report($event)">
        <div slTabList aria-label="Outbound shift">
          @for (step of steps; track step.value) {
            <div slTab [value]="step.value">{{ step.label }}</div>
          }
        </div>
        @for (step of steps; track step.value) {
          <div slTabPanel [value]="step.value">
            <span slText size="sm">{{ step.panel }}</span>
          </div>
        }
      </div>
      <span slText size="sm" tone="muted">{{ last() }}</span>
    </div>
  `,
})
export class TabsKeyboard {
  protected readonly steps = STEPS;
  protected readonly last = signal('Nothing selected yet.');

  protected report(request: ChangeRequest<string | undefined>) {
    const step = STEPS.find((item) => item.value === request.value);
    this.last.set(`${step?.label} selected by ${request.reason}.`);
  }
}
