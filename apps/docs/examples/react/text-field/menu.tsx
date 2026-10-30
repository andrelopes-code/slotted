import { useState } from 'react';
import { Field, FieldLabel } from '@slotted/react/field';
import { Glyph, Icon } from '@slotted/react/icon';
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from '@slotted/react/menu';
import { TextField, TextFieldAction } from '@slotted/react/text-field';
import { VisuallyHidden } from '@slotted/react/visually-hidden';

export default function TextFieldMenu() {
  const [country, setCountry] = useState('+1');

  return (
    <Field>
      <FieldLabel>Phone</FieldLabel>
      <Menu>
        <TextField
          autoComplete="tel-national"
          defaultValue="206 555 0134"
          start={
            <MenuTrigger
              render={(props) => (
                <TextFieldAction {...props}>
                  <VisuallyHidden>Country code</VisuallyHidden>
                  {country}
                  <Icon>
                    <Glyph name="chevron-down" />
                  </Icon>
                </TextFieldAction>
              )}
            />
          }
          type="tel"
        />
        <MenuContent>
          <MenuRadioGroup value={country} onValueChange={setCountry}>
            <MenuRadioItem value="+1">United States +1</MenuRadioItem>
            <MenuRadioItem value="+44">United Kingdom +44</MenuRadioItem>
            <MenuRadioItem value="+49">Germany +49</MenuRadioItem>
            <MenuRadioItem value="+81">Japan +81</MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
    </Field>
  );
}
