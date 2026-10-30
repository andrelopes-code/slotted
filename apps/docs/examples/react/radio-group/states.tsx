import {
  FieldGroup,
  FieldGroupContent,
  FieldGroupDescription,
  FieldGroupError,
  FieldGroupLegend,
} from '@slotted/react/field-group';
import { Radio, RadioGroup } from '@slotted/react/radio-group';
import { Stack } from '@slotted/react/stack';

export default function RadioGroupStates() {
  return (
    <Stack gap={6}>
      <FieldGroup required>
        <FieldGroupLegend>Payment terms</FieldGroupLegend>
        <FieldGroupError>Choose the payment terms for this customer.</FieldGroupError>
        <FieldGroupContent>
          <RadioGroup invalid orientation="horizontal">
            <Radio value="net-30">Net 30</Radio>
            <Radio value="net-60">Net 60</Radio>
            <Radio value="prepaid">Prepaid</Radio>
          </RadioGroup>
        </FieldGroupContent>
      </FieldGroup>
      <FieldGroup readOnly>
        <FieldGroupLegend>Warehouse</FieldGroupLegend>
        <FieldGroupDescription>Stock is reserved once the order is picked.</FieldGroupDescription>
        <FieldGroupContent>
          <RadioGroup orientation="horizontal" defaultValue="seattle">
            <Radio value="seattle">Seattle</Radio>
            <Radio value="tacoma">Tacoma</Radio>
          </RadioGroup>
        </FieldGroupContent>
      </FieldGroup>
      <FieldGroup disabled>
        <FieldGroupLegend>Return method</FieldGroupLegend>
        <FieldGroupDescription>Returns open when the order is delivered.</FieldGroupDescription>
        <FieldGroupContent>
          <RadioGroup orientation="horizontal" defaultValue="drop-off">
            <Radio value="drop-off">Drop-off</Radio>
            <Radio value="pickup">Pickup</Radio>
          </RadioGroup>
        </FieldGroupContent>
      </FieldGroup>
    </Stack>
  );
}
