import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlTab, SlTabList, SlTabPanel, SlTabs, type TabsActivation } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

const MODES: { activation: TabsActivation; caption: string }[] = [
  { activation: 'automatic', caption: 'Automatic: the arrow keys select as they move.' },
  { activation: 'manual', caption: 'Manual: the arrow keys move focus; Enter or Space selects.' },
];

const REPORTS = [
  { value: 'revenue', label: 'Revenue', panel: 'Revenue this quarter: $412,800.00.' },
  { value: 'margin', label: 'Margin', panel: 'Gross margin this quarter: 38.4%.' },
  { value: 'returns', label: 'Returns', panel: 'Return rate this quarter: 2.1%.' },
];

@Component({
  selector: 'app-tabs-activation',
  imports: [SlStack, SlTab, SlTabList, SlTabPanel, SlTabs, SlText],
  template: `
    <div slStack [gap]="8">
      @for (mode of modes; track mode.activation) {
        <div slStack [gap]="3">
          <span slText size="sm" tone="muted">{{ mode.caption }}</span>
          <div slTabs defaultValue="revenue" [activation]="mode.activation">
            <div slTabList aria-label="Quarterly reports">
              @for (report of reports; track report.value) {
                <div slTab [value]="report.value">{{ report.label }}</div>
              }
            </div>
            @for (report of reports; track report.value) {
              <div slTabPanel [value]="report.value">
                <span slText size="sm">{{ report.panel }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class TabsActivationExample {
  protected readonly modes = MODES;
  protected readonly reports = REPORTS;
}
