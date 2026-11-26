import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlFloatingPanel,
  SlFloatingPanelBody,
  SlFloatingPanelClose,
  SlFloatingPanelHandle,
  SlFloatingPanelTitle,
} from '@slotted/angular/floating-panel';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-floating-panel-non-modal',
  imports: [
    SlButton,
    SlFloatingPanel,
    SlFloatingPanelBody,
    SlFloatingPanelClose,
    SlFloatingPanelHandle,
    SlFloatingPanelTitle,
    SlInline,
    SlText,
  ],
  template: `
    <div slInline>
      <button slButton type="button" (click)="picked.set(picked() + 1)">Pick one case</button>
      <button slButton type="button" variant="outline" (click)="open.set(true)">
        Open pick list
      </button>
    </div>

    <section
      slFloatingPanel
      defaultPlace="bottom-start"
      [open]="open()"
      (openChange)="open.set($event)"
    >
      <div slFloatingPanelHandle>
        <h2 slFloatingPanelTitle>Pick list</h2>
        <button slFloatingPanelClose></button>
      </div>
      <div slFloatingPanelBody>
        <p slText size="sm">Cases picked for order 48213: {{ picked() }} of 14</p>
      </div>
    </section>
  `,
})
export class FloatingPanelNonModal {
  protected readonly open = signal(false);
  protected readonly picked = signal(0);
}
