import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Stack } from '@slotted/react/stack';

export default function CheckboxGroupSizes() {
  return (
    <Stack gap={5}>
      <FieldGroup size="sm">
        <FieldGroupLegend>Show columns</FieldGroupLegend>
        <FieldGroupContent>
          <CheckboxGroup orientation="horizontal" defaultValue={['sku', 'on-hand']}>
            <Checkbox value="sku">SKU</Checkbox>
            <Checkbox value="on-hand">On hand</Checkbox>
            <Checkbox value="reserved">Reserved</Checkbox>
          </CheckboxGroup>
        </FieldGroupContent>
      </FieldGroup>
      <FieldGroup size="md">
        <FieldGroupLegend>Ship from</FieldGroupLegend>
        <FieldGroupContent>
          <CheckboxGroup orientation="horizontal" defaultValue={['seattle']}>
            <Checkbox value="seattle">Seattle</Checkbox>
            <Checkbox value="tacoma">Tacoma</Checkbox>
            <Checkbox value="portland">Portland</Checkbox>
          </CheckboxGroup>
        </FieldGroupContent>
      </FieldGroup>
      <FieldGroup size="lg">
        <FieldGroupLegend>Accept payment by</FieldGroupLegend>
        <FieldGroupContent>
          <CheckboxGroup orientation="horizontal" defaultValue={['card', 'transfer']}>
            <Checkbox value="card">Card</Checkbox>
            <Checkbox value="transfer">Bank transfer</Checkbox>
          </CheckboxGroup>
        </FieldGroupContent>
      </FieldGroup>
    </Stack>
  );
}
