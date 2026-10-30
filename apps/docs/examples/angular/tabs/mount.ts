import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTab,
  SlTabList,
  SlTabPanel,
  SlTabPanelContent,
  SlTabs,
  type TabsMount,
} from '@slotted/angular/tabs';
import { SlTextarea } from '@slotted/angular/textarea';
import { SlText } from '@slotted/angular/typography';

const MODES: { mount: TabsMount; caption: string }[] = [
  { mount: 'active', caption: 'mount="active": the note is built again, empty, on return.' },
  { mount: 'lazy', caption: 'mount="lazy": the note keeps what was typed.' },
];

@Component({
  selector: 'app-tabs-mount',
  imports: [
    SlField,
    SlFieldLabel,
    SlStack,
    SlTab,
    SlTabList,
    SlTabPanel,
    SlTabPanelContent,
    SlTabs,
    SlText,
    SlTextarea,
  ],
  template: `
    <div slStack [gap]="8">
      @for (mode of modes; track mode.mount) {
        <div slStack [gap]="3">
          <span slText size="sm" tone="muted">{{ mode.caption }}</span>
          <div slTabs defaultValue="note" [mount]="mode.mount">
            <div slTabList aria-label="Order SO-1187">
              <div slTab value="note">Picking note</div>
              <div slTab value="summary">Summary</div>
            </div>
            <div slTabPanel value="note">
              <ng-template slTabPanelContent>
                <div slField>
                  <label slFieldLabel>Note for the picker</label>
                  <textarea
                    slTextarea
                    placeholder="Pack the brackets separately"
                    rows="2"
                  ></textarea>
                </div>
              </ng-template>
            </div>
            <div slTabPanel value="summary">
              <span slText size="sm">3 lines, picked from zone C at Reno, NV.</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class TabsMountExample {
  protected readonly modes = MODES;
}
