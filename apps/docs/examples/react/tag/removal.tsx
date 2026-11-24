import { Tag, TagGroup } from '@slotted/react/tag';
import { Text } from '@slotted/react/typography';
import { useState } from 'react';

const LABELS = ['Wholesale', 'Fragile', 'Priority shipping', 'Gift wrap'];

export default function TagRemoval() {
  const [labels, setLabels] = useState(LABELS);

  function handleRemove(label: string) {
    setLabels((current) => current.filter((item) => item !== label));
  }

  return (
    <>
      <TagGroup aria-label="Labels on order SO-10482">
        {labels.map((label) => (
          <Tag key={label} onRemove={() => handleRemove(label)}>
            {label}
          </Tag>
        ))}
      </TagGroup>

      {labels.length === 0 && (
        <Text size="sm" tone="muted">
          No labels on this order.
        </Text>
      )}
    </>
  );
}
