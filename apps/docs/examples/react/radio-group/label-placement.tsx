import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Radio, RadioGroup } from '@slotted/react/radio-group';

export default function RadioGroupLabelPlacement() {
  return (
    <FieldGroup>
      <FieldGroupLegend>Send the stock report</FieldGroupLegend>
      <FieldGroupContent>
        <RadioGroup labelPlacement="start" defaultValue="monday">
          <Radio value="daily">Every morning</Radio>
          <Radio value="monday">Every Monday</Radio>
          <Radio value="never">Never</Radio>
        </RadioGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
