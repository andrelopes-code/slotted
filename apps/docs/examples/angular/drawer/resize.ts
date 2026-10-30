import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerHeader,
  SlDrawerResizer,
  SlDrawerTitle,
  SlDrawerTrigger,
} from '@slotted/angular/drawer';

const LINES = [
  { term: 'Arabica beans, 5 kg', value: '6 cases, $420.00' },
  { term: 'Oat milk, 12 × 1 L', value: '4 cases, $192.00' },
  { term: 'Paper cups, 16 oz, 1,000 per case', value: '4 cases, $628.00' },
];

@Component({
  selector: 'app-drawer-resize',
  imports: [
    SlButton,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerHeader,
    SlDrawerResizer,
    SlDrawerTitle,
    SlDrawerTrigger,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDrawerTrigger]="drawer">
      View order lines
    </button>
    <sl-drawer #drawer="slDrawer" [maxExtent]="0.8" [minExtent]="0.25" [(extent)]="extent">
      <header slDrawerHeader>
        <h2 slDrawerTitle>Order SO-1182 lines</h2>
        <p slDrawerDescription>Width: {{ width() }}.</p>
        <button slDrawerClose></button>
      </header>
      <div slDrawerBody>
        <div slDescriptionList>
          @for (line of lines; track line.term) {
            <div slDescriptionListItem>
              <dt slDescriptionListTerm>{{ line.term }}</dt>
              <dd slDescriptionListDescription>{{ line.value }}</dd>
            </div>
          }
        </div>
      </div>
      <div slDrawerResizer></div>
    </sl-drawer>
  `,
})
export class DrawerResize {
  readonly lines = LINES;
  readonly extent = signal<number | undefined>(undefined);
  readonly width = computed(() => {
    const extent = this.extent();
    return extent === undefined ? 'the md step' : `${Math.round(extent * 100)}% of the window`;
  });
}
