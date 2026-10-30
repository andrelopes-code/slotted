import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/menubar/contract.json';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../menu';
import { Menubar } from './menubar';
import type { MenubarProps } from './menubar.types';

function Bar(props: Partial<MenubarProps>) {
  return (
    <Menubar aria-label="Main" {...props}>
      <Menu value="file">
        <MenuTrigger>File</MenuTrigger>
        <MenuContent>
          <MenuItem>New</MenuItem>
          <MenuItem>Open</MenuItem>
        </MenuContent>
      </Menu>
      <Menu value="edit">
        <MenuTrigger>Edit</MenuTrigger>
        <MenuContent>
          <MenuItem>Undo</MenuItem>
        </MenuContent>
      </Menu>
      <Menu value="view">
        <MenuTrigger>View</MenuTrigger>
        <MenuContent>
          <MenuItem>Zoom in</MenuItem>
        </MenuContent>
      </Menu>
    </Menubar>
  );
}

const trigger = (name: string) => screen.getByRole('menuitem', { name });

const press = (key: string) => fireEvent.keyDown(document.activeElement ?? document.body, { key });

describe('Menubar', () => {
  it('carries the role and the identifier the contract declares', () => {
    render(<Bar />);
    const bar = screen.getByRole('menubar', { name: 'Main' });

    expect(bar).toHaveAttribute('data-ui', contract.ui);
    expect(bar).toHaveAttribute('data-part', 'root');
    expect(trigger('File')).toHaveAttribute('data-part', 'trigger');
    expect(trigger('File')).toHaveAttribute('aria-haspopup', 'menu');
  });

  /** One tab stop for the whole bar, which is what makes it a bar. */
  it('is one tab stop', async () => {
    render(<Bar />);

    await waitFor(() => expect(trigger('File')).toHaveAttribute('tabindex', '0'));
    expect(trigger('Edit')).toHaveAttribute('tabindex', '-1');
    expect(trigger('View')).toHaveAttribute('tabindex', '-1');
  });

  it('moves between triggers on its own axis, and wraps', async () => {
    render(<Bar />);
    await waitFor(() => expect(trigger('File')).toHaveAttribute('tabindex', '0'));

    trigger('File').focus();
    press('ArrowRight');
    expect(trigger('Edit')).toHaveFocus();

    press('End');
    expect(trigger('View')).toHaveFocus();

    press('ArrowRight');
    expect(trigger('File')).toHaveFocus();
  });

  it('opens the menu a trigger names, and switches to another', async () => {
    render(<Bar />);

    fireEvent.click(trigger('File'), { detail: 1 });
    await screen.findByRole('menu');
    expect(screen.getByRole('menuitem', { name: 'New' })).toBeInTheDocument();

    fireEvent.click(trigger('Edit'), { detail: 1 });
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'New' })).toBeNull());
    expect(screen.getByRole('menuitem', { name: 'Undo' })).toBeInTheDocument();
  });

  /**
   * The behaviour that separates a menubar from a row of buttons: once one menu
   * is open, moving the pointer along the bar switches menus without a press.
   */
  it('switches menus on pointer entry once one is open', async () => {
    render(<Bar />);

    fireEvent.pointerEnter(trigger('Edit'));
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(trigger('File'), { detail: 1 });
    await screen.findByRole('menu');

    fireEvent.pointerEnter(trigger('Edit'));
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Undo' })).toBeInTheDocument());
  });

  /**
   * The pattern's three-step rule, with the recommended half of its choice: the
   * neighbour's menu opens and focus stays on the trigger, so the next arrow
   * keeps moving along the bar.
   */
  it('steps to the next menu from inside an open one', async () => {
    render(<Bar />);

    fireEvent.click(trigger('File'), { detail: 1 });
    await screen.findByRole('menu');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'New' })).toHaveFocus());

    press('ArrowRight');

    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Undo' })).toBeInTheDocument());
    /* The surface it left stays mounted for its own exit, which is what
       `presence` is for, and is gone once that has run. */
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'New' })).toBeNull());
    expect(trigger('Edit')).toHaveFocus();
  });

  it('steps back the other way from inside an open menu', async () => {
    render(<Bar defaultValue="edit" />);
    await screen.findByRole('menu');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Undo' })).toHaveFocus());

    press('ArrowLeft');

    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'New' })).toBeInTheDocument());
    expect(trigger('File')).toHaveFocus();
  });

  it('holds the identity of the open menu, and reports every change', async () => {
    const onValueChange = vi.fn();
    render(<Bar value="file" onValueChange={onValueChange} />);

    await screen.findByRole('menu');
    expect(screen.getByRole('menuitem', { name: 'New' })).toBeInTheDocument();

    fireEvent.click(trigger('Edit'), { detail: 1 });

    expect(onValueChange).toHaveBeenCalledWith(
      'edit',
      expect.objectContaining({ reason: 'pointer' }),
    );
    /* The consumer holds the value, so the bar waits rather than moving. */
    expect(screen.getByRole('menuitem', { name: 'New' })).toBeInTheDocument();
  });

  it('closes on Escape and leaves focus on the trigger', async () => {
    render(<Bar />);

    fireEvent.click(trigger('File'), { detail: 1 });
    await screen.findByRole('menu');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'New' })).toHaveFocus());

    press('Escape');

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(trigger('File')).toHaveFocus();
  });

  it('states its orientation only when it is the one the role does not assume', () => {
    const { rerender } = render(<Bar />);
    expect(screen.getByRole('menubar')).not.toHaveAttribute('aria-orientation');

    rerender(<Bar orientation="vertical" />);
    expect(screen.getByRole('menubar')).toHaveAttribute('aria-orientation', 'vertical');
    expect(screen.getByRole('menubar')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('moves along the bar to the trigger a printable character names', async () => {
    render(<Bar />);
    await waitFor(() => expect(trigger('File')).toHaveAttribute('tabindex', '0'));

    trigger('File').focus();
    press('v');

    expect(trigger('View')).toHaveFocus();
  });

  it('opens nothing while the bar is disabled', async () => {
    render(<Bar disabled />);

    fireEvent.click(trigger('File'), { detail: 1 });
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });
});
