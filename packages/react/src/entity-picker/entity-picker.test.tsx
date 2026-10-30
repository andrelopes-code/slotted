import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/entity-picker/contract.json';
import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { EntityPicker } from './entity-picker';
import type { Entity, EntityPickerProps, EntitySource } from './entity-picker.types';

const PEOPLE: Entity[] = [
  { id: 'ana', label: 'Ana Silva', description: 'ana@acme.com', meta: 'Admin' },
  { id: 'ana2', label: 'Ana Silva', description: 'ana@partner.io' },
  { id: 'bruno', label: 'Bruno Costa', description: 'bruno@acme.com' },
  { id: 'carla', label: 'Carla Mendes', description: 'carla@acme.com', disabled: true },
];

/** A source that answers from `PEOPLE` and records what it was asked. */
function recordingSource(options: { fail?: boolean } = {}) {
  const asked: { query: string; scope: string | null; page: number }[] = [];
  const source: EntitySource = {
    search: vi.fn(async ({ query, scope, page }) => {
      asked.push({ query, scope, page });
      if (options.fail) throw new Error('offline');
      const lower = query.toLowerCase();
      const items = PEOPLE.filter((person) => person.label.toLowerCase().includes(lower));
      return { items, total: items.length };
    }),
    resolve: vi.fn(async (ids: readonly string[]) =>
      PEOPLE.filter((person) => ids.includes(person.id)),
    ),
  };
  return { asked, source };
}

function Picker(props: Partial<EntityPickerProps>) {
  return <EntityPicker aria-label="Owner" searchDelay={0} {...(props as EntityPickerProps)} />;
}

const input = () => screen.getByRole('combobox', { name: 'Owner' });
const press = (key: string, options: Record<string, unknown> = {}) =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key, ...options });
const type = (value: string) => fireEvent.change(input(), { target: { value } });
const highlighted = () => input().getAttribute('aria-activedescendant');
/** A pointer press on the input: focus on pointerdown, then the click. */
const pressInput = () => {
  act(() => input().focus());
  fireEvent.click(input());
};

