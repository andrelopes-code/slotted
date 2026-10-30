import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/select/contract.json';
import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { Glyph, Icon } from '../icon';
import { Select } from './select';
import { SelectDefaultsProvider } from './select-defaults';
import { SelectGroup, SelectItem, SelectSeparator } from './select-items';
import { SelectContent, SelectTrigger, SelectValue } from './select-parts';
import type { SelectProps, SelectSelection } from './select.types';

function Basic({ children, ...props }: Partial<SelectProps>) {
  return (
    <Select {...props}>
      <SelectTrigger aria-label="Fruit">
        <SelectValue placeholder="Choose a fruit" />
      </SelectTrigger>
      <SelectContent>
        {children ?? (
          <>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem disabled value="banana">
              Banana
            </SelectItem>
            <SelectItem value="blueberry">Blueberry</SelectItem>
            <SelectSeparator />
            <SelectItem value="cherry">Cherry</SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  );
}

const trigger = () => screen.getByRole('combobox', { name: 'Fruit' });
const press = (key: string, options: Record<string, unknown> = {}) =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key, ...options });

const open = async () => {
  trigger().focus();
  press('ArrowDown');
  return screen.findByRole('listbox');
};

const optionNamed = (name: string) => screen.getByRole('option', { name });
const highlighted = () => trigger().getAttribute('aria-activedescendant');

/**
 * What a browser does with a press on an option, in the order it does it. The
 * focus move is the press's default action, so an option that refuses the press
 * leaves focus where it was; `click` is dispatched either way (CB11).
 */
const pressOption = (option: HTMLElement) => {
  const focusMoves = fireEvent.pointerDown(option);
  if (focusMoves) act(() => (document.activeElement as HTMLElement | null)?.blur());
  fireEvent.click(option);
};

