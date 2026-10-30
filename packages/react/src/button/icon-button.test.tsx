import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../menu';
import { IconButton } from './icon-button';

const defaults = contract.members.iconButton.defaults;

describe('IconButton', () => {
  it('is a square button with an explicit name and the family identity', () => {
    render(
      <IconButton aria-label="Add member">
        <svg />
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Add member' });

    expect(button.localName).toBe(contract.members.iconButton.nativeElement);
    expect(button).toHaveAttribute('data-ui', contract.ui);
    expect(button).toHaveAttribute('data-part', 'root');
    expect(button).toHaveAttribute('data-shape', defaults.shape);
    expect(button).toHaveAttribute('data-tone', defaults.tone);
    expect(button).toHaveAttribute('data-variant', defaults.variant);
    expect(button.querySelector('[data-part="icon"]')).not.toBeNull();
  });

  it('takes its name from aria-labelledby as well', () => {
    render(
      <>
        <span id="refresh">Refresh the report</span>
        <IconButton aria-labelledby="refresh">
          <svg />
        </IconButton>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Refresh the report' })).not.toBeNull();
  });

  /**
   * A plain icon button that announced `aria-pressed` would be announcing a
   * state it does not have, so the attribute waits for the consumer to pass
   * either half of the state model.
   */
  it('is not a toggle until the consumer says it is', () => {
    render(
      <IconButton aria-label="Add">
        <svg />
      </IconButton>,
    );

    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed');
    expect(screen.getByRole('button')).not.toHaveAttribute('data-pressed');
  });

  it('owns its state when only the initial value is given', () => {
    render(
      <IconButton aria-label="Bold" defaultPressed={false}>
        <svg />
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Bold' });

    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-pressed', '');
  });

  it('never moves state the consumer owns', () => {
    const onPressedChange = vi.fn();
    render(
      <IconButton aria-label="Bold" onPressedChange={onPressedChange} pressed={false}>
        <svg />
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Bold' });

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(onPressedChange).toHaveBeenCalledOnce();
    expect(onPressedChange.mock.calls[0]?.[0]).toBe(true);
  });

  it('carries the reason, the value it replaces and the originating event', () => {
    const onPressedChange = vi.fn();
    render(
      <IconButton aria-label="Bold" defaultPressed onPressedChange={onPressedChange}>
        <svg />
      </IconButton>,
    );

    fireEvent.click(screen.getByRole('button'), { detail: 1 });
    const request = onPressedChange.mock.calls[0]?.[1];
    expect(request.value).toBe(false);
    expect(request.previous).toBe(true);
    expect(request.reason).toBe('pointer');
    expect(request.source).toBeDefined();
  });

  it('tells a keyboard activation from a pointer one', () => {
    const onPressedChange = vi.fn();
    render(
      <IconButton aria-label="Bold" defaultPressed={false} onPressedChange={onPressedChange}>
        <svg />
      </IconButton>,
    );

    fireEvent.click(screen.getByRole('button'), { detail: 0 });
    expect(onPressedChange.mock.calls[0]?.[1].reason).toBe('keyboard');
  });

  it('commits nothing when the request is cancelled', () => {
    render(
      <IconButton
        aria-label="Bold"
        defaultPressed={false}
        onPressedChange={(_pressed, request) => request.cancel()}
      >
        <svg />
      </IconButton>,
    );
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  /**
   * The name is an attribute, so it survives the wait untouched. The ring goes
   * into the glyph's own box — already the size of it — and the glyph fades
   * under it, so the control does not change size.
   */
  it('waits without losing its name, and refuses activation while it does', () => {
    const onClick = vi.fn();
    render(
      <IconButton
        aria-label="Refresh"
        loading
        messages={{ loading: 'Refreshing' }}
        onClick={onClick}
      >
        <svg data-testid="glyph" />
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Refresh' });

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-loading', '');
    expect(button).not.toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();

    const icon = button.querySelector('[data-part="icon"]');
    expect(icon?.querySelector('[data-testid="glyph"]')).not.toBeNull();
    expect(icon).toContainElement(screen.getByRole('progressbar', { name: 'Refreshing' }));
  });

  it('can be unavailable and still reachable by keyboard', () => {
    render(
      <IconButton aria-label="Delete" disabled focusableWhenDisabled>
        <svg />
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Delete' });

    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    button.focus();
    expect(button).toHaveFocus();
  });

  it('does not move a toggle that is still working', () => {
    render(
      <IconButton aria-label="Refresh" defaultPressed={false} loading>
        <svg />
      </IconButton>,
    );
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('takes the shape the consumer asked for', () => {
    render(
      <IconButton aria-label="Add" shape="circle">
        <svg />
      </IconButton>,
    );

    expect(screen.getByRole('button')).toHaveAttribute('data-shape', 'circle');
  });

  /**
   * A trigger hands its root every attribute a button can carry, so its props
   * type `aria-labelledby` as an optional string. The icon button has to take
   * them as they are: the family's own docs offer it as the trigger a toolbar
   * or an action bar overflows into. What the type holds is that a name
   * exists, not that only one attribute could have given it.
   */
  it("takes a trigger's props whole, and still requires a name", () => {
    render(
      <Menu>
        <MenuTrigger
          render={(props) => (
            <IconButton {...props} aria-label="More actions">
              <svg />
            </IconButton>
          )}
        />
        <MenuContent>
          <MenuItem>Archive</MenuItem>
        </MenuContent>
      </Menu>,
    );

    expect(screen.getByRole('button', { name: 'More actions' })).toHaveAttribute(
      'aria-haspopup',
      'menu',
    );

    void (
      (
        // @ts-expect-error -- an icon carries no text, so a name is required.
        <IconButton>
          <svg />
        </IconButton>
      )
    );
  });
});
