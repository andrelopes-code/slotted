import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';

export default function CheckboxGroupLabelPlacement() {
  return (
    <FieldGroup>
      <FieldGroupLegend>Email reports</FieldGroupLegend>
      <FieldGroupContent>
        <CheckboxGroup labelPlacement="start" defaultValue={['weekly']}>
          <Checkbox value="daily">Daily sales summary</Checkbox>
          <Checkbox value="weekly">Weekly stock report</Checkbox>
          <Checkbox value="monthly">Monthly statement</Checkbox>
        </CheckboxGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
