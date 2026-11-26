import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlFloatingPanel,
  SlFloatingPanelBody,
  SlFloatingPanelClose,
  SlFloatingPanelHandle,
} from '@slotted/angular/floating-panel';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-floating-panel-label',
  imports: [
    SlButton,
    SlFloatingPanel,
    SlFloatingPanelBody,
    SlFloatingPanelClose,
    SlFloatingPanelHandle,
    SlText,
  ],
  template: `
    <button slButton type="button" (click)="open.set(true)">Open dispatch notes</button>

    <section
      slFloatingPanel
      defaultPlace="bottom-start"
      label="Dispatch notes"
      [open]="open()"
      (openChange)="open.set($event)"
    >
      <div slFloatingPanelHandle>
        <button slFloatingPanelClose></button>
      </div>
      <div slFloatingPanelBody>
        <p slText size="sm">Carrier pickup moved to 14:30 for order 48213.</p>
      </div>
    </section>
  `,
})
export class FloatingPanelLabel {
  protected readonly open = signal(false);
}
