import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/combobox/contract.json';
import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { Glyph, Icon } from '../icon';
import { Combobox } from './combobox';
import { ComboboxDefaultsProvider } from './combobox-defaults';
import { ComboboxGroup, ComboboxItem } from './combobox-items';
import { ComboboxContent, ComboboxInput } from './combobox-parts';
import type { ComboboxHandle, ComboboxProps } from './combobox.types';

const FRUIT = ['Blueberry', 'Raspberry', 'Cloudberry', 'Grapefruit', 'Pomelo'];

function Basic({ children, ...props }: Partial<ComboboxProps>) {
  return (
    <Combobox {...props}>
      <ComboboxInput aria-label="Fruit" />
      <ComboboxContent aria-label="Fruit">
        {children ??
          FRUIT.map((label) => (
            <ComboboxItem disabled={label === 'Cloudberry'} key={label} value={label.toLowerCase()}>
              {label}
            </ComboboxItem>
          ))}
      </ComboboxContent>
    </Combobox>
  );
}

const input = () => screen.getByRole('combobox', { name: 'Fruit' });
const press = (key: string, options: Record<string, unknown> = {}) =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key, ...options });
const type = (value: string) => fireEvent.change(input(), { target: { value } });
const optionNamed = (name: string) => screen.getByRole('option', { name });
const highlighted = () => input().getAttribute('aria-activedescendant');
const listed = () => screen.queryAllByRole('option').map((option) => option.textContent);

/**
 * What a browser does with a press on an option, in the order it does it. The
 * focus move is the press's default action, so an option that refuses the press
 * leaves focus where it was — and only a press that moved focus produces the
 * `blur` that follows it. `click` is dispatched either way (CB11).
 */
const pressOption = (option: HTMLElement) => {
  const focusMoves = fireEvent.pointerDown(option);
  if (focusMoves) act(() => (document.activeElement as HTMLElement | null)?.blur());
  /* And `inert` swallows it: a browser dispatches no click into a subtree the
     layer has switched off, which jsdom does not model. */
  if (option.closest('[inert]') !== null) return;
  fireEvent.click(option);
};

const openByArrow = async () => {
  input().focus();
  press('ArrowDown');
  return screen.findByRole('listbox');
};