describe('Select', () => {
  it('is a combobox that opens a listbox, which is the pattern it cites', async () => {
    render(<Basic />);
    expect(trigger()).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');

    const listbox = await open();
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger()).toHaveAttribute('aria-controls', listbox.id);
    expect(contract.roles.trigger).toBe('combobox');
    expect(contract.roles.content).toBe('listbox');
  });

  /**
   * A popup pinned to the control's width wrapped its option labels under a
   * narrow control. The default sizes it to its options, never narrower than
   * the control.
   */
  it('sizes the popup to its options by default', async () => {
    render(<Basic />);
    const listbox = await open();
    const positioner = listbox.closest("[data-ui='select'][data-part='positioner']");
    expect(positioner).toHaveAttribute('data-width', 'content');
    expect(contract.members.select.defaults.width).toBe('content');
  });

  /**
   * The whole of the family's focus model in one assertion: the popup opens,
   * the highlight moves, options are announced — and the button never lets go.
   */
  it('keeps DOM focus on the trigger for the whole interaction', async () => {
    render(<Basic />);
    await open();
    expect(document.activeElement).toBe(trigger());
    press('ArrowDown');
    press('End');
    expect(document.activeElement).toBe(trigger());
  });

  it('marks the highlight with aria-activedescendant and data-current', async () => {
    render(<Basic />);
    await open();
    expect(highlighted()).toBe(optionNamed('Apple').id);
    expect(optionNamed('Apple')).toHaveAttribute('data-current');
    press('ArrowDown');
    expect(optionNamed('Blueberry')).toHaveAttribute('data-current');
    expect(optionNamed('Apple')).not.toHaveAttribute('data-current');
  });

  it('skips a disabled option rather than landing on it, and never commits one', async () => {
    render(<Basic />);
    await open();
    press('ArrowDown');
    /* Banana sits between Apple and Blueberry and is disabled. */
    expect(highlighted()).toBe(optionNamed('Blueberry').id);
    fireEvent.click(optionNamed('Banana'));
    expect(screen.getByText('Choose a fruit')).toBeInTheDocument();
  });

  it('does not wrap by default, which is where it parts company with menu', async () => {
    render(<Basic />);
    await open();
    press('End');
    expect(highlighted()).toBe(optionNamed('Cherry').id);
    press('ArrowDown');
    expect(highlighted()).toBe(optionNamed('Cherry').id);
  });

  it('wraps when it is asked to', async () => {
    render(<Basic loop />);
    await open();
    press('End');
    press('ArrowDown');
    expect(highlighted()).toBe(optionNamed('Apple').id);
  });

  it('opens onto the last option from ArrowUp, and onto the selected one from ArrowDown', async () => {
    const { unmount } = render(<Basic />);
    trigger().focus();
    press('ArrowUp');
    await screen.findByRole('listbox');
    expect(highlighted()).toBe(optionNamed('Cherry').id);
    unmount();

    render(<Basic defaultValue="blueberry" />);
    await open();
    expect(highlighted()).toBe(optionNamed('Blueberry').id);
  });

  it('opens without moving the highlight on Alt+ArrowDown', async () => {
    render(<Basic />);
    trigger().focus();
    press('ArrowDown', { altKey: true });
    await screen.findByRole('listbox');
    expect(highlighted()).toBeNull();
  });

  it('travels ten options on a page key, and never past the end', async () => {
    render(
      <Basic>
        {Array.from({ length: 30 }, (_, index) => (
          <SelectItem key={index} value={`option-${index}`}>{`Option ${index}`}</SelectItem>
        ))}
      </Basic>,
    );
    await open();
    press('PageDown');
    expect(highlighted()).toBe(optionNamed('Option 10').id);
    press('PageUp');
    expect(highlighted()).toBe(optionNamed('Option 0').id);
    press('End');
    press('PageDown');
    expect(highlighted()).toBe(optionNamed('Option 29').id);
  });

  it('commits on Enter and closes, and reports the reason', async () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} onValueChange={onValueChange} />);
    await open();
    press('Enter');

    expect(onValueChange).toHaveBeenCalledWith(
      'apple',
      expect.objectContaining({ reason: 'keyboard' }),
    );
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'select' }),
    );
  });

  /**
   * The one key that differs from a native `select`, which the example calls
   * out by name: Tab takes the highlighted option with it.
   */
  it('commits on Tab and lets the key move focus on', async () => {
    const onValueChange = vi.fn();
    render(<Basic onValueChange={onValueChange} />);
    await open();
    press('ArrowDown');
    const event = fireEvent.keyDown(trigger(), { key: 'Tab' });
    expect(onValueChange).toHaveBeenCalledWith('blueberry', expect.anything());
    expect(event).toBe(true);
  });

  it('closes on Escape without committing anything', async () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} onValueChange={onValueChange} />);
    await open();
    press('ArrowDown');
    press('Escape');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'escape' }),
    );
  });

  it('moves the highlight to whichever option the pointer enters', async () => {
    render(<Basic />);
    await open();
    fireEvent.pointerEnter(optionNamed('Cherry'));
    expect(highlighted()).toBe(optionNamed('Cherry').id);
  });

  it('finds an option by typing its opening characters', async () => {
    render(<Basic />);
    await open();
    press('c');
    expect(highlighted()).toBe(optionNamed('Cherry').id);
  });

  it('opens on a printable character and highlights the match', async () => {
    render(<Basic />);
    trigger().focus();
    press('b');
    await screen.findByRole('listbox');
    await waitFor(() => expect(highlighted()).toBe(optionNamed('Blueberry').id));
  });

  it('names the chosen option in the closed control', async () => {
    render(<Basic />);
    await open();
    fireEvent.click(optionNamed('Blueberry'));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(trigger()).toHaveTextContent('Blueberry');
  });

  /**
   * The popup does not exist while the control is closed, so an option's own
   * label cannot be read from it. `items` is what a select that knows its
   * options up front hands over instead.
   */
  /** The empty string is an option value as HTML's own `<option value="">` is one. */
  it('names an option whose value is the empty string', async () => {
    render(
      <Select value="" onValueChange={() => undefined}>
        <SelectTrigger aria-label="Statement">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Automatic</SelectItem>
          <SelectItem value="2026-12">December 2026</SelectItem>
        </SelectContent>
      </Select>,
    );

    await waitFor(() => expect(screen.getByRole('combobox')).toHaveTextContent('Automatic'));
  });

  it('names a value from items before the popup has ever been built', () => {
    render(<Basic defaultValue="blueberry" items={[{ label: 'Blueberry', value: 'blueberry' }]} />);
    expect(trigger()).toHaveTextContent('Blueberry');
  });

  /**
   * A value that is not its own label — an identifier — read "a1b2…" in the
   * closed control until `items` was passed, because the options that know the
   * label did not exist before the first open. The options are now built where
   * nothing displays them while a held value has no label.
   */
  it('names a value from its option before the popup has ever been built', async () => {
    render(
      <Select value="a1b2c3">
        <SelectTrigger aria-label="Account">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a1b2c3">Checking</SelectItem>
          <SelectItem value="d4e5f6">Savings</SelectItem>
        </SelectContent>
      </Select>,
    );
    const control = screen.getByRole('combobox', { name: 'Account' });

    await waitFor(() => expect(control).toHaveTextContent('Checking'));
    expect(control.querySelector("[data-part='value']")).not.toHaveAttribute('data-unmatched');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.querySelectorAll("[data-part='item']")).toHaveLength(0);
  });

  it('shows a value it cannot resolve rather than falling back to the placeholder', () => {
    render(<Basic defaultValue="usr_8f21c0" />);
    expect(trigger()).toHaveTextContent('usr_8f21c0');
    expect(trigger().querySelector("[data-part='value']")).toHaveAttribute('data-unmatched');
  });

  /**
   * SL4: several values are the chips they are, and not a sentence about them.
   * The sentence stays as the trigger's name — and as what a control too narrow
   * for a chip shows — but the picture is one `tag` per value, each with the
   * remove control a tag already has.
   */
  it('previews several values as chips, and keeps the popup open while they are taken', async () => {
    const { container } = render(<Basic multiple />);
    const listbox = await open();
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');

    fireEvent.click(optionNamed('Apple'));
    fireEvent.click(optionNamed('Cherry'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const chips = [
      ...container.querySelectorAll("[data-part='tags'] > [data-ui='tag']:not([data-overflow])"),
    ];
    expect(chips.map((chip) => chip.querySelector("[data-part='label']")?.textContent)).toEqual([
      'Apple',
      'Cherry',
    ]);
    for (const chip of chips) expect(chip.querySelector("[data-part='remove']")).not.toBeNull();
    expect(trigger()).toHaveTextContent('2 selected');

    /* The chip that counts what did not fit is rendered and hidden until the
       collapse reveals it: `createCollapse` measures it to know whether it
       will fit before it draws it. */
    const overflow = container.querySelector("[data-part='tags'] > [data-overflow]");
    expect(overflow).toHaveAttribute('data-ui', 'tag');
    expect(overflow).toHaveAttribute('hidden');
  });

  /**
   * CB11, from this family's side. The button holds focus and
   * `aria-activedescendant` names the option; a press that moved focus to the
   * body would leave the property pointing at something that is not the active
   * element.
   */
  it('keeps DOM focus on the trigger across a press on an option', async () => {
    const onValueChange = vi.fn();
    render(<Basic onValueChange={onValueChange} />);
    await open();

    pressOption(optionNamed('Blueberry'));

    expect(document.activeElement).toBe(trigger());
    expect(onValueChange).toHaveBeenCalledWith(
      'blueberry',
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('keeps it across every press of a multiple selection', async () => {
    const onValueChange = vi.fn();
    render(<Basic multiple onValueChange={onValueChange} />);
    await open();

    pressOption(optionNamed('Apple'));
    pressOption(optionNamed('Cherry'));

    expect(document.activeElement).toBe(trigger());
    expect(onValueChange).toHaveBeenLastCalledWith(
      ['apple', 'cherry'],
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  /**
   * SL10. The control holds one line, so twelve chosen values are three chips
   * and a count. The band at the top of the popup holds all of them, and holds
   * no widget: focus never enters this layer, so a remove control in there
   * would be a tab stop the pattern excludes and a control no keyboard reaches.
   */
  describe('the band of chosen values', () => {
    const band = () => document.querySelector("[data-part='chosen']");

    it('holds every chosen value, whatever the control had room for', async () => {
      render(<Basic multiple />);
      await open();
      fireEvent.click(optionNamed('Apple'));
      fireEvent.click(optionNamed('Blueberry'));
      fireEvent.click(optionNamed('Cherry'));

      const labels = [...(band()?.querySelectorAll("[data-part='label']") ?? [])].map(
        (label) => label.textContent,
      );
      expect(labels).toEqual(['Apple', 'Blueberry', 'Cherry']);
    });

    it('is drawn inside the surface and out of the accessibility tree', async () => {
      render(<Basic multiple defaultValue={['apple']} />);
      const listbox = await open();

      expect(listbox.contains(band())).toBe(true);
      expect(band()).toHaveAttribute('aria-hidden', 'true');
      expect(band()?.querySelector("[data-part='remove']")).toBeNull();
      expect(band()?.querySelector('button')).toBeNull();
    });

    it('is not drawn at all while nothing is chosen, or in single selection', async () => {
      const { unmount } = render(<Basic multiple />);
      await open();
      expect(band()).toBeNull();
      unmount();

      render(<Basic defaultValue="apple" />);
      await open();
      expect(band()).toBeNull();
    });
  });

  it('takes a value out of the selection from its own chip', async () => {
    const onValueChange = vi.fn();
    render(<Basic multiple onValueChange={onValueChange} />);
    await open();
    fireEvent.click(optionNamed('Apple'));
    fireEvent.click(optionNamed('Cherry'));

    fireEvent.click(screen.getByRole('button', { name: 'Remove Apple' }));

    expect(onValueChange).toHaveBeenLastCalledWith(
      ['cherry'],
      expect.objectContaining({ reason: 'select' }),
    );
  });

  it('clears the selection, and says why', async () => {
    const onValueChange = vi.fn();
    render(<Basic clearable defaultValue="apple" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onValueChange).toHaveBeenCalledWith(null, expect.objectContaining({ reason: 'clear' }));
  });

  /**
   * The chips stand over the start of the trigger and the clear button at its
   * end, so the chips' remove buttons come first in the tab order. Angular
   * renders the same order, and the documentation's parity check compares it.
   */
  it('puts the chips before the clear button, in reading and tab order', () => {
    const { container } = render(<Basic clearable defaultValue={['apple', 'cherry']} multiple />);
    const parts = [...container.querySelectorAll("[data-ui='select'] > [data-part]")].map(
      (element) => element.getAttribute('data-part'),
    );
    expect(parts).toEqual(['trigger', 'tags', 'clear', 'arrow']);
  });

  /** Every icon the family owns is a `Glyph` element inside an `Icon` box, never a mask. */
  it('draws the chevron, the cross and the tick as glyph elements', async () => {
    const { container } = render(<Basic clearable defaultValue="apple" />);
    const glyph = (part: string) =>
      container.querySelector(`[data-part='${part}'] > [data-ui='icon'] > svg[data-glyph]`);
    expect(glyph('arrow')).toHaveAttribute('data-glyph', 'chevron-down');
    expect(glyph('clear')).toHaveAttribute('data-glyph', 'x');

    await open();
    const tick = optionNamed('Apple').querySelector(
      "[data-part='indicator'] > [data-ui='icon'] > svg",
    );
    expect(tick).toHaveAttribute('data-glyph', 'check');
  });

  /** The first column holds the artwork it is given; no stylesheet fills it. */
  it('holds an item icon in the first column', async () => {
    render(
      <Basic>
        <SelectItem
          icon={
            <Icon>
              <Glyph name="dot" />
            </Icon>
          }
          value="apple"
        >
          Apple
        </SelectItem>
      </Basic>,
    );
    await open();
    const mark = optionNamed('Apple').querySelector(
      "[data-part='icon'] > [data-ui='icon'] > svg[data-glyph]",
    );
    expect(mark).toHaveAttribute('data-glyph', 'dot');
  });

  it('lets a consumer own the value and refuse a change', async () => {
    function Controlled() {
      const [value, setValue] = useState<SelectSelection>('apple');
      return (
        <Basic
          onValueChange={(next, request) => {
            if (next === 'cherry') request.cancel();
            else setValue(next);
          }}
          value={value}
        />
      );
    }
    render(<Controlled />);
    await open();
    fireEvent.click(optionNamed('Cherry'));
    expect(trigger()).toHaveTextContent('Apple');
  });

  it('opens onto a sentence when it holds no options', async () => {
    render(<Basic>{[]}</Basic>);
    await open();
    expect(screen.getByText('No options')).toBeInTheDocument();
  });

  it('keeps its measure and says it is busy while an answer travels', async () => {
    render(<Basic loading>{[]}</Basic>);
    const listbox = await open();
    expect(listbox).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  /**
   * SL6/CB5: the wait is drawn once, by the two sheets that own it. The
   * control shows the ring `spinner` draws instead of the chevron, and the
   * popup shows three rows the height of an option, drawn by `skeleton`.
   */
  it('shows the ring instead of the chevron, and three rows instead of a sentence, while an answer travels', async () => {
    const { container } = render(<Basic loading>{[]}</Basic>);
    expect(container.querySelector("[data-part='arrow']")).toBeNull();
    const busy = container.querySelector("[data-part='busy']");
    expect(busy).toHaveAttribute('data-ui', 'spinner');

    await open();
    const placeholder = document.querySelector("[data-part='placeholder']");
    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    expect(placeholder?.querySelectorAll("[data-ui='skeleton']")).toHaveLength(3);
  });

  it('names each group by its own label, as the listbox pattern requires', async () => {
    render(
      <Basic>
        <SelectGroup label="Berries">
          <SelectItem value="blueberry">Blueberry</SelectItem>
        </SelectGroup>
      </Basic>,
    );
    await open();
    const group = screen.getByRole('group');
    const labelId = group.getAttribute('aria-labelledby');
    expect(document.getElementById(labelId ?? '')).toHaveTextContent('Berries');
  });

  it('refuses to open, and refuses to move, while it is read-only', async () => {
    const onOpenChange = vi.fn();
    render(<Basic defaultValue="apple" onOpenChange={onOpenChange} readOnly />);
    expect(trigger()).toHaveAttribute('aria-readonly', 'true');
    trigger().focus();
    press('ArrowDown');
    fireEvent.click(trigger());
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('takes disabled, invalid, required and size from the field around it', () => {
    render(
      <Field disabled invalid required size="lg">
        <FieldLabel>Fruit</FieldLabel>
        <Basic />
      </Field>,
    );
    expect(trigger()).toBeDisabled();
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(trigger()).toHaveAttribute('aria-required', 'true');
    expect(trigger().closest("[data-ui='select']")).toHaveAttribute('data-size', 'lg');
  });

  /**
   * Field › wiring.id: the control carries the field's identifier, so the
   * label's `for` reaches the trigger — a button is labelable — and a press on
   * the label focuses it. The popup names the trigger by the same identifier.
   */
  it('is the control the field’s label is for', () => {
    render(
      <Field id="fruit">
        <FieldLabel>Fruit</FieldLabel>
        <Select defaultOpen>
          <SelectTrigger>
            <SelectValue placeholder="Choose a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectContent>
        </Select>
      </Field>,
    );
    const label = screen.getByText('Fruit') as HTMLLabelElement;
    expect(label.control).toBe(trigger());
    expect(trigger()).toHaveAttribute('id', 'fruit-control');
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-labelledby', 'fruit-control');
  });

  /**
   * A press on the field's label reaches the trigger as a click the label
   * forwards: a pointer click (detail 1) whose press went down on the label,
   * not on the control's frame. It focuses the control and leaves the list closed, as the
   * select-only example's label does and as a native select does.
   */
  it('focuses without opening when its field label is pressed', () => {
    render(
      <Field>
        <FieldLabel>Fruit</FieldLabel>
        <Basic />
      </Field>,
    );
    fireEvent.pointerDown(screen.getByText('Fruit'));
    fireEvent.click(trigger(), { detail: 1, clientX: -40, clientY: -20 });
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');

    fireEvent.pointerDown(trigger());
    fireEvent.click(trigger(), { detail: 1, clientX: 0, clientY: 0 });
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  });

  /**
   * The highlight is brought into view by scrolling the list alone. A
   * `scrollIntoView` scrolls every ancestor as well, and on the first open it
   * runs before the popup is positioned — so a select far down a page sent the
   * page to its top, and the popup, its control now out of view, hid itself.
   */
  it('scrolls the list to the highlight, and never the page', async () => {
    const original = Element.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      render(<Basic />);
      const listbox = await open();
      Object.defineProperty(listbox, 'clientHeight', { configurable: true, value: 100 });
      Object.defineProperty(listbox, 'scrollTop', { configurable: true, writable: true, value: 0 });
      listbox.getBoundingClientRect = () =>
        DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 100 });
      optionNamed('Cherry').getBoundingClientRect = () =>
        DOMRect.fromRect({ x: 0, y: 130, width: 200, height: 30 });
      press('End');
      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(listbox.scrollTop).toBe(60);
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  /**
   * The popup is bounded by the height the positioner reports, and that height
   * arrives after the highlight lands on the selected option. Revealed only
   * then, the row was measured inside an unbounded list and stayed below the
   * fold once the list took its height.
   */
  it('shows the selected option once the popup has taken its height', async () => {
    const bounded = (element: Element) =>
      element
        .closest<HTMLElement>("[data-part='positioner']")
        ?.style.getPropertyValue('--slotted-positioner-available-height') !== '';
    const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      if (this.getAttribute('role') === 'listbox') {
        return DOMRect.fromRect({ x: 0, y: 0, width: 200, height: bounded(this) ? 100 : 400 });
      }
      if (this.getAttribute('data-value') === 'cherry') {
        return DOMRect.fromRect({ x: 0, y: 130, width: 200, height: 30 });
      }
      return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
    });
    const height = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        if (this.getAttribute('role') !== 'listbox') return 0;
        return bounded(this) ? 100 : 400;
      });
    const scrolled = new Map<Element, number>();
    const scrollTop = vi.spyOn(Element.prototype, 'scrollTop', 'get').mockImplementation(function (
      this: Element,
    ) {
      return scrolled.get(this) ?? 0;
    });
    const setScrollTop = vi
      .spyOn(Element.prototype, 'scrollTop', 'set')
      .mockImplementation(function (this: Element, next: number) {
        scrolled.set(this, next);
      });
    try {
      render(<Basic defaultValue="cherry" />);
      const listbox = await open();
      await waitFor(() => expect(listbox.scrollTop).toBe(60));
    } finally {
      rect.mockRestore();
      height.mockRestore();
      scrollTop.mockRestore();
      setScrollTop.mockRestore();
    }
  });

  /** The trigger is the field's control, so the field has nothing to warn about. */
  it('registers with the field as its control', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Field>
        <FieldLabel>Fruit</FieldLabel>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectContent>
        </Select>
      </Field>,
    );
    const warnings = warn.mock.calls.map((call) => String(call[0]));
    warn.mockRestore();
    expect(warnings.filter((message) => message.includes('without a control'))).toEqual([]);
  });

  it('submits through a real select, so a plain form and reset() both work', async () => {
    render(<Basic defaultValue="apple" name="fruit" />);
    const native = document.querySelector<HTMLSelectElement>("select[name='fruit']");
    expect(native).not.toBeNull();
    expect(native?.value).toBe('apple');
    expect(native).toHaveAttribute('aria-hidden', 'true');
  });

  /**
   * A native reset puts the hidden select's own options back and tells nothing,
   * so the control kept the last value chosen while the form it belongs to had
   * been reset. The select listens for its form's reset and returns to
   * `defaultValue`, as a native select does.
   */
  it('returns to its default value when its form is reset', async () => {
    render(
      <form data-testid="form">
        <Basic defaultValue="apple" name="fruit" />
      </form>,
    );
    await open();
    pressOption(optionNamed('Cherry'));
    expect(trigger()).toHaveTextContent('Cherry');

    act(() => (screen.getByTestId('form') as HTMLFormElement).reset());
    expect(trigger()).toHaveTextContent('Apple');
    expect(document.querySelector<HTMLSelectElement>("select[name='fruit']")?.value).toBe('apple');
  });

  it('speaks the language in force, and lays its own messages over it', async () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Basic
          clearable
          defaultValue={['apple', 'cherry']}
          messages={{ clear: 'Esvaziar' }}
          multiple
        />
      </SlottedProvider>,
    );
    expect(trigger()).toHaveTextContent('2 selecionados');
    expect(await screen.findByRole('button', { name: 'Remover Apple' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Esvaziar' })).toBeInTheDocument();
  });

  it('lets an application set its defaults once', async () => {
    render(
      <SelectDefaultsProvider size="sm" variant="subtle">
        <Basic />
      </SelectDefaultsProvider>,
    );
    const root = trigger().closest("[data-ui='select']");
    expect(root).toHaveAttribute('data-size', 'sm');
    expect(root).toHaveAttribute('data-variant', 'subtle');
  });

  it('runs the consumer’s own handler as well as its own', async () => {
    const onClick = vi.fn();
    render(
      <Select>
        <SelectTrigger aria-label="Fruit" onClick={onClick}>
          <SelectValue placeholder="Choose a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    fireEvent.click(trigger());
    expect(onClick).toHaveBeenCalled();
    await screen.findByRole('listbox');
  });

  it('writes every state a consumer may style into the DOM', async () => {
    render(<Basic defaultValue="apple" invalid required />);
    const root = trigger().closest("[data-ui='select']");
    for (const state of ['data-invalid', 'data-required', 'data-full-width']) {
      expect(root).toHaveAttribute(state);
    }
    await open();
    expect(optionNamed('Apple')).toHaveAttribute('data-selected');
  });

  describe('search', () => {
    function Searchable({ children, ...props }: Partial<SelectProps>) {
      return (
        <Select search {...props}>
          <SelectTrigger aria-label="Fruit">
            <SelectValue placeholder="Choose a fruit" />
          </SelectTrigger>
          <SelectContent>
            {children ?? (
              <>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="blueberry">Blueberry</SelectItem>
                <SelectItem value="cherry">Cherry</SelectItem>
                <SelectItem value="raspberry">Raspberry</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      );
    }

    const field = () => screen.getByRole('combobox', { name: 'Search options' });
    const openSearch = async () => {
      trigger().focus();
      fireEvent.click(trigger());
      const input = await screen.findByRole('combobox', { name: 'Search options' });
      await waitFor(() => expect(input).toHaveFocus());
      return input;
    };
    const type = (value: string) => fireEvent.change(field(), { target: { value } });
    const labels = () => screen.getAllByRole('option').map((option) => option.textContent);

    it('draws the magnifier as a glyph element', async () => {
      render(<Searchable />);
      await openSearch();
      const magnifier = document.querySelector(
        "[data-part='search-icon'] > [data-ui='icon'] > svg[data-glyph]",
      );
      expect(magnifier).toHaveAttribute('data-glyph', 'search');
    });

    /**
     * The popup stops being a listbox and becomes a dialog holding one, which
     * is the composition the combobox pattern names: "the popup is an element
     * that has role listbox, tree, grid, or dialog", and a popup that is not a
     * listbox is named by `aria-haspopup` on the control.
     */
    it('opens a dialog holding a listbox, and says so on the trigger', async () => {
      render(<Searchable />);
      expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');

      const input = await openSearch();
      const dialog = screen.getByRole('dialog');
      expect(trigger()).toHaveAttribute('aria-controls', dialog.id);
      expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
      expect(contract.searchRoles.content).toBe('dialog');
    });

    /** The pattern: a dialog popup does not support aria-activedescendant, so focus moves in. */
    it('takes focus into the field however the popup was opened, and gives it back', async () => {
      render(<Searchable />);
      const input = await openSearch();
      expect(trigger()).not.toHaveAttribute('aria-activedescendant');

      press('ArrowDown');
      expect(input).toHaveAttribute('aria-activedescendant');

      press('Escape');
      await waitFor(() => expect(trigger()).toHaveFocus());
    });

    it('filters the options and marks the span the query matched', async () => {
      render(<Searchable />);
      await openSearch();
      type('berr');

      await waitFor(() => expect(labels()).toEqual(['Blueberry', 'Raspberry']));
      const marks = screen.getAllByText('berr');
      expect(marks).toHaveLength(2);
      for (const mark of marks) {
        expect(mark).toHaveAttribute('data-part', 'match');
        expect(mark.parentElement).toHaveAttribute('data-ui', 'highlight');
      }
    });

    /** The reader typed four characters and pressed Enter; they mean the first row they can see. */
    it('moves the highlight onto the first surviving option as the query changes', async () => {
      render(<Searchable />);
      const input = await openSearch();
      type('rasp');

      await waitFor(() =>
        expect(input.getAttribute('aria-activedescendant')).toBe(
          screen.getByRole('option', { name: 'Raspberry' }).id,
        ),
      );

      press('Enter');
      await waitFor(() => expect(trigger()).toHaveTextContent('Raspberry'));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(trigger()).toHaveFocus();
    });

    /**
     * The query first, the popup second. A reader four characters into a search
     * wants the whole list back more often than they want the popup gone.
     */
    it('clears the query on the first Escape and closes on the second', async () => {
      render(<Searchable />);
      await openSearch();
      type('berr');
      await waitFor(() => expect(labels()).toHaveLength(2));

      press('Escape');
      await waitFor(() => expect(labels()).toHaveLength(4));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(field()).toHaveValue('');

      press('Escape');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    /**
     * Tab keeps the effect the closed control's Tab has — commit, close, move
     * on — and only the mechanism differs: focus is inside a portalled layer at
     * the end of the document, so the browser's own next element is the end of
     * the page rather than the element after the control.
     */
    it('commits on Tab and leaves the control for the element beside it', async () => {
      render(
        <>
          <button type="button">before</button>
          <Searchable />
          <button type="button">after</button>
        </>,
      );

      await openSearch();
      press('ArrowDown');
      press('Tab');

      await waitFor(() => expect(screen.getByRole('button', { name: 'after' })).toHaveFocus());
      /* ArrowDown moved the highlight off the entry option, and Tab took what
         the highlight was on rather than what the popup opened onto. */
      expect(trigger()).toHaveTextContent('Blueberry');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('goes back the way it came under Shift', async () => {
      render(
        <>
          <button type="button">before</button>
          <Searchable />
          <button type="button">after</button>
        </>,
      );

      await openSearch();
      press('Tab', { shiftKey: true });
      await waitFor(() => expect(screen.getByRole('button', { name: 'before' })).toHaveFocus());
    });

    /** Space types a space; the closed control spends it on a commit and this one cannot. */
    it('leaves the space bar, Home and End to the browser', async () => {
      render(<Searchable />);
      const input = await openSearch();
      press('ArrowDown');
      const held = input.getAttribute('aria-activedescendant');

      for (const key of [' ', 'Home', 'End']) {
        const event = fireEvent.keyDown(input, { key });
        expect(event, `${key} was prevented`).toBe(true);
      }
      expect(input.getAttribute('aria-activedescendant')).toBe(held);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('announces how many options survived the query', async () => {
      render(<Searchable />);
      await openSearch();
      expect(screen.getByRole('status')).toHaveTextContent('4 results');

      type('berr');
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('2 results'));
    });

    /** A server-filtered list decides nothing here, and the family must not filter it twice. */
    it('renders the window it was given when filter is null', async () => {
      render(<Searchable filter={null} />);
      await openSearch();
      type('nothing matches this');
      await waitFor(() => expect(labels()).toHaveLength(4));
    });

    it('replaces the comparison when a filter is given', async () => {
      const filter = vi.fn((label: string, query: string) => label.startsWith(query));
      render(<Searchable filter={filter} />);
      await openSearch();
      type('Ch');
      await waitFor(() => expect(labels()).toEqual(['Cherry']));
      expect(filter).toHaveBeenCalledWith('Apple', 'Ch');
    });

    /** Two searches on one keystroke would move the highlight twice per character. */
    it('turns typeahead off, so a printable key only types', async () => {
      render(<Searchable typeahead />);
      trigger().focus();
      fireEvent.keyDown(trigger(), { key: 'c' });

      const input = await screen.findByRole('combobox', { name: 'Search options' });
      await waitFor(() => expect(input).toHaveValue('c'));
      await waitFor(() => expect(labels()).toEqual(['Cherry']));
    });

    /**
     * The query is a value the consumer can own, and it is not the selection:
     * one request each, and neither carries the other.
     */
    it('asks before the query moves, with a reason that is not the selection’s', async () => {
      const onSearchValueChange = vi.fn();
      const onValueChange = vi.fn();
      render(
        <Searchable onSearchValueChange={onSearchValueChange} onValueChange={onValueChange} />,
      );

      await openSearch();
      type('ch');
      expect(onSearchValueChange).toHaveBeenLastCalledWith(
        'ch',
        expect.objectContaining({ reason: 'keyboard' }),
      );
      expect(onValueChange).not.toHaveBeenCalled();
      expect(contract.stateModel.value.request).toBe('onSearchValueChange');
    });

    /** A list still filtered to the row the reader has just taken looks broken. */
    it('empties the query when an option is taken and the popup stays open', async () => {
      const onSearchValueChange = vi.fn();
      render(<Searchable multiple onSearchValueChange={onSearchValueChange} />);
      await openSearch();
      type('berr');
      await waitFor(() => expect(labels()).toHaveLength(2));

      pressOption(optionNamed('Blueberry'));
      await waitFor(() => expect(labels()).toHaveLength(4));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(onSearchValueChange).toHaveBeenLastCalledWith(
        '',
        expect.objectContaining({ reason: 'select' }),
      );
    });

    /** A heading with no options under it says a category matched when none did. */
    it('hides a group whose every option was filtered away', async () => {
      render(
        <Searchable>
          <SelectGroup label="Berries">
            <SelectItem value="blueberry">Blueberry</SelectItem>
          </SelectGroup>
          <SelectGroup label="Citrus">
            <SelectItem value="lime">Lime</SelectItem>
          </SelectGroup>
        </Searchable>,
      );

      await openSearch();
      type('berr');
      await waitFor(() => expect(screen.getAllByRole('group')).toHaveLength(1));
      expect(screen.getAllByRole('group', { hidden: true })).toHaveLength(2);
      expect(screen.getByRole('group')).toHaveAttribute('aria-labelledby');
      expect(screen.getByText('Citrus').closest("[data-part='group']")).toHaveAttribute('hidden');
    });

    it('opens onto a sentence when the query matches nothing', async () => {
      render(<Searchable />);
      await openSearch();
      type('zzz');
      await waitFor(() => expect(screen.getByText('No options')).toBeInTheDocument());
      expect(screen.queryAllByRole('option')).toHaveLength(0);
    });

    /* The field is built with the popup, so a reopened select never filters on
       characters nobody typed this time. */
    it('forgets the query when the popup closes', async () => {
      render(<Searchable />);
      await openSearch();
      type('berr');
      press('Escape');
      press('Escape');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

      await openSearch();
      expect(field()).toHaveValue('');
      expect(labels()).toHaveLength(4);
    });
  });
});
