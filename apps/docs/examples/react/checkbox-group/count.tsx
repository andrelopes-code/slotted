import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';

const WAREHOUSES = ['seattle', 'tacoma', 'portland', 'boise'];

export default function CheckboxGroupCount() {
  return (
    <Field>
      <FieldLabel>Fulfil from</FieldLabel>
      <CheckboxGroup
        name="warehouses"
        allValues={WAREHOUSES}
        defaultValue={['seattle', 'tacoma']}
        showCount
      >
        <Checkbox value="seattle">Seattle</Checkbox>
        <Checkbox value="tacoma">Tacoma</Checkbox>
        <Checkbox value="portland">Portland</Checkbox>
        <Checkbox value="boise">Boise</Checkbox>
      </CheckboxGroup>
      <FieldDescription>Orders ship from the nearest selected warehouse.</FieldDescription>
    </Field>
  );
}