describe('Combobox', () => {
  it('is a combobox that controls a listbox, and says which autocomplete it does', async () => {
    render(<Basic />);
    expect(input()).toHaveAttribute('aria-autocomplete', 'list');
    expect(input()).toHaveAttribute('aria-expanded', 'false');
    const listbox = await openByArrow();
    expect(input()).toHaveAttribute('aria-controls', listbox.id);
    expect(contract.roles.input).toBe('combobox');
  });

  /**
   * `scrollIntoView` scrolls every ancestor, and on the first open it runs
   * before the popup is positioned: a control far down a page sent the page to
   * its top. The fix select and multi-select took.
   */
  it('scrolls the list to the highlight, and never the page', async () => {
    const original = Element.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      const handle = { current: null as ComboboxHandle | null };
      render(<Basic ref={(node: ComboboxHandle | null) => void (handle.current = node)} />);
      const listbox = await openByArrow();
      Object.defineProperty(listbox, 'clientHeight', { configurable: true, value: 100 });
      Object.defineProperty(listbox, 'scrollTop', { configurable: true, writable: true, value: 0 });
      listbox.getBoundingClientRect = () =>
        DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 100 });
      optionNamed('Pomelo').getBoundingClientRect = () =>
        DOMRect.fromRect({ x: 0, y: 130, width: 200, height: 30 });
      for (let step = 0; step < FRUIT.length; step += 1) {
        if (highlighted() === optionNamed('Pomelo').id) break;
        press('ArrowDown');
      }
      expect(highlighted()).toBe(optionNamed('Pomelo').id);
      expect(listbox.scrollTop).toBe(60);

      listbox.scrollTop = 0;
      act(() => handle.current?.scrollToKey('pomelo'));
      expect(listbox.scrollTop).toBe(60);
      expect(scrollIntoView).not.toHaveBeenCalled();
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it('keeps DOM focus on the input for the whole interaction', async () => {
    render(<Basic />);
    await openByArrow();
    press('ArrowDown');
    press('PageDown');
    expect(document.activeElement).toBe(input());
  });

  it('filters the list as the reader types, and marks what matched', async () => {
    render(<Basic />);
    input().focus();
    type('berr');
    await screen.findByRole('listbox');
    expect(listed()).toEqual(['Blueberry', 'Raspberry', 'Cloudberry']);
    expect(optionNamed('Blueberry').querySelector("[data-part='match']")).toHaveTextContent('berr');
  });

  /**
   * R6/CB6: the mark is the `highlight` family's. Its root sits inside this
   * family's label and the `mark` is its part, so one sheet paints the span
   * every list a reader types into found.
   */
  it('renders the highlight family inside the label it marked', async () => {
    render(<Basic />);
    input().focus();
    type('berr');
    await screen.findByRole('listbox');
    const root = optionNamed('Blueberry').querySelector(
      "[data-part='label'] > [data-ui='highlight']",
    );
    expect(root).toHaveAttribute('data-part', 'root');
    const mark = root?.querySelector("[data-part='match']");
    expect(mark?.tagName).toBe('MARK');
    expect(mark).not.toHaveAttribute('data-ui');
  });

  /** §2.9: the comparison is the reader's locale's, not an English fold. */
  it('matches across an accent, and marks the span the collator matched', async () => {
    render(
      <Basic>
        <ComboboxItem value="resume">Resumé</ComboboxItem>
      </Basic>,
    );
    input().focus();
    type('resume');
    await screen.findByRole('listbox');
    expect(listed()).toEqual(['Resumé']);
    expect(optionNamed('Resumé').querySelector("[data-part='match']")).toHaveTextContent('Resumé');
  });

  it('takes a filter of the consumer’s own', async () => {
    render(
      <Basic filter={(label, query) => label.toLowerCase().startsWith(query.toLowerCase())} />,
    );
    input().focus();
    type('berr');
    await screen.findByRole('listbox');
    expect(listed()).toEqual([]);
  });

  /** A list a server has already filtered: the family renders the window it got. */
  it('filters nothing when filtering is turned off', async () => {
    render(<Basic filter={null} />);
    input().focus();
    type('zzz');
    await screen.findByRole('listbox');
    expect(listed()).toHaveLength(FRUIT.length);
  });

  it('opens onto no highlight, so Enter commits nothing the reader did not look at', async () => {
    render(<Basic />);
    input().focus();
    type('berr');
    await screen.findByRole('listbox');
    expect(highlighted()).toBeNull();
  });

  it('highlights the first match when it is asked to', async () => {
    render(<Basic autoHighlight />);
    input().focus();
    type('berr');
    await screen.findByRole('listbox');
    await waitFor(() => expect(highlighted()).toBe(optionNamed('Blueberry').id));
  });

  /**
   * The contract's focus.onOpen: the highlight goes to the selected option, to
   * the first when autoHighlight is set. A press opens the popup before the
   * reader types, so the typing after it must still leave a match under Enter.
   */
  it('highlights the first match after a press opened the popup, and as the reader types', async () => {
    render(<Basic autoHighlight />);
    input().focus();
    fireEvent.click(input());
    await screen.findByRole('listbox');
    await waitFor(() => expect(highlighted()).toBe(optionNamed('Blueberry').id));
    type('fruit');
    await waitFor(() => expect(highlighted()).toBe(optionNamed('Grapefruit').id));
    press('Enter');
    expect(input()).toHaveValue('Grapefruit');
  });

  it('commits the highlighted option into both contracts, each with its own request', async () => {
    const onValueChange = vi.fn();
    const onInputValueChange = vi.fn();
    render(<Basic onInputValueChange={onInputValueChange} onValueChange={onValueChange} />);
    await openByArrow();
    press('Enter');

    expect(onValueChange).toHaveBeenCalledWith(
      'blueberry',
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(onInputValueChange).toHaveBeenLastCalledWith(
      'Blueberry',
      expect.objectContaining({ reason: 'select' }),
    );
  });

  it('emits only the text request while the reader is typing', async () => {
    const onValueChange = vi.fn();
    const onInputValueChange = vi.fn();
    render(<Basic onInputValueChange={onInputValueChange} onValueChange={onValueChange} />);
    input().focus();
    type('be');
    expect(onInputValueChange).toHaveBeenCalledWith(
      'be',
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('refuses to commit on Tab, which is where it parts company with select', async () => {
    const onValueChange = vi.fn();
    render(<Basic onValueChange={onValueChange} />);
    await openByArrow();
    fireEvent.keyDown(input(), { key: 'Tab' });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('reverts the text on Escape, and clears the selection on a second press', async () => {
    render(<Basic />);
    await openByArrow();
    press('Enter');
    await waitFor(() => expect(input()).toHaveValue('Blueberry'));

    type('Blue');
    press('Escape');
    press('Escape');
    await waitFor(() => expect(input()).toHaveValue('Blueberry'));
    press('Escape');
    expect(input()).toHaveValue('');
  });

  it('commits what was typed when a custom value is allowed', async () => {
    const onValueChange = vi.fn();
    render(<Basic allowsCustomValue onValueChange={onValueChange} />);
    input().focus();
    type('Durian');
    await screen.findByRole('listbox');
    press('Enter');
    expect(onValueChange).toHaveBeenCalledWith('Durian', expect.anything());
  });

  it('puts the text back when a custom value is not allowed', async () => {
    render(<Basic />);
    input().focus();
    type('Durian');
    await screen.findByRole('listbox');
    press('Enter');
    await waitFor(() => expect(input()).toHaveValue(''));
  });

  it('skips a disabled option and never commits one', async () => {
    render(<Basic />);
    await openByArrow();
    expect(highlighted()).toBe(optionNamed('Blueberry').id);
    press('ArrowDown');
    expect(highlighted()).toBe(optionNamed('Raspberry').id);
    /* Cloudberry sits between Raspberry and Grapefruit and is disabled. */
    press('ArrowDown');
    expect(highlighted()).toBe(optionNamed('Grapefruit').id);
  });

  it('leaves every text-editing key to the browser', async () => {
    render(<Basic />);
    await openByArrow();
    for (const key of ['Home', 'End', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete']) {
      expect(fireEvent.keyDown(input(), { key })).toBe(true);
    }
  });

  it('writes the completion into the input as a selected range', async () => {
    render(<Basic autocomplete="both" />);
    input().focus();
    type('blue');
    await screen.findByRole('listbox');
    await waitFor(() => expect(input()).toHaveValue('Blueberry'));
    expect((input() as HTMLInputElement).selectionStart).toBe(4);
    expect((input() as HTMLInputElement).selectionEnd).toBe('Blueberry'.length);
  });

  it('offers no completion while the reader is deleting', async () => {
    render(<Basic autocomplete="both" />);
    input().focus();
    type('blue');
    await screen.findByRole('listbox');
    await waitFor(() => expect(input()).toHaveValue('Blueberry'));
    type('blu');
    await waitFor(() => expect(input()).toHaveValue('blu'));
  });

  it('opens only when it is asked to', async () => {
    render(<Basic openOn="manual" />);
    input().focus();
    type('be');
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show options' }));
    await screen.findByRole('listbox');
  });

  /**
   * The contract's `opening.press`: a press on the input opens a closed popup
   * under `input` and `focus`, never closes an open one, and under `manual`
   * only places the caret.
   */
  describe('a press on the input', () => {
    it('opens a closed popup, once, with reason pointer', async () => {
      const onOpenChange = vi.fn();
      render(<Basic onOpenChange={onOpenChange} />);
      input().focus();
      fireEvent.click(input());
      await screen.findByRole('listbox');
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(
        true,
        expect.objectContaining({ reason: 'pointer' }),
      );
    });

    it('keeps an open popup open', async () => {
      const onOpenChange = vi.fn();
      render(<Basic onOpenChange={onOpenChange} />);
      await openByArrow();
      onOpenChange.mockClear();
      fireEvent.click(input());
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('opens nothing on a Tab into the input under input', () => {
      render(<Basic />);
      input().focus();
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(input()).toHaveAttribute('aria-expanded', 'false');
    });

    it('only places the caret under manual', () => {
      const onOpenChange = vi.fn();
      render(<Basic onOpenChange={onOpenChange} openOn="manual" />);
      input().focus();
      fireEvent.click(input());
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('opens once under focus, through the focus the press gave', async () => {
      const onOpenChange = vi.fn();
      render(<Basic onOpenChange={onOpenChange} openOn="focus" />);
      /* A browser dispatches the focus and the click in separate tasks, so the
         focus's render lands before the click reads the state. */
      act(() => input().focus());
      fireEvent.click(input());
      await screen.findByRole('listbox');
      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    it('opens nothing on a read-only control', () => {
      const onOpenChange = vi.fn();
      render(<Basic onOpenChange={onOpenChange} readOnly />);
      input().focus();
      fireEvent.click(input());
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('stays closed when the consumer prevents the click', () => {
      const onOpenChange = vi.fn();
      render(
        <Combobox onOpenChange={onOpenChange}>
          <ComboboxInput aria-label="Fruit" onClick={(event) => event.preventDefault()} />
          <ComboboxContent aria-label="Fruit">
            <ComboboxItem value="blueberry">Blueberry</ComboboxItem>
          </ComboboxContent>
        </Combobox>,
      );
      input().focus();
      fireEvent.click(input());
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  it('keeps the trigger out of the page tab sequence, as the pattern asks', () => {
    render(<Basic />);
    expect(screen.getByRole('button', { name: 'Show options' })).toHaveAttribute('tabindex', '-1');
  });

  it('says how many options answered, in a live region', async () => {
    render(<Basic />);
    input().focus();
    type('berr');
    await screen.findByRole('listbox');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('3 results'));
  });

  it('opens onto a sentence when nothing matched', async () => {
    render(<Basic />);
    input().focus();
    type('zzz');
    await screen.findByRole('listbox');
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('keeps its measure and says it is busy while an answer travels', async () => {
    render(<Basic loading>{[]}</Basic>);
    const listbox = await openByArrow();
    expect(listbox).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  /**
   * SL6/CB5: the wait is drawn once, by the two sheets that own it. The control
   * shows the ring `spinner` draws instead of the chevron, and the popup shows
   * three rows the height of an option, drawn by `skeleton`.
   */
  it('shows the ring instead of the chevron, and three rows instead of a sentence, while an answer travels', async () => {
    const { container } = render(<Basic loading>{[]}</Basic>);
    expect(container.querySelector("[data-part='arrow']")).toBeNull();
    expect(container.querySelector("[data-part='busy']")).toHaveAttribute('data-ui', 'spinner');

    await openByArrow();
    const placeholder = document.querySelector("[data-part='placeholder']");
    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    expect(placeholder?.querySelectorAll("[data-ui='skeleton']")).toHaveLength(3);
  });

  /**
   * CB7. An editable combobox lets a reader type anything, and the pattern says
   * nothing about text that matched no option. Which answer is right depends on
   * the field, so it is a prop; the default refuses, because a field that keeps
   * text nothing was chosen for is a field whose value and picture disagree.
   */
  describe('text that matches no option', () => {
    it('puts the field back to the committed value when it leaves, and says what it refused', () => {
      const onInputReset = vi.fn();
      const onValueChange = vi.fn();
      render(
        <Basic
          defaultInputValue="Apple"
          defaultValue="apple"
          items={[{ label: 'Apple', value: 'apple' }]}
          onInputReset={onInputReset}
          onValueChange={onValueChange}
        />,
      );
      input().focus();
      type('appl');
      fireEvent.blur(input(), { relatedTarget: null });

      expect(input()).toHaveValue('Apple');
      expect(onInputReset).toHaveBeenCalledWith(
        'appl',
        expect.objectContaining({ reason: 'blur' }),
      );
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('empties the field when nothing was ever committed', () => {
      render(<Basic />);
      input().focus();
      type('zzz');
      fireEvent.blur(input(), { relatedTarget: null });

      expect(input()).toHaveValue('');
    });

    it('takes the text as the value when the field allows one of its own', () => {
      const onValueChange = vi.fn();
      const onInputReset = vi.fn();
      render(<Basic allowsCustomValue onInputReset={onInputReset} onValueChange={onValueChange} />);
      input().focus();
      type('kumquat');
      fireEvent.blur(input(), { relatedTarget: null });

      expect(input()).toHaveValue('kumquat');
      expect(onValueChange).toHaveBeenCalledWith(
        'kumquat',
        expect.objectContaining({ reason: 'blur' }),
      );
      expect(onInputReset).not.toHaveBeenCalled();
    });

    it('commits an option a reader typed in full rather than refusing it', () => {
      const onValueChange = vi.fn();
      render(
        <Basic
          items={[{ label: 'Blueberry', value: 'blueberry' }]}
          onValueChange={onValueChange}
        />,
      );
      input().focus();
      type('Blueberry');
      fireEvent.blur(input(), { relatedTarget: null });

      expect(onValueChange).toHaveBeenCalledWith(
        'blueberry',
        expect.objectContaining({ reason: 'blur' }),
      );
      expect(input()).toHaveValue('Blueberry');
    });
  });

  /**
   * CB11. The pointer is the primary interaction of the family, and it crosses
   * the one place the family gives up: a press on an option is a press on
   * something that cannot hold focus, so the browser takes focus off the input
   * and the settling of CB7 runs on text the reader was in the middle of using.
   */
  describe('choosing with the pointer', () => {
    it('selects the option that was clicked, with a query in the field', async () => {
      const onValueChange = vi.fn();
      render(<Basic onValueChange={onValueChange} />);
      input().focus();
      type('berr');
      await screen.findByRole('listbox');

      pressOption(optionNamed('Raspberry'));

      expect(onValueChange).toHaveBeenCalledWith(
        'raspberry',
        expect.objectContaining({ reason: 'pointer' }),
      );
      expect(input()).toHaveValue('Raspberry');
    });

    it('keeps DOM focus on the input across the press', async () => {
      render(<Basic />);
      input().focus();
      type('berr');
      await screen.findByRole('listbox');

      pressOption(optionNamed('Raspberry'));

      expect(document.activeElement).toBe(input());
    });

    it('does not settle the query as a value the press was about to replace', async () => {
      const onInputReset = vi.fn();
      render(<Basic onInputReset={onInputReset} />);
      input().focus();
      type('berr');
      await screen.findByRole('listbox');

      pressOption(optionNamed('Cloudberry'));

      /* Disabled: the press changes nothing, and refuses nothing either. */
      expect(onInputReset).not.toHaveBeenCalled();
      expect(input()).toHaveValue('berr');
    });
  });

  /**
   * CB8. A reader who typed something the list does not hold has either
   * mistyped or means to add it, and only the consumer knows which of its
   * collections can grow: the family draws the offer and reports it.
   */
  describe('creating a value the list does not hold', () => {
    it('offers the query as a last option, in place of the empty message', async () => {
      render(<Basic onCreate={vi.fn()} />);
      input().focus();
      type('durian');
      await screen.findByRole('listbox');

      expect(screen.queryByText('No matches')).toBeNull();
      const create = screen.getByRole('option', { name: 'Create “durian”' });
      expect(create).toHaveAttribute('data-part', 'item');
      expect(listed()).toEqual(['Create “durian”']);
    });

    it('offers nothing while something matched, or while the field is empty', async () => {
      render(<Basic onCreate={vi.fn()} />);
      input().focus();
      type('berr');
      await screen.findByRole('listbox');
      expect(screen.queryByRole('option', { name: /Create/ })).toBeNull();

      type('');
      expect(screen.queryByRole('option', { name: /Create/ })).toBeNull();
    });

    it('offers nothing at all when the field cannot create', async () => {
      render(<Basic />);
      input().focus();
      type('durian');
      await screen.findByRole('listbox');
      expect(screen.queryByRole('option', { name: /Create/ })).toBeNull();
      expect(screen.getByText('No matches')).toBeInTheDocument();
    });

    it('reports the query and selects nothing when the offer is taken by pointer', async () => {
      const onCreate = vi.fn();
      const onValueChange = vi.fn();
      render(<Basic onCreate={onCreate} onValueChange={onValueChange} />);
      input().focus();
      type('durian');
      await screen.findByRole('listbox');
      fireEvent.click(screen.getByRole('option', { name: 'Create “durian”' }));

      expect(onCreate).toHaveBeenCalledWith(
        'durian',
        expect.objectContaining({ reason: 'pointer' }),
      );
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('is an option the keyboard reaches and Enter takes', async () => {
      const onCreate = vi.fn();
      render(<Basic onCreate={onCreate} />);
      input().focus();
      type('durian');
      await screen.findByRole('listbox');
      press('ArrowDown');
      expect(highlighted()).toBe(screen.getByRole('option', { name: 'Create “durian”' }).id);
      press('Enter');

      expect(onCreate).toHaveBeenCalledWith(
        'durian',
        expect.objectContaining({ reason: 'keyboard' }),
      );
    });
  });

  it('hides a group whose every option was filtered away', async () => {
    render(
      <Basic>
        <ComboboxGroup label="Berries">
          <ComboboxItem value="blueberry">Blueberry</ComboboxItem>
        </ComboboxGroup>
        <ComboboxGroup label="Citrus">
          <ComboboxItem value="pomelo">Pomelo</ComboboxItem>
        </ComboboxGroup>
      </Basic>,
    );
    input().focus();
    type('berry');
    await screen.findByRole('listbox');
    await waitFor(() => expect(screen.getAllByRole('group', { hidden: false })).toHaveLength(1));
  });

  /**
   * CB13. The group above measured itself on the render that built the popup,
   * and never again: its props are the same element on both sides of a
   * keystroke, so React bailed out of re-rendering it and the effect that
   * counts the surviving options did not run. A category emptied by a query
   * typed after the popup was already open stayed on the surface with nothing
   * under it. The group now reads the query, which is what makes it re-render.
   */
  it('hides a group emptied by a query typed after the popup was open', async () => {
    render(
      <Basic>
        <ComboboxGroup label="Berries">
          <ComboboxItem value="blueberry">Blueberry</ComboboxItem>
        </ComboboxGroup>
        <ComboboxGroup label="Citrus">
          <ComboboxItem value="pomelo">Pomelo</ComboboxItem>
        </ComboboxGroup>
      </Basic>,
    );
    input().focus();
    /* A letter both labels hold, so the popup opens with both groups standing
       and the second query is what empties one of them. */
    type('e');
    await screen.findByRole('listbox');
    await waitFor(() => expect(screen.getAllByRole('group', { hidden: false })).toHaveLength(2));

    type('berry');
    await waitFor(() => expect(screen.getAllByRole('group', { hidden: false })).toHaveLength(1));
  });

  /** Every icon the family owns is a `Glyph` element inside an `Icon` box, never a mask. */
  it('draws the chevron, the cross and the tick as glyph elements', async () => {
    const { container } = render(<Basic defaultInputValue="Blueberry" defaultValue="blueberry" />);
    const glyph = (part: string) =>
      container.querySelector(`[data-part='${part}'] > [data-ui='icon'] > svg[data-glyph]`);
    expect(glyph('arrow')).toHaveAttribute('data-glyph', 'chevron-down');
    expect(glyph('clear')).toHaveAttribute('data-glyph', 'x');

    await openByArrow();
    const tick = optionNamed('Blueberry').querySelector(
      "[data-part='indicator'] > [data-ui='icon'] > svg",
    );
    expect(tick).toHaveAttribute('data-glyph', 'check');
  });

  /** The first column holds the artwork it is given; no stylesheet fills it. */
  it('holds an item icon in the first column', async () => {
    render(
      <Basic>
        <ComboboxItem
          icon={
            <Icon>
              <Glyph name="person" />
            </Icon>
          }
          value="blueberry"
        >
          Blueberry
        </ComboboxItem>
      </Basic>,
    );
    await openByArrow();
    const mark = optionNamed('Blueberry').querySelector(
      "[data-part='icon'] > [data-ui='icon'] > svg[data-glyph]",
    );
    expect(mark).toHaveAttribute('data-glyph', 'person');
  });

  it('clears both contracts, and says why', async () => {
    const onValueChange = vi.fn();
    const onInputValueChange = vi.fn();
    render(
      <Basic
        defaultInputValue="Blueberry"
        defaultValue="blueberry"
        onInputValueChange={onInputValueChange}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onValueChange).toHaveBeenCalledWith(null, expect.objectContaining({ reason: 'clear' }));
    expect(onInputValueChange).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ reason: 'clear' }),
    );
  });

  it('lets a consumer own the text and refuse a change', async () => {
    function Controlled() {
      const [text, setText] = useState('');
      return (
        <Basic
          inputValue={text}
          onInputValueChange={(next, request) => {
            if (next.length > 3) request.cancel();
            else setText(next);
          }}
        />
      );
    }
    render(<Controlled />);
    input().focus();
    type('blue');
    expect(input()).toHaveValue('');
  });

  it('refuses to open while it is read-only, and keeps the text readable', async () => {
    render(<Basic defaultInputValue="Blueberry" readOnly />);
    expect(input()).toHaveAttribute('readonly');
    input().focus();
    press('ArrowDown');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('takes disabled, invalid, required and size from the field around it', () => {
    render(
      <Field disabled invalid required size="sm">
        <FieldLabel>Fruit</FieldLabel>
        <Basic />
      </Field>,
    );
    expect(input()).toBeDisabled();
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(input()).toBeRequired();
    expect(input().closest("[data-ui='combobox']")).toHaveAttribute('data-size', 'sm');
  });

  it('submits the chosen key rather than the typed text', () => {
    render(<Basic defaultInputValue="Blueberry" defaultValue="blueberry" name="fruit" />);
    const hidden = document.querySelector<HTMLInputElement>("input[name='fruit']");
    expect(hidden?.value).toBe('blueberry');
  });

  it('lets an application set its defaults once', () => {
    render(
      <ComboboxDefaultsProvider size="lg">
        <Basic />
      </ComboboxDefaultsProvider>,
    );
    expect(input().closest("[data-ui='combobox']")).toHaveAttribute('data-size', 'lg');
  });

  it('speaks the language in force, and lays its own messages over it', async () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Basic messages={{ empty: 'Nada aqui' }} />
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Mostrar opções' })).toBeInTheDocument();
    // language: en-US
    input().focus();
    type('zzz');
    await screen.findByRole('listbox');
    expect(screen.getByText('Nada aqui')).toBeInTheDocument();
  });

  it('runs the consumer’s own handler as well as its own', async () => {
    const onKeyDown = vi.fn();
    render(
      <Combobox>
        <ComboboxInput aria-label="Fruit" onKeyDown={onKeyDown} />
        <ComboboxContent aria-label="Fruit">
          <ComboboxItem value="blueberry">Blueberry</ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    input().focus();
    press('ArrowDown');
    expect(onKeyDown).toHaveBeenCalled();
    await screen.findByRole('listbox');
  });
});
