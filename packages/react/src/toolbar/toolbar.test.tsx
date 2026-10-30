import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/toolbar/contract.json';
import { SlottedProvider } from '../i18n';
import { MenuItem } from '../menu';
import { Toolbar } from './toolbar';
import { ToolbarDefaultsProvider } from './toolbar-defaults';
import { ToolbarOverflow } from './toolbar-overflow';
import { ToolbarGroup, ToolbarItem, ToolbarSeparator, ToolbarSpacer } from './toolbar-parts';

const bar = () => screen.getByRole('toolbar');
const controls = () => screen.getAllByRole('button');
const control = (index: number) => controls()[index] as HTMLElement;
const press = (element: HTMLElement, key: string) => fireEvent.keyDown(element, { key });

function Bar(props: Record<string, unknown>) {
  return (
    <Toolbar aria-label="Formatting" {...props}>
      <button type="button">Bold</button>
      <button type="button">Italic</button>
      <ToolbarSeparator />
      <button type="button">Link</button>
    </Toolbar>
  );
}

describe('Toolbar', () => {
  it('renders the role, the label and every part the contract names', () => {
    render(
      <Toolbar aria-label="Selection" overflow="menu">
        <ToolbarGroup aria-label="Alignment">
          {/* language: pt-BR */}
          <button type="button">Início</button>
          {/* language: en-US */}
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarSpacer />
        <ToolbarItem counterpart={<MenuItem>Delete</MenuItem>}>
          <button type="button">Delete</button>
        </ToolbarItem>
        <ToolbarOverflow />
      </Toolbar>,
    );

    expect(bar()).toHaveAccessibleName('Selection');
    const drawn = new Set(
      [...bar().querySelectorAll('[data-part]')].map((node) => node.getAttribute('data-part')),
    );
    drawn.add(bar().getAttribute('data-part'));
    for (const part of contract.members.toolbar.parts) expect(drawn).toContain(part);
    expect(screen.getByRole('group')).toHaveAccessibleName('Alignment');
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  /**
   * The contract writes `aria-orientation` on a separator always, and
   * perpendicular to the bar: the rule of a horizontal bar stands upright.
   */
  it('states the axis of a separator, perpendicular to the bar', () => {
    const { rerender } = render(
      <Toolbar aria-label="Order">
        <button type="button">Copy</button>
        <ToolbarSeparator />
        <button type="button">Imprimir</button>
      </Toolbar>,
    );
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');

    rerender(
      <Toolbar aria-label="Order" orientation="vertical">
        <button type="button">Copy</button>
        <ToolbarSeparator />
        <button type="button">Imprimir</button>
      </Toolbar>,
    );
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal');
  });

  /** One stop for the whole bar, however many controls it holds. */
  it('holds one tab stop', () => {
    render(<Bar />);

    expect(control(0)).toHaveAttribute('tabindex', '0');
    expect(control(1)).toHaveAttribute('tabindex', '-1');
    expect(control(2)).toHaveAttribute('tabindex', '-1');
  });

  it('moves along the bar with the arrows and wraps at both ends', () => {
    render(<Bar />);

    control(0).focus();
    press(control(0), 'ArrowRight');
    expect(control(1)).toHaveFocus();

    press(control(1), 'ArrowRight');
    expect(control(2)).toHaveFocus();

    press(control(2), 'ArrowRight');
    expect(control(0)).toHaveFocus();
  });

  /** "Up Arrow and Down Arrow can duplicate Left Arrow and Right Arrow." */
  it('duplicates the cross-axis pair, which the pattern permits', () => {
    render(<Bar />);

    control(0).focus();
    press(control(0), 'ArrowDown');

    expect(control(1)).toHaveFocus();
  });

  it('reaches both ends with Home and End', () => {
    render(<Bar />);

    control(0).focus();
    press(control(0), 'End');
    expect(control(2)).toHaveFocus();

    press(control(2), 'Home');
    expect(control(0)).toHaveFocus();
  });

  it('turns the arrows and announces the axis when the bar is vertical', () => {
    render(<Bar orientation="vertical" />);

    expect(bar()).toHaveAttribute('aria-orientation', 'vertical');
    control(0).focus();
    press(control(0), 'ArrowDown');
    expect(control(1)).toHaveFocus();
  });

  it('clamps at the ends when looping is off', () => {
    render(<Bar loop={false} />);

    control(0).focus();
    press(control(0), 'ArrowLeft');

    expect(control(0)).toHaveFocus();
  });

  /**
   * The APG allows a focusable disabled control "in circumstances where
   * discoverability of a function is crucial", which is what `button`'s
   * `focusableWhenDisabled` renders; a natively disabled one cannot be focused
   * at all, so the platform decides and the bar follows.
   */
  it('keeps an aria-disabled control in the ring and skips a native one', () => {
    render(
      <Toolbar aria-label="Formatting">
        <button type="button">Bold</button>
        <button aria-disabled="true" type="button">
          Code
        </button>
        <button disabled type="button">
          Link
        </button>
        <button type="button">Quote</button>
      </Toolbar>,
    );

    control(0).focus();
    press(control(0), 'ArrowRight');
    expect(control(1)).toHaveFocus();

    press(control(1), 'ArrowRight');
    expect(control(3)).toHaveFocus();
  });

  /**
   * The APG asks an author to avoid a control that needs the navigation pair;
   * the bar enforces it instead, so the caret keeps its keys and focus leaves
   * on the cross axis.
   */
  it('leaves the flow arrows to an item that operates with them', () => {
    render(
      <Toolbar aria-label="Filtro">
        <button type="button">Todos</button>
        <input aria-label="Buscar" type="search" />
      </Toolbar>,
    );

    const field = screen.getByRole('searchbox');
    field.focus();
    press(field, 'ArrowLeft');
    expect(field).toHaveFocus();

    press(field, 'ArrowUp');
    expect(control(0)).toHaveFocus();
  });

  it('lets a consumer state which keys an item keeps', () => {
    render(
      <Toolbar aria-label="Filtro">
        <button data-toolbar-keys="inline" type="button">
          Todos
        </button>
        <button type="button">Abertos</button>
      </Toolbar>,
    );

    control(0).focus();
    press(control(0), 'ArrowRight');
    expect(control(0)).toHaveFocus();

    press(control(0), 'ArrowDown');
    expect(control(1)).toHaveFocus();
  });

  /**
   * A fieldset is the platform's own answer, and it takes the ring with it: a
   * natively disabled control cannot be focused, so the arrows have nowhere to
   * go. jsdom lets a script focus a disabled control, which a browser does not,
   * so what is asserted here is the two facts a browser derives it from.
   */
  it('is left out of action by the element that can actually do it', () => {
    render(
      <fieldset disabled>
        <Bar />
      </fieldset>,
    );

    for (const item of controls()) expect(item).toBeDisabled();

    control(0).focus();
    press(control(0), 'ArrowRight');
    expect(control(1)).not.toHaveFocus();
  });

  it('finds a control that arrives after the bar was built', () => {
    const { rerender } = render(<Bar />);

    rerender(
      <Toolbar aria-label="Formatting">
        <button type="button">Bold</button>
        <button type="button">Italic</button>
        <ToolbarSeparator />
        <button type="button">Link</button>
        <button type="button">Quote</button>
      </Toolbar>,
    );

    control(0).focus();
    press(control(0), 'End');
    expect(control(3)).toHaveFocus();
  });

  it('takes the defaults an application sets once, and lets a bar win over them', () => {
    render(
      <ToolbarDefaultsProvider size="sm" variant="outline">
        <Bar />
        <Toolbar aria-label="Outra" size="lg">
          <button type="button">Um</button>
        </Toolbar>
      </ToolbarDefaultsProvider>,
    );

    const [first, second] = screen.getAllByRole('toolbar');
    expect(first).toHaveAttribute('data-size', 'sm');
    expect(first).toHaveAttribute('data-variant', 'outline');
    expect(second).toHaveAttribute('data-size', 'lg');
  });

  it('substitutes the element of every part it exposes', () => {
    render(
      <Toolbar aria-label="Selection" render={(props) => <nav {...props} />}>
        <ToolbarGroup render={(props) => <section {...props} />}>
          <button type="button">One</button>
        </ToolbarGroup>
        <ToolbarSeparator render={(props) => <hr {...props} />} />
        <ToolbarSpacer render={(props) => <span {...props} />} />
      </Toolbar>,
    );

    expect(document.querySelector('nav[data-ui="toolbar"]')).toBeInTheDocument();
    expect(document.querySelector('section[data-part="group"]')).toBeInTheDocument();
    expect(document.querySelector('hr[data-part="separator"]')).toBeInTheDocument();
    expect(document.querySelector('span[data-part="spacer"]')).toBeInTheDocument();
  });

  it('keeps the consumer own listener on the control it belongs to', () => {
    const onClick = vi.fn();
    render(
      <Toolbar aria-label="Formatting">
        <button onClick={onClick} type="button">
          Bold
        </button>
      </Toolbar>,
    );

    fireEvent.click(control(0), { detail: 1 });

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

/**
 * The collapse is a measurement, and jsdom lays nothing out. The room each box
 * takes is therefore stated on it, which is what a browser would have reported:
 * `data-test-width` on a unit is its width, and on the bar it is the room the
 * bar has. Nothing else about the arithmetic is stubbed — it is the same
 * `collapseState` a browser runs.
 */
function withLayout() {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return Number(this.dataset['testWidth'] ?? 0);
    },
  });
  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect(this: HTMLElement) {
    const width = Number(this.dataset['testWidth'] ?? 0);
    return { bottom: 0, height: 0, left: 0, right: width, top: 0, width, x: 0, y: 0 } as DOMRect;
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
});

/* Read from the DOM rather than by role: a hidden control is out of the
   accessibility tree, which is the whole point of hiding it. */
const trigger = () => bar().querySelector("[data-part='overflow']") as HTMLElement;
const unit = (name: string) => screen.getByText(name).closest('[data-part]') as HTMLElement;

function Overflowing({ room, ...props }: { room: number } & Record<string, unknown>) {
  return (
    <Toolbar aria-label="Documento" data-test-width={room} overflow="menu" {...props}>
      <ToolbarItem data-test-width={40}>
        <button type="button">Publicar</button>
      </ToolbarItem>
      <ToolbarSeparator data-test-width={10} />
      <ToolbarItem data-test-width={40} counterpart={<MenuItem>Duplicar</MenuItem>}>
        <button type="button">Duplicar</button>
      </ToolbarItem>
      <ToolbarItem data-test-width={40} counterpart={<MenuItem>Arquivar</MenuItem>}>
        <button type="button">Arquivar</button>
      </ToolbarItem>
      <ToolbarOverflow data-test-width={30} />
    </Toolbar>
  );
}

describe('Toolbar under overflow="menu"', () => {
  it('hides the trigger and every control while the bar has room', () => {
    withLayout();
    render(<Overflowing room={400} />);

    expect(bar()).toHaveAttribute('data-collapsed', '0');
    expect(screen.getByText('Arquivar')).toBeVisible();
    expect(trigger()).toHaveAttribute('hidden');
  });

  /**
   * The end gives way first, which is what "the overflow takes what is left
   * over" means when the bar is read in its own order.
   */
  it('gives way from the end and draws the trigger with the count in its name', () => {
    withLayout();
    render(<Overflowing room={125} />);

    expect(unit('Arquivar')).toHaveAttribute('hidden');
    expect(unit('Duplicar')).not.toHaveAttribute('hidden');
    expect(unit('Publicar')).not.toHaveAttribute('hidden');
    expect(trigger()).not.toHaveAttribute('hidden');
    expect(trigger()).toHaveAccessibleName('1 more action');
    expect(
      trigger().querySelector('[data-ui="icon"][aria-hidden="true"] > svg[data-glyph="ellipsis"]'),
    ).not.toBeNull();
  });

  /**
   * The rule the refinement exists for. A control with nothing to become has
   * nowhere to go, so it stays — which is how the primary action survives a bar
   * that ran out of room, without a priority ranking it above the others.
   */
  it('never hides a unit that declares no counterpart', () => {
    withLayout();
    render(<Overflowing room={30} />);

    expect(unit('Publicar')).not.toHaveAttribute('hidden');
    expect(unit('Duplicar')).toHaveAttribute('hidden');
    expect(unit('Arquivar')).toHaveAttribute('hidden');
    expect(trigger()).toHaveAccessibleName('2 more actions');
  });

  /** The control's default name is a sentence of the language in force, with its plural. */
  it('names the overflow control in the language in force', () => {
    withLayout();
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <Overflowing room={30} />
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(trigger()).toHaveAccessibleName('Mais 2 ações');
    // language: en-US
  });

  /** A rule that divides nothing is a stray line. */
  it('takes a separator that is left dividing nothing', () => {
    withLayout();
    render(<Overflowing room={60} />);

    expect(bar().querySelector("[data-part='separator']")).toHaveAttribute('hidden');
  });

  it('puts the counterpart of every collapsed unit in the surface, in the bar order', async () => {
    withLayout();
    render(<Overflowing room={60} />);

    fireEvent.click(trigger());
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['Duplicar', 'Arquivar']);
  });

  it('reports the count once per change', () => {
    withLayout();
    const onOverflowChange = vi.fn();
    render(<Overflowing room={125} onOverflowChange={onOverflowChange} />);

    expect(onOverflowChange).toHaveBeenCalledTimes(1);
    expect(onOverflowChange).toHaveBeenCalledWith(1);
  });

  /** A control the platform will not focus is not a stop the arrows can land on. */
  it('takes a collapsed control out of the ring', () => {
    withLayout();
    render(<Overflowing room={100} />);

    const first = screen.getByText('Publicar');
    first.focus();
    press(first, 'End');

    expect(document.activeElement).toBe(trigger());
  });

  /**
   * With nothing to give way to, every unit is pinned and the bar scrolls —
   * the same degradation a bar of pinned units gets, which is one rule rather
   * than two.
   */
  it('collapses nothing when the bar holds no trigger', () => {
    withLayout();
    render(
      <Toolbar aria-label="Documento" data-test-width={40} overflow="menu">
        <ToolbarItem data-test-width={40} counterpart={<MenuItem>Duplicar</MenuItem>}>
          <button type="button">Duplicar</button>
        </ToolbarItem>
        <ToolbarItem data-test-width={40} counterpart={<MenuItem>Arquivar</MenuItem>}>
          <button type="button">Arquivar</button>
        </ToolbarItem>
      </Toolbar>,
    );

    expect(bar()).toHaveAttribute('data-collapsed', '0');
    expect(unit('Arquivar')).not.toHaveAttribute('hidden');
  });

  /** A whole run moves at once, with no wrapper around a box the family owns. */
  it('collapses a group into the surface as one unit', async () => {
    withLayout();
    render(
      <Toolbar aria-label="Documento" data-test-width={60} overflow="menu">
        <ToolbarItem data-test-width={40}>
          <button type="button">Publicar</button>
        </ToolbarItem>
        <ToolbarGroup
          aria-label="Alignment"
          data-test-width={60}
          counterpart={
            <>
              {/* language: pt-BR */}
              <MenuItem>Início</MenuItem>
              {/* language: en-US */}
              <MenuItem>End</MenuItem>
            </>
          }
        >
          {/* language: pt-BR */}
          <button type="button">Início</button>
          {/* language: en-US */}
          <button type="button">End</button>
        </ToolbarGroup>
        <ToolbarOverflow data-test-width={30} />
      </Toolbar>,
    );

    expect(bar().querySelector("[data-part='group']")).toHaveAttribute('hidden');
    fireEvent.click(trigger());
    const items = await screen.findAllByRole('menuitem');
    expect(items).toHaveLength(2);
  });
});
