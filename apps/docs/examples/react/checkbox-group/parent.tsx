import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';

const COLUMNS = ['order', 'customer', 'placed', 'total', 'status'];

export default function CheckboxGroupParent() {
  return (
    <FieldGroup>
      <FieldGroupLegend>Columns to export</FieldGroupLegend>
      <FieldGroupContent>
        <CheckboxGroup
          name="columns"
          allValues={COLUMNS}
          defaultValue={['order', 'customer', 'total']}
        >
          <Checkbox parent>All columns</Checkbox>
          <Checkbox value="order">Order number</Checkbox>
          <Checkbox value="customer">Customer</Checkbox>
          <Checkbox value="placed">Placed on</Checkbox>
          <Checkbox value="total">Total</Checkbox>
          <Checkbox value="status">Status</Checkbox>
        </CheckboxGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
