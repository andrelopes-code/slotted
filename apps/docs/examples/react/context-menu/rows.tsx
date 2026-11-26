import { useState } from 'react';
import { ContextMenu, ContextMenuTrigger } from '@slotted/react/context-menu';
import { MenuContent, MenuItem, MenuSeparator } from '@slotted/react/menu';
import type { MenuChangeRequest } from '@slotted/react/menu';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const FILES = [
  { name: 'Supplier contract.docx', size: '180 KB' },
  { name: 'Stock count March.xlsx', size: '640 KB' },
  { name: 'Carrier rates 2026.pdf', size: '2.1 MB' },
];

export default function ContextMenuRows() {
  const [file, setFile] = useState<string | null>(null);

  function handleOpenChange(open: boolean, request: MenuChangeRequest) {
    if (open) setFile(fileOf(request.source));
  }

  return (
    <Stack gap={3}>
      <ContextMenu onOpenChange={handleOpenChange}>
        <ContextMenuTrigger>
          <Stack gap={3}>
            {FILES.map((entry) => (
              <Text data-file={entry.name} key={entry.name}>
                {entry.name} · {entry.size}
              </Text>
            ))}
          </Stack>
        </ContextMenuTrigger>
        <MenuContent aria-label={file ?? 'File actions'}>
          <MenuItem>Open</MenuItem>
          <MenuItem>Download</MenuItem>
          <MenuSeparator />
          <MenuItem tone="danger">Move to trash</MenuItem>
        </MenuContent>
      </ContextMenu>
      <Text size="sm" tone="muted">
        {file === null ? 'Right-click a file.' : `The menu acts on ${file}.`}
      </Text>
    </Stack>
  );
}

function fileOf(source: unknown): string | null {
  const target = (source as Event | undefined)?.target;
  const row = target instanceof Element ? target.closest('[data-file]') : null;

  return row?.getAttribute('data-file') ?? null;
}
