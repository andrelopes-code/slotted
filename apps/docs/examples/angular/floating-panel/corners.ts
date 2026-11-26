import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlFloatingPanel,
  SlFloatingPanelBody,
  SlFloatingPanelClose,
  SlFloatingPanelHandle,
  SlFloatingPanelTitle,
} from '@slotted/angular/floating-panel';
import type { FloatingCorner } from '@slotted/angular/floating-panel';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-floating-panel-corners',
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
    <button slButton type="button" (click)="closed.set([])">Show all docks</button>

    @for (dock of docks; track dock.corner) {
      <section
        slFloatingPanel
        [defaultPlace]="dock.corner"
        [open]="!closed().includes(dock.corner)"
        (openChange)="closed.set([...closed(), dock.corner])"
      >
        <div slFloatingPanelHandle>
          <h2 slFloatingPanelTitle>{{ dock.name }}</h2>
          <button slFloatingPanelClose></button>
        </div>
        <div slFloatingPanelBody>
          <p slText size="sm">{{ dock.status }}</p>
        </div>
      </section>
    }
  `,
})
export class FloatingPanelCorners {
  protected readonly docks: readonly { corner: FloatingCorner; name: string; status: string }[] = [
    { corner: 'top-start', name: 'Inbound dock', status: 'Door 3 free' },
    { corner: 'top-end', name: 'Outbound dock', status: '2 trucks waiting' },
    { corner: 'bottom-start', name: 'Cold storage', status: '3.8 °C' },
    { corner: 'bottom-end', name: 'Returns', status: '11 parcels to sort' },
  ];
  protected readonly closed = signal<readonly FloatingCorner[]>(
    this.docks.map((dock) => dock.corner),
  );
}
