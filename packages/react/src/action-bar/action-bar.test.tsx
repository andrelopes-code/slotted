import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/action-bar/contract.json';
import { Button } from '../button';
import { MenuItem } from '../menu';
import { ActionBar } from './action-bar';
import { ActionBarDefaultsProvider } from './action-bar-defaults';
import { ActionBarOverflow } from './action-bar-overflow';
import {
  ActionBarAction,
  ActionBarActions,
  ActionBarSeparator,
  ActionBarStatus,
} from './action-bar-parts';

const bar = () => screen.getByRole('group');
const part = (name: string) => bar().querySelector(`[data-part='${name}']`);
const actions = () => bar().querySelector("[data-part='actions']") as HTMLElement;
const units = () => [...actions().querySelectorAll("[data-part='action']")] as HTMLElement[];
const priorities = () => units().map((unit) => unit.getAttribute('data-priority'));
const visible = () =>
  units()
    .filter((unit) => !unit.hasAttribute('hidden'))
    .map((unit) => unit.textContent);

/**
 * The bar is measured, and jsdom lays nothing out: every box is nought wide, so
 * a real collapse cannot be provoked here. What is asserted instead is the
 * contract the measurement is given — the rank on each unit, what counts as a
 * unit, and what the surface holds — plus everything that is not measured at
 * all. The arithmetic itself is `collapseState`'s own test, where it is a pure
 * function over numbers.
 */
function Bar(props: Record<string, unknown> = {}) {
  return (
    <ActionBar aria-label="Order actions" {...props}>
      <ActionBarStatus>Draft saved at 14:07</ActionBarStatus>
      <ActionBarActions>
        <ActionBarAction counterpart={<MenuItem>Duplicate</MenuItem>}>
          <Button variant="ghost" tone="secondary">
            Duplicar
          </Button>
        </ActionBarAction>
        <ActionBarSeparator />
        <ActionBarAction>
          <Button>Aprovar</Button>
        </ActionBarAction>
      </ActionBarActions>
    </ActionBar>
  );
}

