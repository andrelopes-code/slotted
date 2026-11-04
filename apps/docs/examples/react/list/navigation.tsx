import { type MouseEvent, useState } from 'react';

import { List } from '@slotted/react/list';
import { ListItem, ListItemBody, ListItemLabel, ListItemLink } from '@slotted/react/list-item';

const SECTIONS = [
  { href: '#general', name: 'General' },
  { href: '#warehouses', name: 'Warehouses' },
  { href: '#carriers', name: 'Carriers' },
  { href: '#billing', name: 'Billing' },
];

export default function ListNavigation() {
  const [here, setHere] = useState('#warehouses');

  function handleNavigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    event.preventDefault();
    setHere(href);
  }

  return (
    <nav aria-label="Settings">
      <List>
        {SECTIONS.map((section) => (
          <ListItem current={section.href === here ? 'page' : false} key={section.href}>
            <ListItemLink
              href={section.href}
              onClick={(event) => handleNavigate(event, section.href)}
            >
              <ListItemBody>
                <ListItemLabel>{section.name}</ListItemLabel>
              </ListItemBody>
            </ListItemLink>
          </ListItem>
        ))}
      </List>
    </nav>
  );
}