describe('EntityPicker', () => {
  it('leaves the query and the chosen name without a spelling check unless asked', () => {
    const { rerender } = render(<Picker items={PEOPLE} defaultValue="ana" />);
    expect(input()).toHaveAttribute('spellcheck', 'false');
    expect(input()).toHaveAttribute('autocorrect', 'off');

    rerender(<Picker items={PEOPLE} defaultValue="ana" spellCheck />);
    expect(input()).toHaveAttribute('spellcheck', 'true');
  });

  it('draws every part it declares somewhere in its states', async () => {
    const { source } = recordingSource();
    render(<Picker defaultValue="ana" favorites={[PEOPLE[2]!]} source={source} />);
    await waitFor(() => expect(input()).toHaveValue('Ana Silva'));
    const root = document.querySelector("[data-ui='entity-picker'][data-part='root']");
    expect(root).not.toBeNull();
    for (const part of ['control', 'selection', 'input', 'clear', 'trigger', 'arrow']) {
      expect(root!.querySelector(`[data-part='${part}']`), part).not.toBeNull();
    }
    expect(contract.members['entity-picker'].parts).toContain('selection');
  });

  it('searches and resolves under StrictMode, which rehearses an unmount', async () => {
    const { asked, source } = recordingSource();
    render(
      <StrictMode>
        <Picker defaultValue={['bruno']} selectionMode="multiple" source={source} />
      </StrictMode>,
    );
    await screen.findByRole('gridcell', { name: 'Bruno Costa, bruno@acme.com' });
    pressInput();
    await screen.findByRole('option', { name: /Ana Silva.*acme/ });
    expect(asked[0]?.query).toBe('');
  });

  it('opens on focus with favorites and recent, and searches the empty query', async () => {
    const { asked, source } = recordingSource();
    render(
      <Picker favorites={[PEOPLE[2]!]} openOn="focus" recent={[PEOPLE[0]!]} source={source} />,
    );
    act(() => input().focus());
    await screen.findByRole('listbox');
    const groups = await screen.findAllByRole('group');
    expect(
      groups.map((group) => group.getAttribute('aria-labelledby') && group.firstChild?.textContent),
    ).toEqual(['Favorites', 'Recent', 'Results']);
    expect(asked[0]).toEqual({ query: '', scope: null, page: 0 });
  });

  it('searches what was typed and marks the match', async () => {
    const { asked, source } = recordingSource();
    render(<Picker source={source} />);
    act(() => input().focus());
    type('bru');
    const option = await screen.findByRole('option', { name: /Bruno Costa/ });
    expect(option.querySelector("[data-part='match']")?.textContent).toBe('Bru');
    expect(asked.at(-1)?.query).toBe('bru');
    await screen.findByText('1 result');
  });

  it('chooses by keyboard, with the record on the request, and closes', async () => {
    const onValueChange = vi.fn();
    const { source } = recordingSource();
    render(<Picker onValueChange={onValueChange} source={source} />);
    act(() => input().focus());
    type('bruno');
    await screen.findByRole('option', { name: /Bruno Costa/ });
    press('ArrowDown');
    await waitFor(() => expect(highlighted()).not.toBeNull());
    press('Enter');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    const [value, request] = onValueChange.mock.calls[0]!;
    expect(value).toBe('bruno');
    expect(request.reason).toBe('keyboard');
    expect(request.entities.map((entity: Entity) => entity.id)).toEqual(['bruno']);
    expect(input()).toHaveValue('Bruno Costa');
    expect(input()).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps two records of one name apart by their identifier', async () => {
    const { source } = recordingSource();
    render(<Picker source={source} />);
    act(() => input().focus());
    type('ana');
    const options = await screen.findAllByRole('option', { name: /Ana Silva/ });
    expect(
      options.map((option) => option.querySelector("[data-part='description']")?.textContent),
    ).toEqual(['ana@acme.com', 'ana@partner.io']);
  });

  it('skips a disabled record with the arrows', async () => {
    const { source } = recordingSource();
    render(<Picker source={source} />);
    act(() => input().focus());
    type('a');
    await screen.findByRole('option', { name: /Carla Mendes/ });
    for (let index = 0; index < 6; index += 1) press('ArrowDown');
    const current = document.getElementById(highlighted()!);
    expect(current?.textContent).not.toContain('Carla');
  });

  it('puts the chosen name back when the reader leaves text that chose nothing', async () => {
    const { source } = recordingSource();
    render(<Picker defaultValue="bruno" source={source} />);
    await waitFor(() => expect(input()).toHaveValue('Bruno Costa'));
    act(() => input().focus());
    type('xyz');
    act(() => input().blur());
    expect(input()).toHaveValue('Bruno Costa');
  });

  it('answers Escape by closing, then by putting the name back, then by clearing', async () => {
    const onValueChange = vi.fn();
    const { source } = recordingSource();
    render(<Picker defaultValue="bruno" onValueChange={onValueChange} source={source} />);
    await waitFor(() => expect(input()).toHaveValue('Bruno Costa'));
    act(() => input().focus());
    type('br');
    press('Escape');
    expect(input()).toHaveAttribute('aria-expanded', 'false');
    press('Escape');
    expect(input()).toHaveValue('Bruno Costa');
    press('Escape');
    expect(onValueChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: 'clear' }),
    );
  });

  it('shows an id it cannot resolve as unavailable, and keeps it removable', async () => {
    const { source } = recordingSource();
    render(<Picker defaultValue={['gone', 'ana']} selectionMode="multiple" source={source} />);
    const chip = await screen.findByRole('gridcell', { name: 'Unavailable, gone' });
    expect(chip).toHaveAttribute('data-unresolved');
    expect(screen.getByRole('gridcell', { name: 'Ana Silva, ana@acme.com' })).toBeInTheDocument();
    expect(chip.querySelector("[data-part='remove']")).not.toBeNull();
  });

  it('toggles in multiple, keeps the popup open and empties the query', async () => {
    const onValueChange = vi.fn();
    const { source } = recordingSource();
    render(<Picker onValueChange={onValueChange} selectionMode="multiple" source={source} />);
    act(() => input().focus());
    type('bru');
    fireEvent.click(await screen.findByRole('option', { name: /Bruno Costa/ }));
    expect(onValueChange).toHaveBeenCalledWith(
      ['bruno'],
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(input()).toHaveValue('');
    expect(input()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('lists the chosen first on an empty query in multiple', async () => {
    const { source } = recordingSource();
    render(<Picker defaultValue={['bruno']} selectionMode="multiple" source={source} />);
    pressInput();
    const groups = await screen.findAllByRole('group');
    expect(groups[0]?.firstChild?.textContent).toBe('Chosen');
  });

  it('takes Backspace twice from an empty field to remove the last chip', async () => {
    const onValueChange = vi.fn();
    const { source } = recordingSource();
    render(
      <Picker
        defaultValue={['ana', 'bruno']}
        onValueChange={onValueChange}
        selectionMode="multiple"
        source={source}
      />,
    );
    await screen.findByRole('gridcell', { name: 'Bruno Costa, bruno@acme.com' });
    act(() => input().focus());
    press('Backspace');
    expect(document.activeElement).toHaveAttribute('data-value', 'bruno');
    expect(onValueChange).not.toHaveBeenCalled();
    press('Backspace');
    expect(onValueChange).toHaveBeenCalledWith(
      ['ana'],
      expect.objectContaining({ reason: 'remove' }),
    );
  });

  it('refuses a record past max', async () => {
    const onValueChange = vi.fn();
    const { source } = recordingSource();
    render(
      <Picker
        defaultValue={['ana']}
        max={1}
        onValueChange={onValueChange}
        selectionMode="multiple"
        source={source}
      />,
    );
    act(() => input().focus());
    type('bru');
    const option = await screen.findByRole('option', { name: /Bruno Costa/ });
    expect(option).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(option);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(document.querySelector("[data-part='root'][data-complete]")).not.toBeNull();
  });

  /** Every icon the family owns is a `Glyph` element inside an `Icon` box, never a mask. */
  describe('glyph elements', () => {
    const glyph = (scope: ParentNode | null | undefined, part: string) =>
      scope?.querySelector(`[data-part='${part}'] > [data-ui='icon'] > svg[data-glyph]`);

    it('draws the cross, the chevron and the tick', async () => {
      const { source } = recordingSource();
      render(<Picker defaultValue="ana" source={source} />);
      await waitFor(() => expect(input()).toHaveValue('Ana Silva'));
      expect(glyph(document, 'clear')).toHaveAttribute('data-glyph', 'x');
      expect(glyph(document, 'arrow')).toHaveAttribute('data-glyph', 'chevron-down');

      act(() => input().focus());
      type('Ana');
      const chosen = await screen.findByRole('option', { name: /ana@acme\.com/ });
      expect(glyph(chosen, 'indicator')).toHaveAttribute('data-glyph', 'check');
    });

    it('draws the alert mark in the face of an id it cannot resolve', async () => {
      const { source } = recordingSource();
      render(<Picker defaultValue={['gone']} selectionMode="multiple" source={source} />);
      const chip = await screen.findByRole('gridcell', { name: 'Unavailable, gone' });
      expect(glyph(chip, 'start')).toHaveAttribute('data-glyph', 'circle-alert');
      expect(glyph(chip, 'remove')).toHaveAttribute('data-glyph', 'x');
    });

    it('draws the alert beside a failure and the turning arrow on the offer to retry', async () => {
      const { source } = recordingSource({ fail: true });
      render(<Picker source={source} />);
      act(() => input().focus());
      type('ana');
      const error = (await screen.findByText('Couldn’t load results')).closest(
        "[data-part='error']",
      );
      expect(error?.querySelector("[data-ui='icon'] > svg")).toHaveAttribute(
        'data-glyph',
        'circle-alert',
      );
      const retry = document.querySelector("[data-part='item'][data-retry]");
      expect(glyph(retry, 'media')).toHaveAttribute('data-glyph', 'rotate-ccw');
    });

    it('draws the plus on the offer to create', async () => {
      const { source } = recordingSource();
      const onCreate = vi.fn(async (query: string) => ({ id: 'new', label: query }));
      render(<Picker onCreate={onCreate} source={source} />);
      act(() => input().focus());
      type('Zeta');
      const offer = await screen.findByRole('option', { name: 'Create “Zeta”' });
      expect(glyph(offer, 'media')).toHaveAttribute('data-glyph', 'plus');
    });
  });

  it('offers to search again after a failure, and Enter does', async () => {
    const { asked, source } = recordingSource({ fail: true });
    render(<Picker source={source} />);
    act(() => input().focus());
    type('ana');
    await screen.findByText('Couldn’t load results');
    press('ArrowDown');
    await waitFor(() => expect(highlighted()).not.toBeNull());
    const before = asked.length;
    press('Enter');
    await waitFor(() => expect(asked.length).toBe(before + 1));
  });

  it('chooses what it created, with reason submit', async () => {
    const onValueChange = vi.fn();
    const { source } = recordingSource();
    const onCreate = vi.fn(async (query: string) => ({ id: 'new', label: query }));
    render(<Picker onCreate={onCreate} onValueChange={onValueChange} source={source} />);
    act(() => input().focus());
    type('Zeta');
    fireEvent.click(await screen.findByRole('option', { name: 'Create “Zeta”' }));
    await waitFor(() =>
      expect(onValueChange).toHaveBeenCalledWith(
        'new',
        expect.objectContaining({ reason: 'submit' }),
      ),
    );
    expect(onCreate).toHaveBeenCalledWith('Zeta');
    await waitFor(() => expect(input()).toHaveValue('Zeta'));
  });

  it('does not offer to create a name a result already has', async () => {
    const { source } = recordingSource();
    render(<Picker onCreate={() => undefined} source={source} />);
    act(() => input().focus());
    type('bruno costa');
    await screen.findByRole('option', { name: /Bruno Costa/ });
    expect(screen.queryByRole('option', { name: /Create/ })).toBeNull();
  });

  it('asks nothing below the minimum length and says how many are needed', async () => {
    const { asked, source } = recordingSource();
    render(<Picker minQueryLength={2} source={source} />);
    act(() => input().focus());
    type('a');
    await screen.findByText('Type 2 or more characters');
    expect(asked).toEqual([]);
  });

  it('follows a controlled value and names it from the records it was given', async () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>('ana');
      return (
        <>
          <button onClick={() => setValue('bruno')} type="button">
            swap
          </button>
          <Picker
            entities={PEOPLE}
            onValueChange={(next: unknown) => setValue(next as string | null)}
            value={value}
          />
        </>
      );
    }
    render(<Controlled />);
    expect(input()).toHaveValue('Ana Silva');
    fireEvent.click(screen.getByText('swap'));
    await waitFor(() => expect(input()).toHaveValue('Bruno Costa'));
  });

  it('searches a local list by name and identifier', async () => {
    render(<Picker items={PEOPLE} />);
    act(() => input().focus());
    type('partner');
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.getAttribute('data-value'))).toEqual(['ana2']);
  });

  it('is labelled by its field and submits one input per id', async () => {
    const { container } = render(
      <form>
        <Field>
          <FieldLabel>Reviewers</FieldLabel>
          <EntityPicker
            defaultValue={['ana', 'bruno']}
            entities={PEOPLE}
            name="reviewers"
            selectionMode="multiple"
          />
        </Field>
      </form>,
    );
    expect(screen.getByRole('combobox', { name: 'Reviewers' })).toBeInTheDocument();
    const data = new FormData(container.querySelector('form')!);
    expect(data.getAll('reviewers')).toEqual(['ana', 'bruno']);
  });

  it('speaks the language in force, and its own messages win', async () => {
    const { source } = recordingSource({ fail: true });
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Picker messages={{ retry: 'Outra vez' }} source={source} />
      </SlottedProvider>,
    );
    act(() => input().focus());
    type('a');
    // language: pt-BR
    await screen.findByText('Não foi possível carregar os resultados');
    // language: en-US
    expect(screen.getByRole('option', { name: 'Outra vez' })).toBeInTheDocument();
  });

  it('draws renderOption inside the family row, face and check kept', async () => {
    render(
      <Picker
        items={PEOPLE}
        renderOption={(entity, state) => (
          <span data-part="label" data-part-label="">
            {entity.label}
            {state.selected ? ' ✓' : ''}
          </span>
        )}
      />,
    );
    act(() => input().focus());
    type('bru');
    const option = await screen.findByRole('option', { name: /Bruno Costa/ });
    expect(option.querySelector("[data-part='media'] [data-ui='avatar']")).not.toBeNull();
    expect(option.querySelector("[data-part='indicator']")).not.toBeNull();
    expect(option.querySelector("[data-part='description']")).toBeNull();
  });

  it('puts a scope in front of the field and sends it with the search', async () => {
    const { asked, source } = recordingSource();
    render(
      <Picker
        defaultScope="people"
        scopes={[
          { id: 'people', label: 'People' },
          { id: 'teams', label: 'Teams' },
        ]}
        source={source}
      />,
    );
    const root = document.querySelector("[data-ui='entity-picker'][data-part='root']")!;
    expect(root).toHaveAttribute('role', 'group');
    expect(root.querySelector("[data-part='scope'] [data-ui='select']")).not.toBeNull();
    pressInput();
    await waitFor(() => expect(asked.at(-1)?.scope).toBe('people'));
  });

  it('runs the consumer handler beside its own', async () => {
    const onKeyDown = vi.fn();
    const { source } = recordingSource();
    render(<Picker onKeyDown={onKeyDown} source={source} />);
    act(() => input().focus());
    press('ArrowDown');
    expect(onKeyDown).toHaveBeenCalled();
    await screen.findByRole('listbox');
  });

  describe('openOn', () => {
    const expanded = () => input().getAttribute('aria-expanded');

    it('opens on a press on the input by default, once, with reason pointer', () => {
      const onOpenChange = vi.fn();
      render(<Picker items={PEOPLE} onOpenChange={onOpenChange} />);
      pressInput();
      expect(expanded()).toBe('true');
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(
        true,
        expect.objectContaining({ reason: 'pointer' }),
      );
    });

    it('keeps an open popup open on a second press on the input', () => {
      const onOpenChange = vi.fn();
      render(<Picker items={PEOPLE} onOpenChange={onOpenChange} />);
      pressInput();
      fireEvent.click(input());
      expect(expanded()).toBe('true');
      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    it('does not open when a Tab brings focus in by default', () => {
      const onOpenChange = vi.fn();
      render(<Picker items={PEOPLE} onOpenChange={onOpenChange} />);
      act(() => input().focus());
      expect(expanded()).toBe('false');
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('opens on typing by default', () => {
      render(<Picker items={PEOPLE} />);
      act(() => input().focus());
      type('bru');
      expect(expanded()).toBe('true');
    });

    it('keeps the popup closed on a press whose handler prevented it', () => {
      const onOpenChange = vi.fn();
      render(
        <Picker
          items={PEOPLE}
          onClick={(event) => event.preventDefault()}
          onOpenChange={onOpenChange}
        />,
      );
      pressInput();
      expect(expanded()).toBe('false');
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('under manual, typing filters and a press only places the caret; ArrowDown opens', () => {
      const onOpenChange = vi.fn();
      render(<Picker items={PEOPLE} onOpenChange={onOpenChange} openOn="manual" />);
      pressInput();
      expect(expanded()).toBe('false');
      type('bru');
      expect(expanded()).toBe('false');
      expect(input()).toHaveValue('bru');
      expect(onOpenChange).not.toHaveBeenCalled();
      press('ArrowDown');
      expect(expanded()).toBe('true');
      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    it('under focus, a focus opens, and a press that focuses opens exactly once', () => {
      const onOpenChange = vi.fn();
      render(<Picker items={PEOPLE} onOpenChange={onOpenChange} openOn="focus" />);
      act(() => input().focus());
      expect(expanded()).toBe('true');
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      fireEvent.click(input());
      expect(expanded()).toBe('true');
      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    it('does not open on a press when read-only', () => {
      const onOpenChange = vi.fn();
      render(<Picker items={PEOPLE} onOpenChange={onOpenChange} readOnly />);
      pressInput();
      expect(expanded()).toBe('false');
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });
});
