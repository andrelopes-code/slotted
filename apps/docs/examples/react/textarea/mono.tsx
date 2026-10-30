import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Textarea } from '@slotted/react/textarea';

const PAYLOAD = `{
  "event": "order.shipped",
  "orderId": 10248,
  "carrier": "Federal Shipping",
  "tracking": "FS-2026-0042-7731"
}`;

export default function TextareaMono() {
  return (
    <Field>
      <FieldLabel>Test payload</FieldLabel>
      <Textarea mono variant="subtle" rows={7} spellCheck={false} defaultValue={PAYLOAD} />
      <FieldDescription>Sent to your endpoint when you press Send test event.</FieldDescription>
    </Field>
  );
}
