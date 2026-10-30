import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/split-button/contract.json';
import { ButtonDefaultsProvider } from '../button';
import { Glyph, Icon } from '../icon';
import { MenuContent, MenuItem, MenuRadioItem } from '../menu';
import type { MenuHandle } from '../menu';
import { SplitButton } from './split-button';
import { SplitButtonDefaultsProvider } from './split-button-defaults';
import {
  SplitButtonChoices,
  SplitButtonMenu,
  SplitButtonMenuTrigger,
  SplitButtonPrimary,
} from './split-button-parts';
import type { SplitButtonProps } from './split-button.types';

function Save({
  onSave,
  ...props
}: Partial<SplitButtonProps> & { onSave?: (() => void) | undefined }) {
  return (
    <SplitButton {...props}>
      <SplitButtonPrimary onClick={onSave}>Save</SplitButtonPrimary>
      <SplitButtonMenu>
        <SplitButtonMenuTrigger aria-label="More save options" />
        <MenuContent>
          <MenuItem>Save as draft</MenuItem>
          <MenuItem>Save and close</MenuItem>
        </MenuContent>
      </SplitButtonMenu>
    </SplitButton>
  );
}

const root = () => document.querySelector("[data-ui='split-button']") as HTMLElement;
const primary = () => screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
const trigger = () =>
  screen.getByRole('button', { name: 'More save options' }) as HTMLButtonElement;
const surface = () => document.querySelector("[data-ui='menu'] [role='menu']");

