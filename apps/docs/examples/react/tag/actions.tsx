import { TagButton, TagGroup, TagLink } from '@slotted/react/tag';
import { useState } from 'react';

const CARRIERS = [
  { name: 'Northwind Freight', href: '#northwind-freight' },
  { name: 'Harbor Line', href: '#harbor-line' },
  { name: 'Blue Route', href: '#blue-route' },
  { name: 'Summit Cargo', href: '#summit-cargo' },
  { name: 'Delta Parcel', href: '#delta-parcel' },
];

export default function TagActions() {
  const [expanded, setExpanded] = useState(false);

  const shown = expanded ? CARRIERS : CARRIERS.slice(0, 3);
  const hidden = CARRIERS.length - 3;

  return (
    <TagGroup aria-label="Carriers on route 14">
      {shown.map((carrier) => (
        <TagLink key={carrier.name} href={carrier.href}>
          {carrier.name}
        </TagLink>
      ))}
      <TagButton onClick={() => setExpanded(!expanded)} variant="outline">
        {expanded ? 'Show fewer' : `+${hidden} more`}
      </TagButton>
    </TagGroup>
  );
}
