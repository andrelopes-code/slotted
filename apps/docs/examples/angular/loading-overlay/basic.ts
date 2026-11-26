import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlLoadingOverlay } from '@slotted/angular/loading-overlay';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlHeading } from '@slotted/angular/typography';

@Component({
  selector: 'app-loading-overlay-basic',
  imports: [
    SlButton,
    SlCard,
    SlCardBody,
    SlCardHeader,
    SlField,
    SlFieldLabel,
    SlHeading,
    SlInline,
    SlLoadingOverlay,
    SlStack,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slLoadingOverlay [loading]="saving()" [messages]="{ label: 'Saving the customer' }">
      <div slCard>
        <div slCardHeader>
          <h3 slHeading size="md">Customer profile</h3>
        </div>
        <div slCardBody>
          <div slStack [gap]="4">
            <div slField>
              <label slFieldLabel>Company</label>
              <div slTextField>
                <input slTextFieldInput value="Northwind Traders" />
              </div>
            </div>
            <div slInline>
              <button slButton (click)="save()">Save customer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoadingOverlayBasic {
  protected readonly saving = signal(false);

  protected save() {
    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 2500);
  }
}
