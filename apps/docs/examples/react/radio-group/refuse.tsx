import { useState } from 'react';
import {
  FieldGroup,
  FieldGroupContent,
  FieldGroupDescription,
  FieldGroupError,
  FieldGroupLegend,
} from '@slotted/react/field-group';
import { Radio, RadioGroup } from '@slotted/react/radio-group';

const SEATS_IN_USE = 8;

export default function RadioGroupRefuse() {
  const [notice, setNotice] = useState('');

  return (
    <FieldGroup>
      <FieldGroupLegend>Plan</FieldGroupLegend>
      <FieldGroupDescription>This workspace has {SEATS_IN_USE} seats in use.</FieldGroupDescription>
      <FieldGroupError tone="warning" live="polite" reserve>
        {notice}
      </FieldGroupError>
      <FieldGroupContent>
        <RadioGroup
          defaultValue="team"
          onValueChange={(value, request) => {
            if (value === 'starter') {
              request.cancel();
              setNotice(`Starter includes one seat. Remove ${SEATS_IN_USE - 1} seats first.`);
              return;
            }
            setNotice('');
          }}
        >
          <Radio value="starter">Starter, one seat</Radio>
          <Radio value="team">Team, ten seats</Radio>
          <Radio value="business">Business, unlimited seats</Radio>
        </RadioGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
