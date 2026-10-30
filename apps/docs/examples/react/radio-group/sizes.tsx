import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Radio, RadioGroup } from '@slotted/react/radio-group';
import { Stack } from '@slotted/react/stack';

export default function RadioGroupSizes() {
  return (
    <Stack gap={5}>
      <FieldGroup size="sm">
        <FieldGroupLegend>Count by</FieldGroupLegend>
        <FieldGroupContent>
          <RadioGroup orientation="horizontal" defaultValue="cases">
            <Radio value="cases">Cases</Radio>
            <Radio value="units">Units</Radio>
          </RadioGroup>
        </FieldGroupContent>
      </FieldGroup>
      <FieldGroup size="md">
        <FieldGroupLegend>Payment terms</FieldGroupLegend>
        <FieldGroupContent>
          <RadioGroup orientation="horizontal" defaultValue="net-30">
            <Radio value="net-30">Net 30</Radio>
            <Radio value="net-60">Net 60</Radio>
          </RadioGroup>
        </FieldGroupContent>
      </FieldGroup>
      <FieldGroup size="lg">
        <FieldGroupLegend>Account type</FieldGroupLegend>
        <FieldGroupContent>
          <RadioGroup orientation="horizontal" defaultValue="business">
            <Radio value="business">Business</Radio>
            <Radio value="personal">Personal</Radio>
          </RadioGroup>
        </FieldGroupContent>
      </FieldGroup>
    </Stack>
  );
}
