import { Component } from '@angular/core';
import { SlCheckbox, SlCheckboxDescription } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlGrid } from '@slotted/angular/grid';

@Component({
  selector: 'app-checkbox-group-tiles',
  imports: [
    SlCheckbox,
    SlCheckboxDescription,
    SlCheckboxGroup,
    SlFieldGroup,
    SlFieldGroupLegend,
    SlGrid,
  ],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>Add-ons</legend>
      <div slCheckboxGroup name="add-ons" variant="tile" [defaultValue]="['audit-log']">
        <div slGrid minItemWidth="xs">
          <div slCheckbox value="audit-log">
            Audit log
            <p slCheckboxDescription>$29 per month. Every change kept for a year.</p>
          </div>
          <div slCheckbox value="sso">
            Single sign-on
            <p slCheckboxDescription>$49 per month. SAML and SCIM provisioning.</p>
          </div>
          <div slCheckbox value="support">
            Priority support
            <p slCheckboxDescription>$99 per month. Replies within four hours.</p>
          </div>
        </div>
      </div>
    </fieldset>
  `,
})
export class CheckboxGroupTiles {}
