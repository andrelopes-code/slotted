import { Stack } from '@slotted/react/stack';
import { TagGroup, TagToggle } from '@slotted/react/tag';
import { Text } from '@slotted/react/typography';
import { useState } from 'react';

const FACETS = ['Late', 'Backordered', 'Fragile', 'Gift wrap'];

export default function TagFilters() {
  const [facets, setFacets] = useState(FACETS);
  const [chosen, setChosen] = useState(['Late']);

  function handleSelect(facet: string, selected: boolean) {
    setChosen((current) =>
      selected ? [...current, facet] : current.filter((item) => item !== facet),
    );
  }

  function handleRemove(facet: string) {
    setFacets((current) => current.filter((item) => item !== facet));
    setChosen((current) => current.filter((item) => item !== facet));
  }

  return (
    <Stack gap={3}>
      <TagGroup aria-label="Order filters">
        {facets.map((facet) => (
          <TagToggle
            key={facet}
            onRemove={() => handleRemove(facet)}
            onSelectedChange={(selected) => handleSelect(facet, selected)}
            selected={chosen.includes(facet)}
            tone="accent"
          >
            {facet}
          </TagToggle>
        ))}
      </TagGroup>

      <Text size="sm" tone="muted">
        {chosen.length} of {facets.length} filters applied.
      </Text>
    </Stack>
  );
}
