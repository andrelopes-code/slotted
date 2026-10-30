import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

export default function CheckboxParent() {
  return (
    <FieldGroup>
      <FieldGroupLegend>Delivery days</FieldGroupLegend>
      <FieldGroupContent>
        <CheckboxGroup allValues={WEEKDAYS} defaultValue={['mon', 'wed', 'fri']} name="days">
          <Checkbox parent>Every weekday</Checkbox>
          <Checkbox value="mon">Monday</Checkbox>
          <Checkbox value="tue">Tuesday</Checkbox>
          <Checkbox value="wed">Wednesday</Checkbox>
          <Checkbox value="thu">Thursday</Checkbox>
          <Checkbox value="fri">Friday</Checkbox>
        </CheckboxGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
