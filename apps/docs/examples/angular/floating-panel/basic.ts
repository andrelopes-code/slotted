import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlFloatingPanel,
  SlFloatingPanelBody,
  SlFloatingPanelClose,
  SlFloatingPanelHandle,
  SlFloatingPanelTitle,
} from '@slotted/angular/floating-panel';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-floating-panel-basic',
  imports: [
    SlButton,
    SlFloatingPanel,
    SlFloatingPanelBody,
    SlFloatingPanelClose,
    SlFloatingPanelHandle,
    SlFloatingPanelTitle,
    SlStack,
    SlText,
  ],
  template: `
    <button slButton type="button" (click)="open.set(true)">Open shipping estimate</button>

    <section slFloatingPanel [open]="open()" (openChange)="open.set($event)">
      <div slFloatingPanelHandle>
        <h2 slFloatingPanelTitle>Shipping estimate</h2>
        <button slFloatingPanelClose></button>
      </div>
      <div slFloatingPanelBody>
        <div slStack [gap]="2">
          <p slText size="sm">Order 48213, 14 cases</p>
          <p slText size="sm">Freight $86.40</p>
          <p slText size="sm">Total $1,326.40</p>
        </div>
      </div>
    </section>
  `,
})
export class FloatingPanelBasic {
  protected readonly open = signal(false);
}
