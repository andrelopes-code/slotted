import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';

export default function CheckboxGroupOrientation() {
  return (
    <FieldGroup>
      <FieldGroupLegend>Invoice status</FieldGroupLegend>
      <FieldGroupContent>
        <CheckboxGroup orientation="horizontal" defaultValue={['open', 'overdue']}>
          <Checkbox value="draft">Draft</Checkbox>
          <Checkbox value="open">Open</Checkbox>
          <Checkbox value="paid">Paid</Checkbox>
          <Checkbox value="overdue">Overdue</Checkbox>
          <Checkbox value="void">Void</Checkbox>
        </CheckboxGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