describe('ActionBar', () => {
  it('renders the role, the label and every part the contract names', () => {
    render(
      <ActionBar aria-label="Order actions">
        <ActionBarStatus>3 unsaved changes</ActionBarStatus>
        <ActionBarActions>
          <ActionBarAction counterpart={<MenuItem>Duplicate</MenuItem>}>
            <Button variant="ghost">Duplicar</Button>
          </ActionBarAction>
          <ActionBarSeparator />
          <ActionBarAction>
            <Button>Aprovar</Button>
          </ActionBarAction>
          <ActionBarOverflow />
        </ActionBarActions>
      </ActionBar>,
    );

    expect(bar()).toHaveAccessibleName('Order actions');
    const drawn = new Set(
      [...bar().querySelectorAll('[data-part]')].map((node) => node.getAttribute('data-part')),
    );
    drawn.add(bar().getAttribute('data-part'));
    for (const declared of contract.members.actionBar.parts) expect(drawn).toContain(declared);
    expect(bar()).toHaveAttribute('data-ui', 'action-bar');
  });

  /**
   * The departure from the APG's Toolbar pattern, and the reason this family
   * stands beside `toolbar` rather than configuring it. Every action is its own
   * tab stop, so a reader walking a form arrives at Cancel and then at Save.
   */
  it('holds one tab stop per action, and binds no arrow key', () => {
    render(<Bar />);

    for (const control of screen.getAllByRole('button')) {
      expect(control).not.toHaveAttribute('tabindex');
    }
    expect(bar()).toHaveAttribute('role', 'group');
    expect(contract.rovingFocus).toBe(false);
  });

  /** A consumer with ten icon-only actions may assert the composite themselves. */
  it('leaves a role the consumer wrote alone', () => {
    render(<Bar role="toolbar" />);

    expect(screen.getByRole('toolbar')).toHaveAttribute('data-ui', 'action-bar');
  });

  describe('rank', () => {
    it('pins an action that declares no counterpart', () => {
      render(<Bar />);

      expect(priorities()).toEqual(['low', 'pinned']);
    });

    it('ranks an action that declares one as low unless it says otherwise', () => {
      render(
        <ActionBar aria-label="Actions">
          <ActionBarActions>
            <ActionBarAction counterpart={<MenuItem>Export</MenuItem>}>
              <Button>Exportar</Button>
            </ActionBarAction>
            <ActionBarAction priority="high" counterpart={<MenuItem>Devolver</MenuItem>}>
              <Button>Devolver</Button>
            </ActionBarAction>
            <ActionBarAction priority="hide">
              <Button>Preview</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>,
      );

      expect(priorities()).toEqual(['low', 'high', 'hide']);
    });

    /**
     * A rank that needs somewhere to go and has nowhere is a consumer error, and
     * the control stays on the bar rather than disappearing into a surface that
     * has no row for it.
     */
    it('falls back to pinned when a rank that needs a counterpart has none', () => {
      render(
        <ActionBar aria-label="Actions">
          <ActionBarActions>
            <ActionBarAction priority="low">
              <Button>Duplicar</Button>
            </ActionBarAction>
            <ActionBarAction priority="always">
              <Button>Arquivar</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>,
      );

      expect(priorities()).toEqual(['pinned', 'pinned']);
      expect(visible()).toEqual(['Duplicar', 'Arquivar']);
    });

    /** `hide` needs no counterpart: its somewhere is nowhere. */
    it('lets hide give way without a counterpart', () => {
      render(
        <ActionBar aria-label="Actions">
          <ActionBarActions>
            <ActionBarAction priority="hide">
              <Button>Preview</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>,
      );

      expect(priorities()).toEqual(['hide']);
    });

    it('keeps an always action out of the bar and in the surface', async () => {
      render(
        <ActionBar aria-label="Actions">
          <ActionBarActions>
            <ActionBarAction priority="always" counterpart={<MenuItem>Archive</MenuItem>}>
              <Button>Arquivar</Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button>Aprovar</Button>
            </ActionBarAction>
            <ActionBarOverflow />
          </ActionBarActions>
        </ActionBar>,
      );

      expect(visible()).toEqual(['Aprovar']);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: '1 more action' })).toBeInTheDocument(),
      );
      expect(
        screen
          .getByRole('button', { name: '1 more action' })
          .querySelector('[data-ui="icon"][aria-hidden="true"] > svg[data-glyph="ellipsis"]'),
      ).not.toBeNull();
    });
  });

  /**
   * The count is what a reader hears, because three dots say nothing about how
   * much is behind them.
   */
  describe('the control that holds what did not fit', () => {
    it('names itself with the count, and pluralises it', async () => {
      render(
        <ActionBar aria-label="Actions">
          <ActionBarActions>
            <ActionBarAction priority="always" counterpart={<MenuItem>Archive</MenuItem>}>
              <Button>Arquivar</Button>
            </ActionBarAction>
            <ActionBarAction priority="always" counterpart={<MenuItem>Exportar</MenuItem>}>
              <Button>Exportar</Button>
            </ActionBarAction>
            <ActionBarOverflow />
          </ActionBarActions>
        </ActionBar>,
      );

      await waitFor(() =>
        expect(screen.getByRole('button', { name: '2 more actions' })).toBeInTheDocument(),
      );
    });

    it('takes a sentence the consumer states, verbatim', async () => {
      render(
        <ActionBar aria-label="Actions">
          <ActionBarActions>
            <ActionBarAction priority="always" counterpart={<MenuItem>Archive</MenuItem>}>
              <Button>Archive</Button>
            </ActionBarAction>
            <ActionBarOverflow label={(hidden) => `${hidden} more actions`} />
          </ActionBarActions>
        </ActionBar>,
      );

      await waitFor(() =>
        expect(screen.getByRole('button', { name: '1 more actions' })).toBeInTheDocument(),
      );
    });
  });

  describe('presence', () => {
    it('renders nothing at all while it is not present', () => {
      render(<Bar present={false} />);

      expect(screen.queryByRole('group')).not.toBeInTheDocument();
    });

    /**
     * Carbon keeps its batch bar mounted and writes `aria-hidden` on the root,
     * which leaves the buttons inside reachable by Tab. A bar that is gone is
     * gone.
     */
    it('leaves the document rather than staying hidden', async () => {
      const { rerender } = render(<Bar />);
      expect(bar()).toBeInTheDocument();

      rerender(<Bar present={false} />);
      await waitFor(() => expect(document.querySelector("[data-ui='action-bar']")).toBeNull());
    });
  });

  describe('axes', () => {
    it('states every axis in the DOM, at its documented default', () => {
      render(<Bar />);

      expect(bar()).toHaveAttribute('data-variant', contract.members.actionBar.defaults.variant);
      expect(bar()).toHaveAttribute('data-size', contract.members.actionBar.defaults.size);
      expect(bar()).toHaveAttribute('data-align', contract.members.actionBar.defaults.align);
      expect(bar()).not.toHaveAttribute('data-sticky');
    });

    it('takes the application defaults, and lets the bar win over them', () => {
      render(
        <ActionBarDefaultsProvider variant="raised" size="sm" align="center" sticky>
          <ActionBar aria-label="Actions" size="lg">
            <ActionBarActions>
              <ActionBarAction>
                <Button>Guardar</Button>
              </ActionBarAction>
            </ActionBarActions>
          </ActionBar>
        </ActionBarDefaultsProvider>,
      );

      expect(bar()).toHaveAttribute('data-variant', 'raised');
      expect(bar()).toHaveAttribute('data-align', 'center');
      expect(bar()).toHaveAttribute('data-sticky', '');
      expect(bar()).toHaveAttribute('data-size', 'lg');
    });

    /** A bar that sizes itself sizes the buttons it holds, once. */
    it('hands its own step down to the buttons inside it', () => {
      render(
        <ActionBar aria-label="Actions" size="sm">
          <ActionBarActions>
            <ActionBarAction>
              <Button>Guardar</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>,
      );

      expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('data-size', 'sm');
      expect(contract.provides.buttonDefaults).toEqual(['size']);
    });

    it('lets a button state its own step over the bar', () => {
      render(
        <ActionBar aria-label="Actions" size="sm">
          <ActionBarActions>
            <ActionBarAction>
              <Button size="lg">Guardar</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>,
      );

      expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('composition', () => {
    it('renders each part into the consumer own element', () => {
      render(
        <ActionBar aria-label="Actions" render={(props) => <footer {...props} />}>
          <ActionBarStatus render={(props) => <p {...props} />}>Saved</ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction render={(props) => <span {...props} />}>
              <Button>Guardar</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>,
      );

      expect(bar().tagName).toBe('FOOTER');
      expect(part('status')?.tagName).toBe('P');
      expect(part('action')?.tagName).toBe('SPAN');
    });

    it('passes native attributes and the consumer own handler through', () => {
      const onClick = vi.fn();
      render(<Bar id="finish" data-testid="bar" onClick={onClick} />);

      expect(bar()).toHaveAttribute('id', 'finish');
      expect(bar()).toHaveAttribute('data-testid', 'bar');
      bar().click();
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('reaches the native element through a ref', () => {
      const held: { current: HTMLDivElement | null } = { current: null };
      render(<Bar ref={held} />);

      expect(held.current).toBe(bar());
    });
  });

  /** The bar holds no value a consumer can own, so it declares no state model. */
  it('declares no state model', () => {
    expect('stateModel' in contract).toBe(false);
  });
});
