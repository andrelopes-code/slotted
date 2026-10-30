import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlStack } from '@slotted/angular/stack';
import { SlSwitch } from '@slotted/angular/switch';
import { SlTab, SlTabList, SlTabPanel, SlTabs, SlTabStart } from '@slotted/angular/tabs';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlHeading, SlText } from '@slotted/angular/typography';

const PLAN = [
  ['Plan', 'Operations, annual'],
  ['Seats', '24 of 30 in use'],
  ['Next invoice', 'November 1, 2026: $4,320.00'],
];

@Component({
  selector: 'app-tabs-settings',
  imports: [
    SlButton,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlGlyph,
    SlHeading,
    SlIcon,
    SlStack,
    SlSwitch,
    SlTab,
    SlTabList,
    SlTabPanel,
    SlTabs,
    SlTabStart,
    SlText,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slTabs defaultValue="workspace" orientation="vertical">
      <div slTabList aria-label="Settings">
        <div slTab value="workspace">
          <span slTabStart
            ><span slIcon><svg slGlyph name="file-text"></svg></span
          ></span>
          Workspace
        </div>
        <div slTab value="notifications">
          <span slTabStart
            ><span slIcon><svg slGlyph name="bell"></svg></span
          ></span>
          Notifications
        </div>
        <div slTab value="security">
          <span slTabStart
            ><span slIcon><svg slGlyph name="lock"></svg></span
          ></span>
          Security
        </div>
        <div slTab value="billing">
          <span slTabStart
            ><span slIcon><svg slGlyph name="calendar"></svg></span
          ></span>
          Billing
        </div>
      </div>
      <div slTabPanel value="workspace">
        <div slStack [gap]="5" align="start">
          <h3 slHeading size="md">Workspace</h3>
          <div slField>
            <label slFieldLabel>Company name</label>
            <div slTextField>
              <input slTextFieldInput defaultValue="Northwind Traders" />
            </div>
            <span slFieldDescription>Printed on every invoice and packing slip.</span>
          </div>
          <div slField>
            <label slFieldLabel>Support email</label>
            <div slTextField>
              <input slTextFieldInput defaultValue="support@northwind.example" type="email" />
            </div>
          </div>
          <button slButton size="sm">Save changes</button>
        </div>
      </div>
      <div slTabPanel value="notifications">
        <div slStack [gap]="4">
          <h3 slHeading size="md">Notifications</h3>
          <span slSwitch defaultChecked>Low stock</span>
          <span slSwitch defaultChecked>Late pickups</span>
          <span slSwitch>Cycle count variances</span>
        </div>
      </div>
      <div slTabPanel value="security">
        <div slStack [gap]="4">
          <h3 slHeading size="md">Security</h3>
          <span slSwitch defaultChecked>Require two-factor sign-in</span>
          <span slText size="sm" tone="muted">Changed by Dana Whitfield on August 14.</span>
        </div>
      </div>
      <div slTabPanel value="billing">
        <div slStack [gap]="4">
          <h3 slHeading size="md">Billing</h3>
          <div slDescriptionList>
            @for (row of plan; track row[0]) {
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>{{ row[0] }}</dt>
                <dd slDescriptionListDescription>{{ row[1] }}</dd>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TabsSettings {
  protected readonly plan = PLAN;
}
