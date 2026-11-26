import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlFloatingPanel,
  SlFloatingPanelBody,
  SlFloatingPanelClose,
  SlFloatingPanelHandle,
  SlFloatingPanelTitle,
} from '@slotted/angular/floating-panel';
import type { FloatingPlace } from '@slotted/angular/floating-panel';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-floating-panel-place',
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
      <button slButton type="button" (click)="open.set(true)">Open route notes</button>
      <button slButton type="button" variant="outline" (click)="place.set({ x: 32, y: 96 })">
        Pin to the top left
      </button>
    </div>

    <section
      slFloatingPanel
      [open]="open()"
      [place]="place()"
      (openChange)="open.set($event)"
      (placeChange)="place.set($event)"
    >
      <div slFloatingPanelHandle>
        <h2 slFloatingPanelTitle>Route notes</h2>
        <button slFloatingPanelClose></button>
      </div>
      <div slFloatingPanelBody>
        <p slText size="sm">{{ summary() }}</p>
      </div>
    </section>
  `,
})
export class FloatingPanelPlace {
  protected readonly open = signal(false);
  protected readonly place = signal<FloatingPlace | undefined>(undefined);
  protected readonly summary = computed(() => {
    const place = this.place();

    return place === undefined
      ? 'Not moved yet'
      : `Stored at x ${String(Math.round(place.x))}, y ${String(Math.round(place.y))}`;
  });
}
