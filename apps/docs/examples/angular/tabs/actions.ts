import { Component } from '@angular/core';
import { SlButton, SlButtonStart } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlTab, SlTabActions, SlTabList, SlTabPanel, SlTabs } from '@slotted/angular/tabs';
import { SlToolbar } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';

const VIEWS = [
  { value: 'lines', label: 'Lines', panel: '6 lines from Quill & Co., $4,812.00.' },
  { value: 'receipts', label: 'Receipts', panel: '4 of 6 lines received at Columbus, OH.' },
  { value: 'history', label: 'History', panel: 'Approved by Marco Ilić on September 22.' },
];

@Component({
  selector: 'app-tabs-actions',
  imports: [
    SlButton,
    SlButtonStart,
    SlGlyph,
    SlTab,
    SlTabActions,
    SlTabList,
    SlTabPanel,
    SlTabs,
    SlText,
    SlToolbar,
  ],
  template: `
    <div slTabs defaultValue="lines">
      <div slTabList aria-label="Purchase order PO-4521">
        @for (view of views; track view.value) {
          <div slTab [value]="view.value">{{ view.label }}</div>
        }
      </div>
      <div slTabActions>
        <div slToolbar aria-label="Purchase order actions" size="sm">
          <button slButton size="sm" tone="secondary" variant="ghost">
            <span slButtonStart><svg slGlyph name="upload"></svg></span>
            Export
          </button>
          <button slButton size="sm" tone="secondary" variant="ghost">
            <span slButtonStart><svg slGlyph name="copy"></svg></span>
            Duplicate
          </button>
        </div>
      </div>
      @for (view of views; track view.value) {
        <div slTabPanel [value]="view.value">
          <span slText size="sm">{{ view.panel }}</span>
        </div>
      }
    </div>
  `,
})
export class TabsActionsExample {
  protected readonly views = VIEWS;
}
