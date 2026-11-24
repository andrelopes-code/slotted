import { useState } from 'react';
import { Tree } from '@slotted/react/tree';

interface Account {
  id: string;
  name: string;
  orders?: number;
  children?: Account[];
}

const ACCOUNTS: Account[] = [
  { id: 'contoso', name: 'Contoso Foods', orders: 3 },
  { id: 'fabrikam', name: 'Fabrikam Supply', orders: 2 },
  { id: 'atlas', name: 'Atlas Freight' },
];

const ORDERS: Record<string, Account[]> = {
  contoso: [
    { id: 'SO-10482', name: 'SO-10482' },
    { id: 'SO-10496', name: 'SO-10496' },
    { id: 'SO-10511', name: 'SO-10511' },
  ],
  fabrikam: [
    { id: 'SO-10484', name: 'SO-10484' },
    { id: 'SO-10502', name: 'SO-10502' },
  ],
};

export default function TreeLazy() {
  const [accounts, setAccounts] = useState(ACCOUNTS);
  const [open, setOpen] = useState<readonly string[]>([]);
  const [pending, setPending] = useState<readonly string[]>([]);

  function handleOpen(keys: readonly string[]) {
    setOpen(keys);
    for (const key of keys.filter((candidate) => !open.includes(candidate))) fetchOrders(key);
  }

  function fetchOrders(key: string) {
    const account = accounts.find((candidate) => candidate.id === key);
    if (account === undefined || account.children !== undefined || pending.includes(key)) return;

    setPending((current) => [...current, key]);
    setTimeout(() => {
      setAccounts((current) =>
        current.map((entry) =>
          entry.id === key ? { ...entry, children: ORDERS[key] ?? [] } : entry,
        ),
      );
      setPending((current) => current.filter((candidate) => candidate !== key));
    }, 1200);
  }

  return (
    <Tree
      aria-label="Orders by account"
      expandedKeys={open}
      onExpandedKeysChange={(keys) => handleOpen(keys)}
      getChildrenCount={(account) => account.orders}
      hasChildren={(account) => account.orders !== undefined}
      isNodeLoading={(account) => pending.includes(account.id)}
      nodes={accounts}
      getKey={(account) => account.id}
      getLabel={(account) => account.name}
      getChildren={(account) => account.children}
    />
  );
}
