import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Glyph, Icon } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';
import { Tree } from '@slotted/react/tree';
import { Text } from '@slotted/react/typography';

interface Scope {
  id: string;
  name: string;
  locked?: boolean;
  children?: Scope[];
}

const SCOPES: Scope[] = [
  {
    id: 'orders',
    name: 'Orders',
    children: [
      { id: 'orders.view', name: 'View orders' },
      { id: 'orders.edit', name: 'Edit orders' },
      { id: 'orders.refund', name: 'Issue refunds' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    children: [
      { id: 'finance.invoices', name: 'View invoices' },
      { id: 'finance.payouts', name: 'Approve payouts', locked: true },
    ],
  },
  { id: 'reports', name: 'Reports' },
];

export default function TreeAccessEditor() {
  const [query, setQuery] = useState('');
  const [granted, setGranted] = useState<readonly string[]>(['orders.view', 'finance.invoices']);
  const [saved, setSaved] = useState(granted);
  const permissions = granted.filter((key) => key.includes('.') || key === 'reports').length;

  return (
    <Stack gap={3}>
      <TextField
        aria-label="Find a permission"
        clearable
        onValueChange={(next) => setQuery(next)}
        start={
          <Icon>
            <Glyph name="search" />
          </Icon>
        }
        type="search"
        value={query}
      />
      <Tree
        aria-label="Permissions of the support role"
        emptyContent="No permission matches"
        expandOn="expander"
        variant="framed"
        selectionCascade="descendants"
        selectionMode="multiple"
        defaultExpandedKeys={['orders', 'finance']}
        isNodeDisabled={(scope) => scope.locked === true}
        onValueChange={(next) => setGranted(next as readonly string[])}
        query={query}
        value={granted}
        renderCells={(scope) => ({ description: scope.locked ? 'Owners only' : undefined })}
        nodes={SCOPES}
        getKey={(scope) => scope.id}
        getLabel={(scope) => scope.name}
        getChildren={(scope) => scope.children}
      />
      <Inline align="center" gap={3}>
        <Button disabled={saved === granted} onClick={() => setSaved(granted)}>
          Save role
        </Button>
        <Text role="status" size="sm" tone="muted">
          {permissions} permissions granted
        </Text>
      </Inline>
    </Stack>
  );
}
