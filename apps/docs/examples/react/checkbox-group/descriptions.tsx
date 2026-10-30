import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';

export default function CheckboxGroupDescriptions() {
  return (
    <FieldGroup>
      <FieldGroupLegend>When stock runs low</FieldGroupLegend>
      <FieldGroupContent>
        <CheckboxGroup defaultValue={['alert']}>
          <Checkbox
            value="alert"
            description="Sent to the buyer for the SKU when on-hand drops below the reorder point."
          >
            Alert the buyer
          </Checkbox>
          <Checkbox
            value="draft-po"
            description="Created for the preferred supplier at the usual order quantity, waiting for approval."
          >
            Draft a purchase order
          </Checkbox>
          <Checkbox
            value="hide"
            description="The product page shows Out of stock instead of a delivery date."
          >
            Stop selling online at zero
          </Checkbox>
        </CheckboxGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
