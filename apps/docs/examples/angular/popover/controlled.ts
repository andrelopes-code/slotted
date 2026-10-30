import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import {
  SlPopover,
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-popover-controlled',
  imports: [
    SlButton,
    SlInline,
    SlPopover,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlPopoverTrigger,
    SlRadio,
    SlRadioGroup,
    SlText,
  ],
  template: `
    <div slInline align="center" [gap]="3">
      <span slText size="sm">Order 10251, picked by {{ picker() }}</span>
      <ng-container slPopover [(open)]="open" align="end">
        <button slButton size="sm" tone="secondary" variant="outline" slPopoverTrigger>
          Reassign
        </button>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverHeader>
              <div slPopoverTitle>Picker for order 10251</div>
            </div>
            <div slPopoverBody>
              <div
                slRadioGroup
                aria-label="Picker"
                [value]="picker()"
                (valueChange)="choose($event.value)"
              >
                @for (name of pickers; track name) {
                  <div slRadio [value]="name">{{ name }}</div>
                }
              </div>
            </div>
          </div>
          <div slPopoverArrow></div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
export class PopoverControlled {
  readonly pickers = ['Nancy Davolio', 'Andrew Fuller', 'Janet Leverling', 'Margaret Peacock'];
  readonly open = signal(false);
  readonly picker = signal('Nancy Davolio');

  choose(name: string | undefined): void {
    if (name !== undefined) this.picker.set(name);
    this.open.set(false);
  }
}
