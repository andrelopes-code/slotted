import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { ToggleGroup, ToggleGroupItem } from '@slotted/react/toggle-group';

export default function ToggleGroupField() {
  return (
    <Field>
      <FieldLabel>Delivery window</FieldLabel>
      <ToggleGroup defaultValue={['afternoon']}>
        <ToggleGroupItem value="morning">Morning</ToggleGroupItem>
        <ToggleGroupItem value="afternoon">Afternoon</ToggleGroupItem>
        <ToggleGroupItem value="evening">Evening</ToggleGroupItem>
      </ToggleGroup>
      <FieldDescription>The carrier confirms the slot the day before.</FieldDescription>
    </Field>
  );
}
