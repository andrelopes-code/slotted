import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlFloatingPanel,
  SlFloatingPanelBody,
  SlFloatingPanelClose,
  SlFloatingPanelHandle,
  SlFloatingPanelTitle,
} from '@slotted/angular/floating-panel';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-floating-panel-messages',
  imports: [
    SlButton,
    SlFloatingPanel,
    SlFloatingPanelBody,
    SlFloatingPanelClose,
    SlFloatingPanelHandle,
    SlFloatingPanelTitle,
    SlText,
  ],
  template: `
    <button slButton type="button" (click)="open.set(true)">Open packing timer</button>

    <section
      slFloatingPanel
      defaultPlace="top-start"
      [messages]="messages"
      [open]="open()"
      (openChange)="open.set($event)"
    >
      <div slFloatingPanelHandle>
        <h2 slFloatingPanelTitle>Packing timer</h2>
        <button slFloatingPanelClose></button>
      </div>
      <div slFloatingPanelBody>
        <p slText size="sm">Order 48213: 04:12 elapsed.</p>
      </div>
    </section>
  `,
})
export class FloatingPanelMessages {
  protected readonly messages = { close: 'Dismiss the timer', move: 'Reposition the timer' };
  protected readonly open = signal(false);
}
