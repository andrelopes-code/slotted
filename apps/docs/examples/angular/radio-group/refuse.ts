import { Component, signal } from '@angular/core';
import type { ChangeRequest } from '@slotted/core/state';
import {
  SlFieldGroup,
  SlFieldGroupDescription,
  SlFieldGroupError,
  SlFieldGroupLegend,
} from '@slotted/angular/field-group';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';

const SEATS_IN_USE = 8;

@Component({
  selector: 'app-radio-group-refuse',
  imports: [
    SlFieldGroup,
    SlFieldGroupDescription,
    SlFieldGroupError,
    SlFieldGroupLegend,
    SlRadio,
    SlRadioGroup,
  ],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Plan</legend>
      <span slFieldGroupDescription>This workspace has {{ seatsInUse }} seats in use.</span>
      <span slFieldGroupError tone="warning" live="polite" reserve>{{ notice() }}</span>
      <div slRadioGroup defaultValue="team" (valueChange)="request($event)">
        <div slRadio value="starter">Starter, one seat</div>
        <div slRadio value="team">Team, ten seats</div>
        <div slRadio value="business">Business, unlimited seats</div>
      </div>
    </fieldset>
  `,
})
export class RadioGroupRefuse {
  readonly seatsInUse = SEATS_IN_USE;
  readonly notice = signal('');

  request(request: ChangeRequest<string | undefined>): void {
    if (request.value === 'starter') {
      request.cancel();
      this.notice.set(`Starter includes one seat. Remove ${SEATS_IN_USE - 1} seats first.`);
      return;
    }
    this.notice.set('');
  }
}
