import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';

export default function CheckboxGroupDisabledOption() {
  return (
    <FieldGroup>
      <FieldGroupLegend>Send order updates by</FieldGroupLegend>
      <FieldGroupContent>
        <CheckboxGroup name="updates" defaultValue={['email']}>
          <Checkbox value="email">Email</Checkbox>
          <Checkbox
            value="sms"
            disabled
            description="Add a mobile number to the customer record to turn this on."
          >
            Text message
          </Checkbox>
          <Checkbox value="webhook">Webhook to the storefront</Checkbox>
        </CheckboxGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
