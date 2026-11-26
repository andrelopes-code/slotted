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
  selector: 'app-floating-panel-steps',
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
    <button slButton type="button" (click)="open.set(true)">Open pallet tracker</button>

    <section
      slFloatingPanel
      defaultPlace="top-end"
      [largeStep]="64"
      [open]="open()"
      [step]="16"
      (openChange)="open.set($event)"
    >
      <div slFloatingPanelHandle>
        <h2 slFloatingPanelTitle>Pallet tracker</h2>
        <button slFloatingPanelClose></button>
      </div>
      <div slFloatingPanelBody>
        <p slText size="sm">Focus Move, then press an arrow key: 16 px, or 64 px with Shift.</p>
      </div>
    </section>
  `,
})
export class FloatingPanelSteps {
  protected readonly open = signal(false);
}
