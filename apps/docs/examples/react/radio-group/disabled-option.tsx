import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Radio, RadioGroup } from '@slotted/react/radio-group';

export default function RadioGroupDisabledOption() {
  return (
    <FieldGroup>
      <FieldGroupLegend>Carrier</FieldGroupLegend>
      <FieldGroupContent>
        <RadioGroup defaultValue="ups">
          <Radio value="ups">UPS Ground</Radio>
          <Radio value="fedex">FedEx 2Day</Radio>
          <Radio value="dhl" disabled description="Does not deliver to Anchorage, AK.">
            DHL Express
          </Radio>
        </RadioGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
