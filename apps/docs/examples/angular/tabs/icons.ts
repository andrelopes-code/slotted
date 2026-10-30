import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlGlyph, SlIcon, type GlyphName } from '@slotted/angular/icon';
import { SlTab, SlTabEnd, SlTabList, SlTabPanel, SlTabs, SlTabStart } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

const VIEWS: { value: string; label: string; icon: GlyphName; count?: number; panel: string }[] = [
  {
    value: 'overview',
    label: 'Overview',
    icon: 'file-text',
    panel: 'Harbor & Pine, customer since 2021. Net 30 terms.',
  },
  {
    value: 'orders',
    label: 'Orders',
    icon: 'inbox',
    count: 12,
    panel: '12 open orders, $14,380.00 in total.',
  },
  {
    value: 'contacts',
    label: 'Contacts',
    icon: 'person',
    count: 3,
    panel: 'Dana Whitfield, Marco Ilić and Priya Raman.',
  },
  {
    value: 'files',
    label: 'Files',
    icon: 'paperclip',
    panel: 'Signed credit application and a W-9 form.',
  },
];

@Component({
  selector: 'app-tabs-icons',
  imports: [
    SlBadge,
    SlGlyph,
    SlIcon,
    SlTab,
    SlTabEnd,
    SlTabList,
    SlTabPanel,
    SlTabs,
    SlTabStart,
    SlText,
  ],
  template: `
    <div slTabs defaultValue="orders">
      <div slTabList aria-label="Customer Harbor & Pine">
        @for (view of views; track view.value) {
          <div slTab [value]="view.value">
            <span slTabStart
              ><span slIcon><svg slGlyph [name]="view.icon"></svg></span
            ></span>
            {{ view.label }}
            @if (view.count !== undefined) {
              <span slTabEnd><span slBadge size="sm" [count]="view.count"></span></span>
            }
          </div>
        }
      </div>
      @for (view of views; track view.value) {
        <div slTabPanel [value]="view.value">
          <span slText size="sm">{{ view.panel }}</span>
        </div>
      }
    </div>
  `,
})
export class TabsIcons {
  protected readonly views = VIEWS;
}
