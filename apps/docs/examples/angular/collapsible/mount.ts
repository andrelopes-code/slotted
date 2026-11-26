import { Component } from '@angular/core';
import {
  SlCollapsible,
  SlCollapsibleContent,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import type { CollapsibleMount } from '@slotted/angular/collapsible';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-collapsible-mount',
  imports: [
    SlCollapsible,
    SlCollapsibleContent,
    SlCollapsibleHeader,
    SlCollapsiblePanel,
    SlCollapsibleTrigger,
    SlField,
    SlFieldLabel,
    SlStack,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slStack [gap]="2">
      @for (note of notes; track note.mount) {
        <div slCollapsible [mount]="note.mount" variant="ruled">
          <div slCollapsibleHeader>
            <button slCollapsibleTrigger [description]="note.mount">{{ note.title }}</button>
          </div>
          <div slCollapsiblePanel>
            <ng-template slCollapsibleContent>
              <div slField>
                <label slFieldLabel>Note</label>
                <div slTextField>
                  <input slTextFieldInput placeholder="Type, close and reopen" />
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      }

      <div slCollapsible mount="until-found" variant="ruled">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger description="until-found">Delivery history</button>
        </div>
        <div slCollapsiblePanel>Delivered on March 2 by Anna Rivers to the Reno warehouse.</div>
      </div>
    </div>
  `,
})
export class CollapsibleMountExample {
  protected readonly notes: { mount: CollapsibleMount; title: string }[] = [
    { mount: 'active', title: 'Dock notes' },
    { mount: 'lazy', title: 'Carrier notes' },
    { mount: 'eager', title: 'Receiving notes' },
  ];
}
