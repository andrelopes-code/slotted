import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/action-sheet/contract.json';
import { SlottedProvider } from '../i18n';
import { ActionSheet } from './action-sheet';
import { ActionSheetDefaultsProvider } from './action-sheet-defaults';
import {
  ActionSheetCancel,
  ActionSheetContent,
  ActionSheetGroup,
  ActionSheetHeader,
  ActionSheetItem,
  ActionSheetList,
  ActionSheetMessage,
  ActionSheetSeparator,
  ActionSheetTitle,
  ActionSheetTrigger,
} from './action-sheet-parts';
import type {
  ActionSheetChangeRequest,
  ActionSheetHandle,
  ActionSheetProps,
} from './action-sheet.types';

function Share({
  danger = false,
  cancel = true,
  ...props
}: Partial<ActionSheetProps> & { danger?: boolean; cancel?: boolean }) {
  return (
    <ActionSheet {...props}>
      <ActionSheetTrigger>Share</ActionSheetTrigger>
      <ActionSheetContent>
        <ActionSheetHeader>
          <ActionSheetTitle>Share report</ActionSheetTitle>
          <ActionSheetMessage>Recipients see today's version.</ActionSheetMessage>
        </ActionSheetHeader>
        <ActionSheetList>
          {danger ? (
            <ActionSheetItem value="delete" tone="danger">
              Delete draft
            </ActionSheetItem>
          ) : null}
          <ActionSheetItem value="copy">Copy link</ActionSheetItem>
          <ActionSheetGroup label="Export">
            <ActionSheetItem value="pdf" description="14 pages">
              Download PDF
            </ActionSheetItem>
            <ActionSheetItem value="csv" disabled>
              Download CSV
            </ActionSheetItem>
          </ActionSheetGroup>
          <ActionSheetSeparator />
          <ActionSheetItem value="open">Open in browser</ActionSheetItem>
        </ActionSheetList>
        {cancel ? <ActionSheetCancel>Cancel</ActionSheetCancel> : null}
      </ActionSheetContent>
    </ActionSheet>
  );
}

const items = () => screen.getAllByRole('menuitem');
const open = () => fireEvent.click(screen.getByRole('button', { name: 'Share' }));

