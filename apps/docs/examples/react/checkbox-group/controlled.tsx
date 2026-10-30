import { useState } from 'react';
import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Stack } from '@slotted/react/stack';

const ORDERS: Record<string, number> = { card: 812, transfer: 145, paypal: 96 };

export default function CheckboxGroupControlled() {
  const [methods, setMethods] = useState<readonly string[]>(['card', 'transfer']);
  const shown = methods.reduce((sum, method) => sum + (ORDERS[method] ?? 0), 0);

  return (
    <Stack gap={4}>
      <FieldGroup>
        <FieldGroupLegend>Payment method</FieldGroupLegend>
        <FieldGroupContent>
          <CheckboxGroup orientation="horizontal" value={methods} onValueChange={setMethods}>
            <Checkbox value="card">Card</Checkbox>
            <Checkbox value="transfer">Bank transfer</Checkbox>
            <Checkbox value="paypal">PayPal</Checkbox>
          </CheckboxGroup>
        </FieldGroupContent>
      </FieldGroup>
      <span>Showing {shown} orders</span>
    </Stack>
  );
}
