import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
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
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-popover-focus',
  imports: [
    SlButton,
    SlField,
    SlFieldLabel,
    SlPopover,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlPopoverTrigger,
    SlStack,
    SlText,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <ng-container slPopover align="start" initialFocus="input">
      <button slButton tone="secondary" variant="outline" slPopoverTrigger>Find a customer</button>
      <ng-template slPopoverLayer>
        <div slPopoverContent>
          <div slPopoverHeader>
            <div slPopoverTitle>Find a customer</div>
          </div>
          <div slPopoverBody>
            <div slStack [gap]="3">
              <div slField>
                <label slFieldLabel>Company name</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    type="search"
                    [value]="query()"
                    (valueChange)="query.set($event.value)"
                  />
                </div>
              </div>
              <span slText size="sm" tone="muted">{{ summary() }}</span>
            </div>
          </div>
        </div>
        <div slPopoverArrow></div>
      </ng-template>
    </ng-container>
  `,
})
export class PopoverFocus {
  readonly customers = [
    'Alfreds Futterkiste',
    'Ernst Handel',
    'Frankenversand',
    'Königlich Essen',
    'Wartian Herkku',
  ];
  readonly query = signal('');
  readonly summary = computed(() => {
    const query = this.query().trim().toLowerCase();
    const matches = this.customers.filter((name) => name.toLowerCase().includes(query));
    return matches.length === 0 ? 'No customer matches.' : matches.join(', ');
  });
}
