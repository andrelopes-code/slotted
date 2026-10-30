import { Radio, RadioGroup } from '@slotted/react/radio-group';

export default function RadioGroupStandalone() {
  return (
    <RadioGroup aria-label="Chart range" orientation="horizontal" size="sm" defaultValue="30">
      <Radio value="7">7 days</Radio>
      <Radio value="30">30 days</Radio>
      <Radio value="90">90 days</Radio>
    </RadioGroup>
  );
}
