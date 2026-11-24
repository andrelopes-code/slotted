import { Inline } from '@slotted/react/inline';
import { Link } from '@slotted/react/link';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';
import { useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

const VIEWS = [
  { href: '#orders', label: 'Orders' },
  { href: '#shipments', label: 'Shipments' },
  { href: '#returns', label: 'Returns' },
] as const;

interface RouterLinkProps {
  children: ReactNode;
  current: boolean;
  href: string;
  onNavigate: (href: string) => void;
}

export default function LinkRouter() {
  const [path, setPath] = useState<string>(VIEWS[0].href);
  const label = VIEWS.find((view) => view.href === path)?.label;

  return (
    <Stack gap={3}>
      <nav aria-label="Workspace">
        <Inline gap={4}>
          {VIEWS.map((view) => (
            <RouterLink
              current={view.href === path}
              href={view.href}
              key={view.href}
              onNavigate={setPath}
            >
              {view.label}
            </RouterLink>
          ))}
        </Inline>
      </nav>
      <Text size="sm" tone="muted">
        Showing {label}.
      </Text>
    </Stack>
  );
}

function RouterLink({ children, current, href, onNavigate }: RouterLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    onNavigate(href);
  }

  return (
    <Link
      aria-current={current ? 'page' : undefined}
      href={href}
      render={(props) => <a {...props} onClick={handleClick} />}
      underline="hover"
    >
      {children}
    </Link>
  );
}
