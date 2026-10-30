import { Component } from '@angular/core';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlGrid } from '@slotted/angular/grid';
import { SlRadio, SlRadioDescription, SlRadioGroup } from '@slotted/angular/radio-group';

@Component({
  selector: 'app-radio-group-tiles',
  imports: [SlFieldGroup, SlFieldGroupLegend, SlGrid, SlRadio, SlRadioDescription, SlRadioGroup],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Plan</legend>
      <div slRadioGroup name="plan" variant="tile" defaultValue="team">
        <div slGrid minItemWidth="xs">
          <div slRadio value="starter">
            Starter
            <p slRadioDescription>$0 per month. Three projects and one seat.</p>
          </div>
          <div slRadio value="team">
            Team
            <p slRadioDescription>$49 per month. Unlimited projects and ten seats.</p>
          </div>
          <div slRadio value="business">
            Business
            <p slRadioDescription>$199 per month. Single sign-on and audit logs.</p>
          </div>
        </div>
      </div>
    </fieldset>
  `,
})
export class RadioGroupTiles {}
