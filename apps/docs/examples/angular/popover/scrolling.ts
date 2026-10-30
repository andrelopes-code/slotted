import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlPopover,
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverClose,
  SlPopoverContent,
  SlPopoverFooter,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-popover-scrolling',
  imports: [
    SlButton,
    SlPopover,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverClose,
    SlPopoverContent,
    SlPopoverFooter,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlPopoverTrigger,
    SlStack,
    SlText,
  ],
  template: `
    <ng-container slPopover [(open)]="open">
      <button slButton tone="secondary" variant="outline" slPopoverTrigger>
        Order 10248 activity
      </button>
      <ng-template slPopoverLayer>
        <div slPopoverContent>
          <div slPopoverHeader>
            <div slPopoverTitle>Order 10248 activity</div>
            <button slPopoverClose></button>
          </div>
          <div slPopoverBody>
            <div slStack [gap]="3">
              @for (entry of activity; track entry) {
                <span slText size="sm">{{ entry }}</span>
              }
            </div>
          </div>
          <div slPopoverFooter>
            <button slButton size="sm" (click)="open.set(false)">Done</button>
          </div>
        </div>
        <div slPopoverArrow></div>
      </ng-template>
    </ng-container>
  `,
})
export class PopoverScrolling {
  readonly open = signal(false);
  readonly activity = [
    'Jul 4, 9:12 AM. Order placed by Vins et alcools Chevalier.',
    'Jul 4, 9:40 AM. Payment authorised, 440.00 USD.',
    'Jul 5, 8:05 AM. Allocated to the Seattle warehouse.',
    'Jul 5, 2:30 PM. Picked by Nancy Davolio.',
    'Jul 6, 10:15 AM. Packed in two cartons, 14.2 kg.',
    'Jul 8, 11:00 AM. Customs documents filed for France.',
    'Jul 16, 4:00 PM. Collected by Federal Shipping.',
    'Jul 18, 7:20 AM. Arrived at the Le Havre hub.',
    'Jul 19, 9:45 AM. Out for delivery in Reims.',
    'Jul 19, 3:10 PM. Delivered, signed by P. Henriot.',
  ];
}
