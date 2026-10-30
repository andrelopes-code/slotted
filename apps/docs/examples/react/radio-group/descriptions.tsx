import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Radio, RadioGroup } from '@slotted/react/radio-group';

export default function RadioGroupDescriptions() {
  return (
    <FieldGroup>
      <FieldGroupLegend>Billing cycle</FieldGroupLegend>
      <FieldGroupContent>
        <RadioGroup defaultValue="monthly">
          <Radio value="monthly" description="Billed on the 5th of each month. Cancel any time.">
            Monthly
          </Radio>
          <Radio value="yearly" description="Two months free, billed once when you subscribe.">
            Yearly
          </Radio>
        </RadioGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
