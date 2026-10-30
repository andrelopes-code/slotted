import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Radio, RadioGroup } from '@slotted/react/radio-group';

export default function RadioGroupOrientation() {
  return (
    <FieldGroup>
      <FieldGroupLegend>Report period</FieldGroupLegend>
      <FieldGroupContent>
        <RadioGroup orientation="horizontal" defaultValue="month">
          <Radio value="day">Day</Radio>
          <Radio value="week">Week</Radio>
          <Radio value="month">Month</Radio>
          <Radio value="quarter">Quarter</Radio>
          <Radio value="year">Year</Radio>
        </RadioGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
