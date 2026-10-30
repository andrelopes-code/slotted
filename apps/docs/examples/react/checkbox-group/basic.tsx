import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';

export default function CheckboxGroupBasic() {
  return (
    <FieldGroup>
      <FieldGroupLegend>Notify me about failed payments by</FieldGroupLegend>
      <FieldGroupContent>
        <CheckboxGroup name="channels" defaultValue={['email', 'in-app']}>
          <Checkbox value="email">Email</Checkbox>
          <Checkbox value="sms">Text message</Checkbox>
          <Checkbox value="in-app">In-app notification</Checkbox>
          <Checkbox value="slack">Slack, #billing-alerts</Checkbox>
        </CheckboxGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
