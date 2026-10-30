import { Component, signal } from '@angular/core';
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
  SlDrawerFooter,
  SlDrawerHeader,
  SlDrawerTitle,
  SlDrawerTrigger,
} from '@slotted/angular/drawer';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTextarea } from '@slotted/angular/textarea';

const DETAILS = [
  { term: 'Customer', value: 'Contoso Foods, Seattle' },
  { term: 'Items', value: '14 cases, 3 products' },
  { term: 'Warehouse', value: 'Reno, NV' },
];

@Component({
  selector: 'app-drawer-pin',
  imports: [
    SlButton,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerFooter,
    SlDrawerHeader,
    SlDrawerTitle,
    SlDrawerTrigger,
    SlField,
    SlFieldLabel,
    SlInline,
    SlStack,
    SlTextarea,
  ],
  template: `
    <div slStack [gap]="3">
      <div slInline>
        <button slButton size="sm" tone="secondary" variant="outline" [slDrawerTrigger]="drawer">
          Notes
        </button>
      </div>
      <div
        style="
          display: flex;
          flex-wrap: wrap;
          min-block-size: 18rem;
          border: 1px solid var(--slotted-border-subtle);
          border-radius: var(--slotted-radius-lg);
          overflow: hidden;
        "
      >
        <div style="flex: 1 1 12rem; padding: var(--slotted-space-6)">
          <div slDescriptionList>
            @for (detail of details; track detail.term) {
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>{{ detail.term }}</dt>
                <dd slDescriptionListDescription>{{ detail.value }}</dd>
              </div>
            }
          </div>
        </div>
        <sl-drawer
          #drawer="slDrawer"
          size="sm"
          [mode]="pinned() ? 'inline' : 'overlay'"
          [(open)]="open"
        >
          <header slDrawerHeader>
            <h2 slDrawerTitle>Notes on SO-1182</h2>
            <button slDrawerClose></button>
          </header>
          <div slDrawerBody>
            <div slField>
              <label slFieldLabel>Note for the warehouse</label>
              <textarea
                slTextarea
                placeholder="Pallet height, dock number, contact on site"
              ></textarea>
            </div>
          </div>
          <footer slDrawerFooter>
            <button
              slButton
              size="sm"
              tone="secondary"
              variant="outline"
              (click)="pinned.set(!pinned())"
            >
              {{ pinned() ? 'Unpin' : 'Pin beside the order' }}
            </button>
          </footer>
        </sl-drawer>
      </div>
    </div>
  `,
})
export class DrawerPin {
  readonly details = DETAILS;
  readonly open = signal(false);
  readonly pinned = signal(false);
}
