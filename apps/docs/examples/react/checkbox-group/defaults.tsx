import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup, CheckboxGroupDefaultsProvider } from '@slotted/react/checkbox-group';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Stack } from '@slotted/react/stack';

export default function CheckboxGroupDefaults() {
  return (
    <CheckboxGroupDefaultsProvider orientation="horizontal">
      <Stack gap={5}>
        <FieldGroup>
          <FieldGroupLegend>Fulfilment</FieldGroupLegend>
          <FieldGroupContent>
            <CheckboxGroup defaultValue={['unfulfilled', 'partial']}>
              <Checkbox value="unfulfilled">Unfulfilled</Checkbox>
              <Checkbox value="partial">Partial</Checkbox>
              <Checkbox value="fulfilled">Fulfilled</Checkbox>
            </CheckboxGroup>
          </FieldGroupContent>
        </FieldGroup>
        <FieldGroup>
          <FieldGroupLegend>Sales channel</FieldGroupLegend>
          <FieldGroupContent>
            <CheckboxGroup defaultValue={['online']}>
              <Checkbox value="online">Online</Checkbox>
              <Checkbox value="retail">Retail</Checkbox>
              <Checkbox value="wholesale">Wholesale</Checkbox>
            </CheckboxGroup>
          </FieldGroupContent>
        </FieldGroup>
      </Stack>
    </CheckboxGroupDefaultsProvider>
  );
}
