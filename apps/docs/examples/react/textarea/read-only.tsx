import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Textarea } from '@slotted/react/textarea';

const TERMS = `1. Payment. Invoices are payable within 30 days of the invoice date. Late payments carry interest of 1% per month.

2. Delivery. The supplier ships within five business days of a confirmed purchase order. Partial shipments are invoiced separately.

3. Returns. Goods damaged in transit are reported within 48 hours of receipt, with photographs of the packaging.

4. Prices. Prices are fixed for the term of this agreement and reviewed every January.

5. Termination. Either party may end this agreement with 60 days' written notice.`;

export default function TextareaReadOnly() {
  return (
    <Field>
      <FieldLabel>Supplier terms</FieldLabel>
      <Textarea readOnly rows={6} defaultValue={TERMS} />
      <FieldDescription>Agreed with Exotic Liquids on 3 March 2026.</FieldDescription>
    </Field>
  );
}
