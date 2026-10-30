import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Radio, RadioGroup, RadioGroupDefaultsProvider } from '@slotted/react/radio-group';
import { Stack } from '@slotted/react/stack';

export default function RadioGroupDefaults() {
  return (
    <RadioGroupDefaultsProvider orientation="horizontal">
      <Stack gap={5}>
        <FieldGroup>
          <FieldGroupLegend>Status</FieldGroupLegend>
          <FieldGroupContent>
            <RadioGroup defaultValue="all">
              <Radio value="all">All</Radio>
              <Radio value="open">Open</Radio>
              <Radio value="paid">Paid</Radio>
              <Radio value="overdue">Overdue</Radio>
            </RadioGroup>
          </FieldGroupContent>
        </FieldGroup>
        <FieldGroup>
          <FieldGroupLegend>Channel</FieldGroupLegend>
          <FieldGroupContent>
            <RadioGroup defaultValue="all">
              <Radio value="all">All</Radio>
              <Radio value="online">Online</Radio>
              <Radio value="retail">Retail</Radio>
              <Radio value="wholesale">Wholesale</Radio>
            </RadioGroup>
          </FieldGroupContent>
        </FieldGroup>
      </Stack>
    </RadioGroupDefaultsProvider>
  );
}
