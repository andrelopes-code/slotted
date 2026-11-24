import { useState } from 'react';
import { Card, CardHeader, CardSelection } from '@slotted/react/card';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const METHODS = [
  { id: 'standard', name: 'Standard', note: '5 to 7 days, free', available: true },
  { id: 'express', name: 'Express', note: '2 days, $12.00', available: true },
  { id: 'same-day', name: 'Same day', note: 'Not offered for this address', available: false },
];

export default function CardChoice() {
  const [method, setMethod] = useState('standard');

  return (
    <Stack aria-label="Delivery method" gap={3} role="radiogroup">
      {METHODS.map((option) => (
        <Card
          disabled={!option.available}
          key={option.id}
          render={(props) => <label {...props} />}
          selected={method === option.id}
        >
          <CardHeader>
            <CardSelection>
              <input
                checked={method === option.id}
                disabled={!option.available}
                name="delivery"
                onChange={() => {
                  setMethod(option.id);
                }}
                type="radio"
                value={option.id}
              />
            </CardSelection>
            <Text size="lg" weight="semibold">
              {option.name}
            </Text>
            <Text size="sm" tone="muted">
              {option.note}
            </Text>
          </CardHeader>
        </Card>
      ))}
    </Stack>
  );
}
