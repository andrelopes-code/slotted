import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Radio, RadioGroup } from '@slotted/react/radio-group';

export default function RadioGroupBasic() {
  return (
    <FieldGroup>
      <FieldGroupLegend>Delivery speed</FieldGroupLegend>
      <FieldGroupContent>
        <RadioGroup name="delivery" defaultValue="standard">
          <Radio value="standard">Standard, 3 to 5 business days</Radio>
          <Radio value="express">Express, next business day</Radio>
          <Radio value="same-day">Same day, Seattle only</Radio>
        </RadioGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
