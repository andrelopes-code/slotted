import { Grid } from '@slotted/react/grid';
import { Stack } from '@slotted/react/stack';
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

export default function TreeStates() {
  return (
    <Grid columns={2} gap={6} minItemWidth="xs">
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          One node disabled
        </Text>
        <Tree
          aria-label="Permissions, one node disabled"
          isNodeDisabled={(scope) => scope.locked === true}
          selectionMode="multiple"
          defaultExpandedKeys={['finance']}
          defaultValue={['finance.invoices']}
          nodes={SCOPES}
          getKey={(scope) => scope.id}
          getLabel={(scope) => scope.name}
          getChildren={(scope) => scope.children}
        />
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          Read only
        </Text>
        <Tree
          aria-label="Permissions, read only"
          readOnly
          selectionMode="multiple"
          defaultExpandedKeys={['finance']}
          defaultValue={['finance.invoices']}
          nodes={SCOPES}
          getKey={(scope) => scope.id}
          getLabel={(scope) => scope.name}
          getChildren={(scope) => scope.children}
        />
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          Disabled
        </Text>
        <Tree
          aria-label="Permissions, disabled"
          disabled
          selectionMode="multiple"
          defaultExpandedKeys={['finance']}
          defaultValue={['finance.invoices']}
          nodes={SCOPES}
          getKey={(scope) => scope.id}
          getLabel={(scope) => scope.name}
          getChildren={(scope) => scope.children}
        />
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          Invalid
        </Text>
        <Tree
          aria-label="Permissions, invalid"
          invalid
          variant="framed"
          selectionMode="multiple"
          defaultExpandedKeys={['finance']}
          defaultValue={['finance.invoices']}
          nodes={SCOPES}
          getKey={(scope) => scope.id}
          getLabel={(scope) => scope.name}
          getChildren={(scope) => scope.children}
        />
      </Stack>
    </Grid>
  );
}
