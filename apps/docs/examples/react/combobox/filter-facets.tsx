import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Inline } from '@slotted/react/inline';
import { Text } from '@slotted/react/typography';

type Facet = 'warehouse' | 'carrier' | 'owner';

const WAREHOUSES = ['Reno, NV', 'Columbus, OH', 'Savannah, GA'];
const CARRIERS = ['UPS', 'FedEx', 'DHL', 'USPS'];
const OWNERS = ['Avery Collins', 'Kenji Watanabe', 'Lucía Fernández', 'Omar Haddad'];

const FACETS: { id: Facet; label: string; options: string[] }[] = [
  { id: 'warehouse', label: 'Warehouse', options: WAREHOUSES },
  { id: 'carrier', label: 'Carrier', options: CARRIERS },
  { id: 'owner', label: 'Owner', options: OWNERS },
];

/** Open orders, counted per warehouse, carrier and owner. */
const ORDERS = WAREHOUSES.flatMap((warehouse, w) =>
  CARRIERS.flatMap((carrier, c) =>
    OWNERS.map((owner, o) => ({ warehouse, carrier, owner, count: 1 + ((w + 2 * c + 3 * o) % 5) })),
  ),
);
const TOTAL = ORDERS.reduce((sum, row) => sum + row.count, 0);

const NONE: Record<Facet, string | null> = { warehouse: null, carrier: null, owner: null };
const EMPTY: Record<Facet, string> = { warehouse: '', carrier: '', owner: '' };

export default function ComboboxFilterFacets() {
  const [chosen, setChosen] = useState(NONE);
  const [texts, setTexts] = useState(EMPTY);

  const matching = ORDERS.filter((row) =>
    FACETS.every((facet) => chosen[facet.id] === null || row[facet.id] === chosen[facet.id]),
  ).reduce((sum, row) => sum + row.count, 0);
  const active = FACETS.filter((facet) => chosen[facet.id] !== null).length;

  const clear = () => {
    setChosen(NONE);
    setTexts(EMPTY);
  };

  return (
    <Inline gap={2} align="center" wrap="wrap">
      {FACETS.map((facet) => (
        <Combobox
          key={facet.id}
          size="sm"
          fullWidth={false}
          width="content"
          value={chosen[facet.id]}
          onValueChange={(next) => setChosen((held) => ({ ...held, [facet.id]: next }))}
          inputValue={texts[facet.id]}
          onInputValueChange={(next) => setTexts((held) => ({ ...held, [facet.id]: next }))}
        >
          <ComboboxInput aria-label={facet.label} placeholder={facet.label} />
          <ComboboxContent aria-label={facet.label}>
            {facet.options.map((option) => (
              <ComboboxItem key={option} value={option}>
                {option}
              </ComboboxItem>
            ))}
          </ComboboxContent>
        </Combobox>
      ))}
      <Button size="sm" variant="ghost" disabled={active === 0} onClick={clear}>
        Clear filters
      </Button>
      <Text size="sm" tone="muted">
        {matching} of {TOTAL} orders
      </Text>
    </Inline>
  );
}
