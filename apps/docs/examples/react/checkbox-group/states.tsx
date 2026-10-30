import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import {
  FieldGroup,
  FieldGroupContent,
  FieldGroupDescription,
  FieldGroupError,
  FieldGroupLegend,
} from '@slotted/react/field-group';
import { Stack } from '@slotted/react/stack';

export default function CheckboxGroupStates() {
  return (
    <Stack gap={6}>
      <FieldGroup required>
        <FieldGroupLegend>Sales regions</FieldGroupLegend>
        <FieldGroupError>Choose at least one region for this price list.</FieldGroupError>
        <FieldGroupContent>
          <CheckboxGroup invalid orientation="horizontal">
            <Checkbox value="us">United States</Checkbox>
            <Checkbox value="ca">Canada</Checkbox>
            <Checkbox value="eu">European Union</Checkbox>
          </CheckboxGroup>
        </FieldGroupContent>
      </FieldGroup>
      <FieldGroup readOnly>
        <FieldGroupLegend>Tax exemptions</FieldGroupLegend>
        <FieldGroupDescription>
          Set by the finance team on the customer record.
        </FieldGroupDescription>
        <FieldGroupContent>
          <CheckboxGroup orientation="horizontal" defaultValue={['resale']}>
            <Checkbox value="resale">Resale</Checkbox>
            <Checkbox value="nonprofit">Nonprofit</Checkbox>
          </CheckboxGroup>
        </FieldGroupContent>
      </FieldGroup>
      <FieldGroup disabled>
        <FieldGroupLegend>Carriers</FieldGroupLegend>
        <FieldGroupDescription>
          Carriers open once a ship-from address is saved.
        </FieldGroupDescription>
        <FieldGroupContent>
          <CheckboxGroup orientation="horizontal" defaultValue={['ups']}>
            <Checkbox value="ups">UPS</Checkbox>
            <Checkbox value="fedex">FedEx</Checkbox>
            <Checkbox value="usps">USPS</Checkbox>
          </CheckboxGroup>
        </FieldGroupContent>
      </FieldGroup>
    </Stack>
  );
}
