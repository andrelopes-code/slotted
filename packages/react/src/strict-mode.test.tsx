import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import { describe, expect, it } from 'vitest';

import { ActionSheet } from './action-sheet/action-sheet';
import {
  ActionSheetContent,
  ActionSheetItem,
  ActionSheetList,
  ActionSheetTrigger,
} from './action-sheet/action-sheet-parts';
import { CommandPalette } from './command-palette/command-palette';
import type { CommandPaletteHandle } from './command-palette/command-palette.types';

/**
 * StrictMode runs every effect twice in development — mount, unmount, mount —
 * and a layer whose portal is torn down by the first cleanup must be written
 * again by the second mount.
 */
describe('layers under StrictMode', () => {
  it('mounts the command palette dialog', async () => {
    render(
      <StrictMode>
        <CommandPalette defaultOpen items={[{ id: 'a', label: 'A' }]} />
      </StrictMode>,
    );
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
  });

  it('mounts the command palette dialog opened after mount', async () => {
    const ref = createRef<CommandPaletteHandle>();
    render(
      <StrictMode>
        <CommandPalette items={[{ id: 'a', label: 'A' }]} ref={ref} />
      </StrictMode>,
    );
    await act(async () => ref.current?.open());
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
  });

  it('mounts the action sheet menu opened by its trigger', async () => {
    render(
      <StrictMode>
        <ActionSheet>
          <ActionSheetTrigger>Share</ActionSheetTrigger>
          <ActionSheetContent>
            <ActionSheetList>
              <ActionSheetItem value="copy">Copy</ActionSheetItem>
            </ActionSheetList>
          </ActionSheetContent>
        </ActionSheet>
      </StrictMode>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() => expect(screen.getByRole('menu')).toBeTruthy());
  });

  it('mounts the action sheet menu', async () => {
    render(
      <StrictMode>
        <ActionSheet defaultOpen>
          <ActionSheetContent>
            <ActionSheetList>
              <ActionSheetItem value="copy">Copy</ActionSheetItem>
            </ActionSheetList>
          </ActionSheetContent>
        </ActionSheet>
      </StrictMode>,
    );
    await waitFor(() => expect(screen.getByRole('menu')).toBeTruthy());
  });
});
