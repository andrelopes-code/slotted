import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/tags-input/contract.json';
import { SlottedProvider } from '../i18n';
import { TagsInput } from './tags-input';
import { TagsInputDefaultsProvider } from './tags-input-defaults';
import type { TagsInputHandle, TagsInputProps } from './tags-input.types';

function Basic(props: Partial<TagsInputProps>) {
  return <TagsInput aria-label="To" {...props} />;
}

const input = () => screen.getByLabelText('To') as HTMLInputElement;
const press = (key: string, options: Record<string, unknown> = {}) =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key, ...options });
const type = (value: string) => fireEvent.change(input(), { target: { value } });
const chips = () =>
  screen.queryAllByRole('gridcell').filter((cell) => cell.dataset['ui'] === 'tag');
const chipLabels = () =>
  chips().map((chip) => chip.querySelector("[data-part='label']")?.textContent);
const root = () => document.querySelector("[data-ui='tags-input']") as HTMLElement;

describe('TagsInput', () => {
  it('is a text box inside a layout grid, and no combobox', () => {
    render(<Basic defaultValue={['ana@example.com']} />);
    expect(input()).not.toHaveAttribute('role');
    expect(input()).not.toHaveAttribute('aria-expanded');
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', 'To, 1 value');
    expect(screen.getByRole('row')).toBeInTheDocument();
    expect(contract.roles).toMatchObject({ input: null, control: 'grid', chip: 'gridcell' });
  });

  /** The grid pattern puts one element of a layout grid in the tab sequence. */
  it('is one tab stop, whatever the row holds', () => {
    render(<Basic defaultValue={['a', 'b']} />);
    expect(input()).not.toHaveAttribute('tabindex');
    for (const chip of chips()) expect(chip).toHaveAttribute('tabindex', '-1');
    for (const button of screen.getAllByRole('button', { name: /^Remove/ })) {
      expect(button).toHaveAttribute('tabindex', '-1');
    }
  });

  it('commits the typed text on Enter, on a delimiter, and never submits with text', () => {
    const onValueChange = vi.fn();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Basic onValueChange={onValueChange} />
      </form>,
    );
    input().focus();
    type('ana@example.com');
    const enter = fireEvent.keyDown(input(), { key: 'Enter' });
    expect(enter).toBe(false);
    expect(onValueChange).toHaveBeenLastCalledWith(
      ['ana@example.com'],
      expect.objectContaining({ reason: 'submit' }),
    );
    expect(input()).toHaveValue('');
    type('lee@example.org');
    fireEvent.keyDown(input(), { key: ',' });
    expect(chipLabels()).toEqual(['ana@example.com', 'lee@example.org']);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('splits a paste on the delimiters and on line breaks', () => {
    render(<Basic />);
    input().focus();
    fireEvent.paste(input(), {
      clipboardData: { getData: () => 'a@x.com, b@x.com\nc@x.com' },
    });
    expect(chipLabels()).toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
  });

  it('lets the consumer replace the split', () => {
    render(<Basic split={(text) => text.split('|')} />);
    fireEvent.paste(input(), { clipboardData: { getData: () => 'a,b|c' } });
    expect(chipLabels()).toEqual(['a,b', 'c']);
  });

  /**
   * The reason the family exists beside `multi-select`: a value that fails is
   * held, marked, described, and blocks the native submit.
   */
  it('holds an invalid value, marks it, describes it, and blocks the native submit', () => {
    render(<Basic validate={(text) => (text.includes('@') ? true : 'Needs an @')} />);
    input().focus();
    type('jhon');
    press('Enter');
    const [chip] = chips();
    expect(chip).toHaveAttribute('data-invalid');
    expect(chip).toHaveAttribute('data-tone', 'danger');
    expect(chip).toHaveAttribute('aria-invalid', 'true');
    expect(chip).toHaveAccessibleDescription('Needs an @');
    expect(chip).toHaveAttribute('title', 'Needs an @');
    expect(chip?.querySelector("[data-part='start']")).not.toBeNull();
    expect(root()).toHaveAttribute('data-invalid');
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(input().validity.customError).toBe(true);
    expect(input().validationMessage).toBe('Needs an @');
  });

  it('refuses an invalid value instead, on request, and reports it', () => {
    const onValueRefuse = vi.fn();
    render(<Basic invalidValues="refuse" onValueRefuse={onValueRefuse} validate={() => false} />);
    input().focus();
    type('jhon');
    press('Enter');
    expect(chips()).toHaveLength(0);
    expect(onValueRefuse).toHaveBeenCalledWith(
      ['jhon'],
      expect.objectContaining({ cause: 'invalid' }),
    );
  });

  /** With no validator, the input's own constraints judge — `type`, `pattern`, the lengths. */
  it('judges by the input’s own constraints when no validator is given', () => {
    render(<Basic pattern="[A-Z]{3}-\d{4}" defaultValue={['ABC-1234', 'nope']} />);
    const [good, bad] = chips();
    expect(good).not.toHaveAttribute('data-invalid');
    expect(bad).toHaveAttribute('data-invalid');
    /* Every chip's remove button draws the cross. */
    expect(good?.querySelector("[data-part='remove'] svg[data-glyph]")).toHaveAttribute(
      'data-glyph',
      'x',
    );
    /* The mark is the alert glyph in `tag`'s start slot, on the failing chip only. */
    expect(good?.querySelector("[data-part='start']")).toBeNull();
    expect(bad?.querySelector("[data-part='start'] svg[data-glyph]")).toHaveAttribute(
      'data-glyph',
      'circle-alert',
    );
    /* The sentence is the platform's own — jsdom's is terse, a browser's is
       translated — and the family repeats none of its own. */
    expect(bad).toHaveAccessibleDescription();
    expect(bad).not.toHaveAccessibleDescription('Not a valid value');
  });

  it('falls back to its own label where the platform has no sentence', () => {
    render(<Basic minLength={3} defaultValue={['ab']} />);
    expect(chips()[0]).toHaveAccessibleDescription('Not a valid value');
  });

  it('judges a controlled value the consumer handed in', () => {
    render(<Basic validate={(text) => text.length > 1} value={['ok', 'x']} />);
    expect(chips()[1]).toHaveAttribute('data-invalid');
    expect(root()).toHaveAttribute('data-invalid');
  });

  it('refuses a duplicate under the locale rule and focuses the chip that holds it', () => {
    const onValueRefuse = vi.fn();
    render(<Basic defaultValue={['Ana']} onValueRefuse={onValueRefuse} />);
    input().focus();
    type('ana');
    press('Enter');
    expect(chipLabels()).toEqual(['Ana']);
    expect(onValueRefuse).toHaveBeenCalledWith(
      ['ana'],
      expect.objectContaining({ cause: 'duplicate' }),
    );
    expect(chips()[0]).toHaveFocus();
    expect(chips()[0]).toHaveAttribute('data-current');
  });

  it('caps at the limit, says so, and reports what a paste left out', () => {
    const onValueRefuse = vi.fn();
    render(<Basic max={2} onValueRefuse={onValueRefuse} />);
    expect(screen.getByText('0 of 2')).toBeInTheDocument();
    fireEvent.paste(input(), { clipboardData: { getData: () => 'a,b,c,d' } });
    expect(chipLabels()).toEqual(['a', 'b']);
    expect(root()).toHaveAttribute('data-complete');
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    expect(onValueRefuse).toHaveBeenCalledWith(
      ['c', 'd'],
      expect.objectContaining({ cause: 'limit' }),
    );
  });

  it('removes with Backspace only from an empty input, and only on the second press', () => {
    const onValueChange = vi.fn();
    render(<Basic defaultValue={['a', 'b']} onValueChange={onValueChange} />);
    input().focus();
    press('Backspace');
    expect(chips()[1]).toHaveFocus();
    expect(onValueChange).not.toHaveBeenCalled();
    press('Backspace');
    expect(onValueChange).toHaveBeenLastCalledWith(
      ['a'],
      expect.objectContaining({ reason: 'remove' }),
    );
  });

  it('moves focus to the chip that took the removed one’s index, then the input', async () => {
    render(<Basic defaultValue={['a', 'b', 'c']} />);
    input().focus();
    press('ArrowLeft');
    press('ArrowLeft');
    expect(chips()[1]).toHaveFocus();
    press('Delete');
    expect(chipLabels()).toEqual(['a', 'c']);
    await waitFor(() => expect(chips()[1]).toHaveFocus());
    press('Delete');
    await waitFor(() => expect(chips()[0]).toHaveFocus());
    press('Delete');
    await waitFor(() => expect(input()).toHaveFocus());
  });

  it('never removes a locked value, from any key or control', () => {
    const onValueChange = vi.fn();
    render(
      <Basic
        defaultValue={['support@x.com', 'a']}
        lockedValues={['support@x.com']}
        onValueChange={onValueChange}
      />,
    );
    const [locked] = chips();
    expect(locked).toHaveAttribute('data-disabled');
    expect(locked?.querySelector("[data-part='remove']")).toBeNull();
    input().focus();
    press('Backspace');
    expect(chips()[1]).toHaveFocus();
    press('ArrowLeft');
    expect(locked).toHaveFocus();
    press('Delete');
    expect(onValueChange).not.toHaveBeenCalled();
    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(clear.querySelector('svg[data-glyph]')).toHaveAttribute('data-glyph', 'x');
    fireEvent.click(clear);
    expect(onValueChange).toHaveBeenLastCalledWith(
      ['support@x.com'],
      expect.objectContaining({ reason: 'clear' }),
    );
  });

  it('reorders with Alt and an arrow, and emits keyboard', () => {
    const onValueChange = vi.fn();
    render(<Basic defaultValue={['a', 'b', 'c']} onValueChange={onValueChange} reorderable />);
    input().focus();
    press('ArrowLeft');
    expect(chips()[2]).toHaveFocus();
    press('ArrowLeft', { altKey: true });
    expect(onValueChange).toHaveBeenLastCalledWith(
      ['a', 'c', 'b'],
      expect.objectContaining({ reason: 'keyboard' }),
    );
    press('Home', { altKey: true });
    expect(onValueChange).toHaveBeenLastCalledWith(['c', 'a', 'b'], expect.anything());
  });

  it('edits a chip in place with Enter, judges the edit, and reverts on Escape', () => {
    render(<Basic defaultValue={['a', 'b']} editable />);
    input().focus();
    press('ArrowLeft');
    press('Enter');
    const editor = chips()[1]?.querySelector('input') as HTMLInputElement;
    expect(editor).toHaveValue('b');
    fireEvent.change(editor, { target: { value: 'a' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    /* An edit into a value already held is a duplicate: refused, the list
       unchanged, and the chip that holds it takes focus. */
    expect(chipLabels()).toEqual(['a', 'b']);
    expect(chips()[0]).toHaveFocus();
    press('ArrowRight');
    expect(chips()[1]).toHaveFocus();
    press('Enter');
    const again = chips()[1]?.querySelector('input') as HTMLInputElement;
    fireEvent.change(again, { target: { value: 'z' } });
    fireEvent.keyDown(again, { key: 'Escape' });
    expect(chipLabels()).toEqual(['a', 'b']);
    expect(chips()[1]).toHaveFocus();
  });

  it('answers blur with the three words', () => {
    const { rerender } = render(<Basic pendingOnBlur="commit" />);
    input().focus();
    type('a');
    fireEvent.blur(input(), { relatedTarget: document.body });
    expect(chipLabels()).toEqual(['a']);

    rerender(<Basic pendingOnBlur="keep" />);
    type('b');
    fireEvent.blur(input(), { relatedTarget: document.body });
    expect(input()).toHaveValue('b');

    rerender(<Basic pendingOnBlur="discard" />);
    fireEvent.blur(input(), { relatedTarget: document.body });
    expect(input()).toHaveValue('');
    expect(chipLabels()).toEqual(['a']);
  });

  it('copies a chip with Ctrl+C, the list from the empty input, and cuts with Ctrl+X', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    const onValueCopy = vi.fn();
    const onValueChange = vi.fn();
    render(
      <Basic defaultValue={['a', 'b']} onValueChange={onValueChange} onValueCopy={onValueCopy} />,
    );
    input().focus();
    await act(async () => {
      press('c', { ctrlKey: true });
    });
    expect(writeText).toHaveBeenLastCalledWith('a, b');
    expect(onValueCopy).toHaveBeenLastCalledWith(['a', 'b'], 'api');
    press('ArrowLeft');
    await act(async () => {
      press('x', { ctrlKey: true });
    });
    expect(writeText).toHaveBeenLastCalledWith('b');
    expect(onValueChange).toHaveBeenLastCalledWith(
      ['a'],
      expect.objectContaining({ reason: 'remove' }),
    );
  });

  it('writes one hidden input per value under one name, and required only while empty', () => {
    const { container, rerender } = render(<Basic name="to" required />);
    expect(input()).toBeRequired();
    rerender(<Basic name="to" required defaultValue={['a', 'b']} value={['a', 'b']} />);
    expect(input()).not.toBeRequired();
    const hidden = container.querySelectorAll("input[type='hidden'][name='to']");
    expect([...hidden].map((node) => (node as HTMLInputElement).value)).toEqual(['a', 'b']);
  });

  it('clears the pending text with Escape and never the list', () => {
    render(<Basic defaultValue={['a']} />);
    input().focus();
    type('x');
    press('Escape');
    expect(input()).toHaveValue('');
    expect(chipLabels()).toEqual(['a']);
  });

  it('is controlled when value is present, and asks rather than moves', () => {
    function Owner() {
      const [value, setValue] = useState<readonly string[]>(['a']);
      return (
        <Basic
          onValueChange={(next, request) => {
            if (request.reason === 'remove') return;
            setValue(next);
          }}
          value={value}
        />
      );
    }
    render(<Owner />);
    input().focus();
    type('b');
    press('Enter');
    expect(chipLabels()).toEqual(['a', 'b']);
    press('Backspace');
    press('Backspace');
    expect(chipLabels()).toEqual(['a', 'b']);
  });

  it('exposes the handle, and passes native props and the ref to the input', () => {
    const handle = { current: null as TagsInputHandle | null };
    const ref = { current: null as HTMLInputElement | null };
    render(<Basic handleRef={handle} list="people" placeholder="Add" ref={ref} />);
    expect(ref.current).toBe(input());
    expect(input()).toHaveAttribute('list', 'people');
    act(() => handle.current?.setValue(['x', 'y']));
    expect(chipLabels()).toEqual(['x', 'y']);
    act(() => handle.current?.clear());
    expect(chipLabels()).toEqual([]);
  });

  it('draws the chip text through formatLabel', () => {
    render(
      <Basic defaultValue={['ana@example.com']} formatLabel={(v) => v.split('@')[0] as string} />,
    );
    expect(chipLabels()).toEqual(['ana']);
    expect(screen.getByRole('button', { name: 'Remove ana' })).toBeInTheDocument();
  });

  it('takes its defaults from the provider, and the prop over the provider', () => {
    render(
      <TagsInputDefaultsProvider delimiters={[';']} size="sm">
        <Basic defaultValue={['a']} messages={{ remove: 'Drop {label}' }} size="lg" />
      </TagsInputDefaultsProvider>,
    );
    expect(root()).toHaveAttribute('data-size', 'lg');
    expect(screen.getByRole('button', { name: 'Drop a' })).toBeInTheDocument();
    input().focus();
    type('b');
    fireEvent.keyDown(input(), { key: ';' });
    expect(chipLabels()).toEqual(['a', 'b']);
  });

  it('speaks the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Basic defaultValue={['a', 'b']} />
      </SlottedProvider>,
    );
    expect(screen.getByRole('button', { name: 'Remover a' })).toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAccessibleName('To, 2 valores');
  });

  it('withholds every remove control while read-only, and keeps the chips legible', () => {
    render(<Basic defaultValue={['a']} readOnly />);
    expect(root()).toHaveAttribute('data-readonly');
    expect(chips()[0]).not.toHaveAttribute('data-disabled');
    expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('names the keys the row answers in its description', () => {
    render(<Basic defaultValue={['a']} editable />);
    expect(screen.getByRole('row')).toHaveAccessibleDescription(
      'Press Delete to remove a value. Press Enter to edit a value.',
    );
  });

  it('composes the consumer’s handlers rather than replacing them', () => {
    const onKeyDown = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(<Basic onKeyDown={onKeyDown} />);
    input().focus();
    type('a');
    press('Enter');
    expect(onKeyDown).toHaveBeenCalled();
    expect(chipLabels()).toEqual([]);
  });
});

describe('TagsInput suggestions', () => {
  const listbox = () => screen.queryByRole('listbox');
  const options = () => screen.queryAllByRole('option');

  it('lists the suggestions the typed text matches, and Enter on the first adds it', () => {
    const onValueChange = vi.fn();
    render(<Basic onValueChange={onValueChange} suggestions={['travel', 'trip', 'work']} />);
    input().focus();
    expect(input()).toHaveAttribute('role', 'combobox');
    expect(input()).toHaveAttribute('aria-expanded', 'false');

    type('tr');
    expect(input()).toHaveAttribute('aria-expanded', 'true');
    expect(input()).toHaveAttribute('aria-controls', listbox()!.id);
    expect(listbox()).toHaveAccessibleName('Suggestions');
    expect(options().map((option) => option.textContent)).toEqual(['travel', 'trip']);
    expect(input()).not.toHaveAttribute('aria-activedescendant');

    press('ArrowDown');
    expect(input()).toHaveAttribute('aria-activedescendant', options()[0]!.id);
    expect(options()[0]).toHaveAttribute('aria-selected', 'true');
    press('Enter');

    expect(chipLabels()).toEqual(['travel']);
    expect(onValueChange).toHaveBeenLastCalledWith(
      ['travel'],
      expect.objectContaining({ reason: 'submit' }),
    );
    expect(input().value).toBe('');
    expect(listbox()).toBeNull();
    expect(input()).toHaveAttribute('aria-expanded', 'false');
  });

  it('matches by the locale’s collator and leaves out what is already chosen', () => {
    render(<Basic defaultValue={['trip']} suggestions={['Été', 'été 2026', 'trip', 'Trips']} />);
    input().focus();
    type('ete');
    expect(options().map((option) => option.textContent)).toEqual(['Été', 'été 2026']);
    type('TRI');
    expect(options().map((option) => option.textContent)).toEqual(['Trips']);
  });

  it('still commits the typed text, and Escape closes the list before it clears', () => {
    render(<Basic suggestions={['travel', 'trip']} />);
    input().focus();
    type('tr');
    press('Escape');
    expect(listbox()).toBeNull();
    expect(input().value).toBe('tr');
    press('Escape');
    expect(input().value).toBe('');
    type('train');
    press('Enter');
    expect(chipLabels()).toEqual(['train']);
  });

  it('opens on ArrowDown with nothing typed, wraps, and adds a suggestion on a press', () => {
    render(<Basic suggestions={['travel', 'trip']} />);
    input().focus();
    press('ArrowDown');
    expect(options()).toHaveLength(2);
    expect(input()).toHaveAttribute('aria-activedescendant', options()[0]!.id);
    press('ArrowUp');
    expect(input()).toHaveAttribute('aria-activedescendant', options()[1]!.id);
    press('ArrowDown');
    expect(input()).toHaveAttribute('aria-activedescendant', options()[0]!.id);
    fireEvent.pointerDown(options()[1]!);
    fireEvent.click(options()[1]!);
    expect(chipLabels()).toEqual(['trip']);
    expect(document.activeElement).toBe(input());
  });

  it('runs a chosen suggestion through validate, normalize and max like typed text', () => {
    const onValueRefuse = vi.fn();
    render(
      <Basic
        max={1}
        normalize={(text) => text.toUpperCase()}
        onValueRefuse={onValueRefuse}
        suggestions={['travel', 'trip']}
        validate={(text) => text !== 'TRIP' || 'No trips'}
      />,
    );
    input().focus();
    type('trip');
    press('ArrowDown');
    press('Enter');
    expect(chipLabels()).toEqual(['TRIP']);
    expect(chips()[0]).toHaveAttribute('data-tone', 'danger');
    type('trav');
    press('ArrowDown');
    press('Enter');
    expect(chipLabels()).toEqual(['TRIP']);
    expect(onValueRefuse).toHaveBeenCalledWith(
      ['TRAVEL'],
      expect.objectContaining({ cause: 'limit' }),
    );
  });
});