describe('SplitButton', () => {
  it('is a group of two button elements carrying this family’s parts', () => {
    render(<Save className="save" />);

    expect(root().tagName).toBe('DIV');
    expect(root()).toHaveAttribute('role', 'group');
    expect(root()).toHaveAttribute('data-ui', contract.ui);
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(root()).toHaveClass('save');

    expect(primary()).toHaveAttribute('data-ui', 'button');
    expect(primary()).toHaveAttribute('data-part', 'primary');
    expect(primary().querySelector('[data-part="label"]')).toHaveTextContent('Save');

    expect(trigger()).toHaveAttribute('data-ui', 'button');
    expect(trigger()).toHaveAttribute('data-part', 'menu-trigger');
    expect(trigger()).toHaveAttribute('data-shape', 'square');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger().querySelector('[data-part="icon"] > [data-ui="icon"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(
      trigger().querySelector(
        '[data-part="icon"] > [data-ui="icon"] > svg[data-glyph="chevron-down"]',
      ),
    ).not.toBeNull();
    expect(root().children).toHaveLength(2);
  });

  /* The chevron is the default; what the consumer passes replaces it, as popover's close does. */
  it('draws the consumer’s own mark in place of the chevron', () => {
    render(
      <SplitButton>
        <SplitButtonPrimary>Save</SplitButtonPrimary>
        <SplitButtonMenu>
          <SplitButtonMenuTrigger aria-label="More save options">
            <Icon>
              <Glyph name="ellipsis" />
            </Icon>
          </SplitButtonMenuTrigger>
          <MenuContent>
            <MenuItem>Save as draft</MenuItem>
          </MenuContent>
        </SplitButtonMenu>
      </SplitButton>,
    );

    expect(trigger().querySelector('svg[data-glyph="ellipsis"]')).not.toBeNull();
    expect(trigger().querySelector('svg[data-glyph="chevron-down"]')).toBeNull();
  });

  it('hands one appearance to both halves, from the prop, the provider, button’s provider, then the contract', () => {
    const { rerender } = render(<Save />);
    const defaults = contract.members.splitButton.defaults;
    for (const half of [root(), primary(), trigger()]) {
      expect(half).toHaveAttribute('data-tone', defaults.tone);
      expect(half).toHaveAttribute('data-variant', defaults.variant);
      expect(half).toHaveAttribute('data-size', defaults.size);
    }

    rerender(
      <ButtonDefaultsProvider tone="secondary" variant="outline">
        <Save />
      </ButtonDefaultsProvider>,
    );
    expect(trigger()).toHaveAttribute('data-tone', 'secondary');
    expect(trigger()).toHaveAttribute('data-variant', 'outline');

    rerender(
      <ButtonDefaultsProvider tone="secondary" variant="outline">
        <SplitButtonDefaultsProvider size="sm" tone="danger">
          <Save />
        </SplitButtonDefaultsProvider>
      </ButtonDefaultsProvider>,
    );
    expect(primary()).toHaveAttribute('data-tone', 'danger');
    expect(primary()).toHaveAttribute('data-variant', 'outline');
    expect(primary()).toHaveAttribute('data-size', 'sm');

    rerender(
      <SplitButtonDefaultsProvider size="sm" tone="danger">
        <Save size="lg" tone="success" variant="ghost" />
      </SplitButtonDefaultsProvider>,
    );
    for (const half of [root(), primary(), trigger()]) {
      expect(half).toHaveAttribute('data-tone', 'success');
      expect(half).toHaveAttribute('data-variant', 'ghost');
      expect(half).toHaveAttribute('data-size', 'lg');
    }
  });

  it('runs the action from the primary and opens the menu from the trigger, two tab stops', async () => {
    const onSave = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <SplitButton>
        <SplitButtonPrimary onClick={onSave}>Save</SplitButtonPrimary>
        <SplitButtonMenu onOpenChange={onOpenChange}>
          <SplitButtonMenuTrigger aria-label="More save options" />
          <MenuContent>
            <MenuItem>Save as draft</MenuItem>
          </MenuContent>
        </SplitButtonMenu>
      </SplitButton>,
    );

    expect(primary()).not.toHaveAttribute('tabindex');
    expect(trigger()).not.toHaveAttribute('tabindex');

    fireEvent.click(primary());
    expect(onSave).toHaveBeenCalledOnce();
    expect(surface()).toBeNull();

    fireEvent.click(trigger());
    await waitFor(() => expect(surface()).not.toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'pointer' }));
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger()).toHaveAttribute('data-open', '');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Save as draft' })).toHaveFocus(),
    );
  });

  it('opens on ArrowDown from the trigger and never from the primary', async () => {
    render(<Save />);

    fireEvent.keyDown(primary(), { key: 'ArrowDown' });
    expect(surface()).toBeNull();

    fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
    await waitFor(() => expect(surface()).not.toBeNull());
  });

  it('takes both halves out when disabled, and each half on its own', () => {
    const { rerender } = render(<Save disabled />);
    expect(root()).toHaveAttribute('data-disabled', '');
    expect(primary()).toBeDisabled();
    expect(trigger()).toBeDisabled();

    rerender(
      <SplitButton>
        <SplitButtonPrimary disabled>Save</SplitButtonPrimary>
        <SplitButtonMenu>
          <SplitButtonMenuTrigger aria-label="More save options" />
          <MenuContent>
            <MenuItem>Save as draft</MenuItem>
          </MenuContent>
        </SplitButtonMenu>
      </SplitButton>,
    );
    expect(primary()).toBeDisabled();
    expect(trigger()).not.toBeDisabled();
  });

  /**
   * The primary waits with `button`'s indicator; the trigger is
   * `aria-disabled`, focusable, named, and keeps its paint — no
   * `data-disabled`, so `button` does not paint it unavailable beside an
   * action still in its tone.
   */
  it('blocks the menu while the action is in flight, keeping the trigger reachable and painted', async () => {
    const onOpenChange = vi.fn();
    render(
      <SplitButton loading>
        <SplitButtonPrimary>Save</SplitButtonPrimary>
        <SplitButtonMenu onOpenChange={onOpenChange}>
          <SplitButtonMenuTrigger aria-label="More save options" />
          <MenuContent>
            <MenuItem>Save as draft</MenuItem>
          </MenuContent>
        </SplitButtonMenu>
      </SplitButton>,
    );

    expect(root()).toHaveAttribute('data-loading', '');
    expect(primary()).toHaveAttribute('data-loading', '');
    expect(primary()).toHaveAttribute('aria-disabled', 'true');
    expect(trigger()).toHaveAttribute('aria-disabled', 'true');
    expect(trigger()).not.toBeDisabled();
    expect(trigger()).not.toHaveAttribute('data-disabled');
    expect(trigger()).toHaveAccessibleName('More save options');

    fireEvent.click(trigger());
    fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(surface()).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('remembers the chosen alternative as its value under remember', async () => {
    const onValueChange = vi.fn();
    const labels: Record<string, string> = {
      merge: 'Create a merge commit',
      squash: 'Squash and merge',
    };
    function Merge() {
      const [value, setValue] = useState('squash');
      return (
        <SplitButton
          onValueChange={(next, request) => {
            onValueChange(next, request);
            setValue(next);
          }}
          remember
          value={value}
        >
          <SplitButtonPrimary>{labels[value]}</SplitButtonPrimary>
          <SplitButtonMenu>
            <SplitButtonMenuTrigger aria-label="More merge options" />
            <MenuContent>
              <SplitButtonChoices>
                <MenuRadioItem value="merge">Create a merge commit</MenuRadioItem>
                <MenuRadioItem value="squash">Squash and merge</MenuRadioItem>
              </SplitButtonChoices>
            </MenuContent>
          </SplitButtonMenu>
        </SplitButton>
      );
    }
    render(<Merge />);

    expect(screen.getByRole('button', { name: 'Squash and merge' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'More merge options' }));
    await waitFor(() => expect(surface()).not.toBeNull());
    expect(screen.getByRole('menuitemradio', { name: 'Squash and merge' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Create a merge commit' }), {
      detail: 1,
    });
    expect(onValueChange).toHaveBeenCalledWith(
      'merge',
      expect.objectContaining({ previous: 'squash', reason: 'pointer' }),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create a merge commit' })).toBeInTheDocument(),
    );
  });

  it('holds the remembered value itself when uncontrolled', async () => {
    render(
      <SplitButton defaultValue="squash" remember>
        <SplitButtonPrimary>Merge</SplitButtonPrimary>
        <SplitButtonMenu>
          <SplitButtonMenuTrigger aria-label="More merge options" />
          <MenuContent>
            <SplitButtonChoices>
              <MenuRadioItem value="merge">Create a merge commit</MenuRadioItem>
              <MenuRadioItem value="squash">Squash and merge</MenuRadioItem>
            </SplitButtonChoices>
          </MenuContent>
        </SplitButtonMenu>
      </SplitButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'More merge options' }));
    await waitFor(() => expect(surface()).not.toBeNull());
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Create a merge commit' }), {
      detail: 1,
    });

    fireEvent.click(screen.getByRole('button', { name: 'More merge options' }));
    await waitFor(() =>
      expect(screen.getByRole('menuitemradio', { name: 'Create a merge commit' })).toHaveAttribute(
        'aria-checked',
        'true',
      ),
    );
  });

  it('refuses the choices outside remember', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <SplitButton>
          <SplitButtonPrimary>Merge</SplitButtonPrimary>
          <SplitButtonMenu defaultOpen>
            <SplitButtonMenuTrigger aria-label="More merge options" />
            <MenuContent>
              <SplitButtonChoices>
                <MenuRadioItem value="merge">Create a merge commit</MenuRadioItem>
              </SplitButtonChoices>
            </MenuContent>
          </SplitButtonMenu>
        </SplitButton>,
      ),
    ).toThrow(/remember/);
    vi.restoreAllMocks();
  });

  it('marks full width on the root', () => {
    render(<Save fullWidth />);
    expect(root()).toHaveAttribute('data-full-width', '');
  });

  it('reaches every native element and the menu’s handle', async () => {
    const rootRef = createRef<HTMLDivElement>();
    const primaryRef = createRef<HTMLButtonElement>();
    const triggerRef = createRef<HTMLButtonElement>();
    const menuRef = createRef<MenuHandle>();
    render(
      <SplitButton ref={rootRef}>
        <SplitButtonPrimary ref={primaryRef} type="submit">
          Save
        </SplitButtonPrimary>
        <SplitButtonMenu ref={menuRef}>
          <SplitButtonMenuTrigger aria-label="More save options" ref={triggerRef} />
          <MenuContent>
            <MenuItem>Save as draft</MenuItem>
          </MenuContent>
        </SplitButtonMenu>
      </SplitButton>,
    );

    expect(rootRef.current).toBe(root());
    expect(primaryRef.current).toBe(primary());
    expect(triggerRef.current).toBe(trigger());
    expect(primary()).toHaveAttribute('type', 'submit');

    menuRef.current?.open();
    await waitFor(() => expect(surface()).not.toBeNull());
  });

  it('runs the consumer’s own handlers on both halves first', async () => {
    const onTriggerClick = vi.fn();
    render(
      <SplitButton>
        <SplitButtonPrimary onClick={(event) => event.preventDefault()}>Save</SplitButtonPrimary>
        <SplitButtonMenu>
          <SplitButtonMenuTrigger aria-label="More save options" onClick={onTriggerClick} />
          <MenuContent>
            <MenuItem>Save as draft</MenuItem>
          </MenuContent>
        </SplitButtonMenu>
      </SplitButton>,
    );

    fireEvent.click(trigger());
    expect(onTriggerClick).toHaveBeenCalledOnce();
    await waitFor(() => expect(surface()).not.toBeNull());
  });

  it('renders the consumer’s own elements through render and keeps the parts', () => {
    render(
      <SplitButton render={(props) => <section {...props} data-testid="own-root" />}>
        <SplitButtonPrimary render={(props) => <button {...props} data-testid="own-primary" />}>
          Save
        </SplitButtonPrimary>
        <SplitButtonMenu>
          <SplitButtonMenuTrigger
            aria-label="More save options"
            render={(props) => <button {...props} data-testid="own-trigger" />}
          />
          <MenuContent>
            <MenuItem>Save as draft</MenuItem>
          </MenuContent>
        </SplitButtonMenu>
      </SplitButton>,
    );

    expect(screen.getByTestId('own-root')).toHaveAttribute('data-ui', 'split-button');
    expect(screen.getByTestId('own-primary')).toHaveAttribute('data-part', 'primary');
    expect(screen.getByTestId('own-trigger')).toHaveAttribute('data-part', 'menu-trigger');
    expect(screen.getByTestId('own-trigger')).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('declares in the contract the models it surfaces', () => {
    expect(contract.stateModel.open.reasons).toEqual([
      'pointer',
      'keyboard',
      'escape',
      'outsidePress',
      'select',
      'dismiss',
      'programmatic',
    ]);
    expect(contract.stateModel.selection).toEqual({
      controlled: 'value',
      uncontrolled: 'defaultValue',
      request: 'onValueChange',
      reasons: ['pointer', 'keyboard'],
    });
  });
});
