import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Glyph, Icon } from '@slotted/react/icon';
import { TextField } from '@slotted/react/text-field';

export default function TextFieldPassword() {
  return (
    <Field required>
      <FieldLabel>New password</FieldLabel>
      <TextField
        autoComplete="new-password"
        minLength={12}
        revealable
        start={
          <Icon>
            <Glyph name="lock" />
          </Icon>
        }
        type="password"
      />
      <FieldDescription>At least 12 characters.</FieldDescription>
    </Field>
  );
}
