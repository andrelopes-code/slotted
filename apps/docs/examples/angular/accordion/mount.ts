import { Component } from '@angular/core';
import { SlAccordion } from '@slotted/angular/accordion';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';

const MOUNTS = ['active', 'lazy', 'eager', 'until-found'] as const;

@Component({
  selector: 'app-accordion-mount',
  imports: [
    SlAccordion,
    SlField,
    SlFieldLabel,
    SlStack,
    SlText,
    SlTextField,
    SlTextFieldInput,
    SlCollapsible,
    SlCollapsibleHeader,
    SlCollapsiblePanel,
    SlCollapsibleTrigger,
  ],
  template: `
    <div slStack [gap]="6">
      @for (mount of mounts; track mount) {
        <div slStack [gap]="2">
          <p slText size="sm" tone="muted">mount="{{ mount }}"</p>
          <div slAccordion [mount]="mount">
            <div slCollapsible value="note">
              <h3 slCollapsibleHeader>
                <button slCollapsibleTrigger>Carrier note</button>
              </h3>
              <div slCollapsiblePanel>
                <div slField>
                  <label slFieldLabel>Note for the carrier</label>
                  <div slTextField><input slTextFieldInput /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AccordionMount {
  protected readonly mounts = MOUNTS;
}
