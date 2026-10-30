import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import {
  provideMultiSelectDefaults,
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';
import { SlStack } from '@slotted/angular/stack';

const OWNERS: MultiSelectOption[] = [
  { value: 'avery', label: 'Avery Collins' },
  { value: 'kenji', label: 'Kenji Watanabe' },
  { value: 'lucia', label: 'Lucía Fernández' },
  { value: 'omar', label: 'Omar Haddad' },
];

const SEGMENTS: MultiSelectOption[] = [
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'retail', label: 'Retail' },
];

@Component({
  selector: 'app-multi-select-defaults',
  imports: [SlField, SlFieldLabel, SlMultiSelect, SlMultiSelectItem, SlStack],
  providers: [provideMultiSelectDefaults({ size: 'sm', variant: 'subtle', overflow: 'collapse' })],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Account owners</label>
        <sl-multi-select placeholder="Any owner" [items]="owners" [value]="ownersChosen">
          @for (owner of owners; track owner.value) {
            <sl-multi-select-item [value]="owner.value" [label]="owner.label" />
          }
        </sl-multi-select>
      </div>
      <div slField>
        <label slFieldLabel>Segments</label>
        <sl-multi-select placeholder="Any segment" [items]="segments" [value]="segmentsChosen">
          @for (segment of segments; track segment.value) {
            <sl-multi-select-item [value]="segment.value" [label]="segment.label" />
          }
        </sl-multi-select>
      </div>
    </div>
  `,
})
export class MultiSelectDefaults {
  protected readonly owners = OWNERS;
  protected readonly segments = SEGMENTS;
  protected readonly ownersChosen = ['lucia', 'kenji'];
  protected readonly segmentsChosen = ['wholesale'];
}