describe('ActionSheet', () => {
  it('renders the anatomy the contract declares, under the family identifier', () => {
    render(<Share defaultOpen />);
    const root = document.querySelector("[data-ui='action-sheet']");
    expect(root).not.toBeNull();
    const parts = new Set(
      [...document.querySelectorAll('[data-part]')].map((node) => node.getAttribute('data-part')),
    );
    for (const part of contract.members['action-sheet'].parts) {
      if (part === 'icon') continue;
      expect(parts.has(part), part).toBe(true);
    }
  });

  it('is a modal dialog, named and described, holding a named menu', () => {
    render(<Share defaultOpen />);
    const dialog = screen.getByRole('dialog', { name: 'Share report' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription("Recipients see today's version.");
    expect(screen.getByRole('menu', { name: 'Share report' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('wires the trigger to the panel it opens', () => {
    render(<Share />);
    const trigger = screen.getByRole('button', { name: 'Share' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    open();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', screen.getByRole('dialog').id);
  });

  it('enters on the first action that can run', () => {
    render(<Share />);
    open();
    expect(document.activeElement).toBe(items()[0]);
    expect(items()[0]).toHaveAttribute('tabindex', '0');
    expect(items()[1]).toHaveAttribute('tabindex', '-1');
  });

  it('enters on the cancel when the first action is destructive', () => {
    render(<Share danger />);
    open();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('enters on the first safe action when a destructive sheet has no cancel', () => {
    render(<Share danger cancel={false} />);
    open();
    expect(document.activeElement).toHaveTextContent('Copy link');
  });

  it('closes with select, carrying the chosen value, after onSelect runs', () => {
    const onOpenChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <ActionSheet defaultOpen onOpenChange={onOpenChange}>
        <ActionSheetContent aria-label="Actions">
          <ActionSheetList aria-label="Actions">
            <ActionSheetItem value="copy" onSelect={onSelect}>
              Copy link
            </ActionSheetItem>
          </ActionSheetList>
        </ActionSheetContent>
      </ActionSheet>,
    );
    fireEvent.click(items()[0]!);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'copy' }));
    const request = onOpenChange.mock.calls[0]?.[1] as ActionSheetChangeRequest;
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
    expect(request.reason).toBe('select');
    expect(request.result).toBe('copy');
  });

  it('keeps the sheet open when onSelect prevents it, or when closeOnSelect is false', () => {
    const onOpenChange = vi.fn();
    render(
      <ActionSheet defaultOpen onOpenChange={onOpenChange}>
        <ActionSheetContent aria-label="Actions">
          <ActionSheetList aria-label="Actions">
            <ActionSheetItem onSelect={(event) => event.preventDefault()}>First</ActionSheetItem>
            <ActionSheetItem closeOnSelect={false}>Second</ActionSheetItem>
          </ActionSheetList>
        </ActionSheetContent>
      </ActionSheet>,
    );
    fireEvent.click(items()[0]!);
    fireEvent.click(items()[1]!);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('refuses a disabled or loading item, which stays focusable', () => {
    const onSelect = vi.fn();
    render(
      <ActionSheet defaultOpen>
        <ActionSheetContent aria-label="Actions">
          <ActionSheetList aria-label="Actions">
            <ActionSheetItem disabled onSelect={onSelect}>
              Disabled
            </ActionSheetItem>
            <ActionSheetItem loading onSelect={onSelect}>
              Exporting
            </ActionSheetItem>
          </ActionSheetList>
        </ActionSheetContent>
      </ActionSheet>,
    );
    const [disabled, loading] = items();
    fireEvent.click(disabled!);
    fireEvent.click(loading!);
    expect(onSelect).not.toHaveBeenCalled();
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(disabled).not.toHaveAttribute('disabled');
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(loading).toHaveAttribute('data-loading');
    expect(loading?.querySelector("[data-part='icon'] [data-ui='spinner']")).not.toBeNull();
  });

  it('closes with dismiss from the cancel, and returns focus to the trigger', () => {
    const onOpenChange = vi.fn();
    render(<Share onOpenChange={onOpenChange} />);
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'dismiss' }),
    );
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Share' }));
  });

  it('closes with escape, and refuses it under escape="none"', () => {
    const onOpenChange = vi.fn();
    const { unmount } = render(<Share defaultOpen onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'escape' }),
    );
    unmount();

    const refused = vi.fn();
    render(<Share defaultOpen escape="none" onOpenChange={refused} />);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(refused).not.toHaveBeenCalled();
  });

  it('moves with the arrows, Home and End, disabled items included', () => {
    render(<Share defaultOpen />);
    const list = items();
    list[0]!.focus();
    fireEvent.keyDown(list[0]!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(list[1]);
    fireEvent.keyDown(list[1]!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(list[2]);
    fireEvent.keyDown(list[2]!, { key: 'End' });
    expect(document.activeElement).toBe(list[3]);
    fireEvent.keyDown(list[3]!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(list[0]);
    fireEvent.keyDown(list[0]!, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(list[3]);
    fireEvent.keyDown(list[3]!, { key: 'Home' });
    expect(document.activeElement).toBe(list[0]);
  });

  it('moves to the item whose label begins with the character typed', () => {
    render(<Share defaultOpen />);
    items()[0]!.focus();
    fireEvent.keyDown(items()[0]!, { key: 'o' });
    expect(document.activeElement).toHaveTextContent('Open in browser');
  });

  it('asks before it opens, and a controlled sheet waits for the consumer', () => {
    const onOpenChange = vi.fn((_: boolean, request: ActionSheetChangeRequest) => request.cancel());
    render(<Share onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }), { detail: 1 });
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'pointer' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    function Controlled() {
      const [value, setValue] = useState(false);
      return <Share open={value} onOpenChange={(next) => setValue(next)} />;
    }
    render(<Controlled />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Share' })[1]!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('paints no scrim and keeps the page live while not modal', () => {
    render(
      <>
        <button type="button">Outside</button>
        <Share defaultOpen modal={false} />
      </>,
    );
    const root = document.querySelector("[data-ui='action-sheet']");
    expect(root).not.toHaveAttribute('data-modal');
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
    expect(screen.getByRole('button', { name: 'Outside' }).closest('[inert]')).toBeNull();
  });

  it('reads its defaults from the provider, and an explicit prop still wins', () => {
    render(
      <ActionSheetDefaultsProvider modal={false}>
        <ActionSheet defaultOpen modal>
          <ActionSheetContent aria-label="Actions">
            <ActionSheetList aria-label="Actions">
              <ActionSheetItem>One</ActionSheetItem>
            </ActionSheetList>
            <ActionSheetCancel />
          </ActionSheetContent>
        </ActionSheet>
      </ActionSheetDefaultsProvider>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('speaks the language in force, and lays its own messages over it', () => {
    const sheet = (messages?: { cancel: string }) => (
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <ActionSheet defaultOpen messages={messages}>
          <ActionSheetContent aria-label="Actions">
            <ActionSheetList aria-label="Actions">
              <ActionSheetItem>One</ActionSheetItem>
            </ActionSheetList>
            <ActionSheetCancel />
          </ActionSheetContent>
        </ActionSheet>
      </SlottedProvider>
    );
    const { rerender } = render(sheet());
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();

    rerender(sheet({ cancel: 'Dismiss' }));
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it("runs the consumer's handler first, and preventDefault refuses the family's", () => {
    const onOpenChange = vi.fn();
    render(
      <ActionSheet defaultOpen onOpenChange={onOpenChange}>
        <ActionSheetContent aria-label="Actions">
          <ActionSheetList aria-label="Actions">
            <ActionSheetItem onClick={(event) => event.preventDefault()}>One</ActionSheetItem>
          </ActionSheetList>
        </ActionSheetContent>
      </ActionSheet>,
    );
    fireEvent.click(items()[0]!);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('opens and closes through the handle, with the reason programmatic', () => {
    const onOpenChange = vi.fn();
    const handle = createRef<ActionSheetHandle>();
    render(<Share onOpenChange={onOpenChange} ref={handle} />);
    act(() => handle.current?.open());
    expect(onOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'programmatic' }),
    );
    act(() => handle.current?.close());
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'programmatic' }),
    );
  });

  it('renders an item as another element through render, keeping role and keyboard', () => {
    render(
      <ActionSheet defaultOpen>
        <ActionSheetContent aria-label="Actions">
          <ActionSheetList aria-label="Actions">
            <ActionSheetItem
              render={({ ref, type: _type, ...props }) => <a {...props} ref={ref} href="#help" />}
            >
              Help
            </ActionSheetItem>
          </ActionSheetList>
        </ActionSheetContent>
      </ActionSheet>,
    );
    const link = screen.getByRole('menuitem', { name: 'Help' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('data-part', 'item');
  });
});
