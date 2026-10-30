import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { MultiSelect, MultiSelectContent, MultiSelectControl } from '@slotted/react/multi-select';

export default function MultiSelectEditable() {
  return (
    <Field>
      <FieldLabel>Bin locations</FieldLabel>
      <MultiSelect
        creatable
        editable
        defaultValue={['A-12-03', 'A-12-04', 'C-02-11']}
        messages={{ empty: 'Type a bin code and press Enter.' }}
      >
        <MultiSelectControl placeholder="Add a bin" />
        <MultiSelectContent />
      </MultiSelect>
      <FieldDescription>
        Press ArrowLeft to reach a bin, then Enter to correct it in place.
      </FieldDescription>
    </Field>
  );
}
