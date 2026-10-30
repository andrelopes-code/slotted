import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { Textarea } from '@slotted/react/textarea';

export default function TextareaCount() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Gift message</FieldLabel>
        <Textarea
          rows={2}
          maxLength={150}
          showCount
          defaultValue="Happy anniversary to the whole team at Alfreds Futterkiste."
        />
        <FieldDescription>Printed on a card inside the box.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Product summary</FieldLabel>
        <Textarea
          rows={3}
          countMax={120}
          showCount
          defaultValue="Hand-picked Darjeeling first flush, packed in resealable tins of 100 grams. Ships within two days."
        />
        <FieldDescription>Search results cut summaries after 120 characters.</FieldDescription>
      </Field>
    </Stack>
  );
}
