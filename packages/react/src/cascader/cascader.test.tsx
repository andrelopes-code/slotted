import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/cascader/contract.json';
import { SlottedProvider } from '../i18n';
import { Cascader, CascaderPanel } from './cascader';
import { CascaderDefaultsProvider } from './cascader-defaults';
import type { CascaderLoadRequest, CascaderProps, CascaderValue } from './cascader.types';

interface Place {
  id: string;
  name: string;
  children?: Place[];
  lazy?: boolean;
  disabled?: boolean;
}

const places: Place[] = [
  {
    id: 'pt',
    name: 'United States',
    children: [
      {
        id: 'lis',
        name: 'Washington',
        children: [
          { id: 'alf', name: 'Ballard' },
          { id: 'bel', name: 'Bellevue' },
        ],
      },
      { id: 'opo', name: 'Porto', children: [{ id: 'rib', name: 'Ribeira' }] },
    ],
  },
  { id: 'es', name: 'España', children: [{ id: 'mad', name: 'Madrid' }] },
  { id: 'fr', name: 'France', lazy: true },
  { id: 'ad', name: 'Andorra', disabled: true },
];

const data = {
  nodes: places,
  getKey: (place: Place) => place.id,
  getLabel: (place: Place) => place.name,
  getChildren: (place: Place) => place.children,
  hasChildren: (place: Place) => place.lazy === true || (place.children?.length ?? 0) > 0,
  isNodeDisabled: (place: Place) => place.disabled === true,
};

function Basic(props: Partial<CascaderProps<Place>>) {
  return (
    <Cascader<Place> aria-label="Location" layout="columns" portal={false} {...data} {...props} />
  );
}

const trigger = () => screen.getByRole('combobox', { name: 'Location' });
const node = (name: string) => screen.getByRole('treeitem', { name: new RegExp(`^${name}`) });
const press = (key: string, target: Element = trigger()) => fireEvent.keyDown(target, { key });

describe('Cascader', () => {
  it('carries the identifier the contract declares, on the control and on the layer', () => {
    render(<Basic defaultOpen />);
    const root = trigger().closest("[data-part='root']");
    expect(root).toHaveAttribute('data-ui', contract.ui);
    expect(document.querySelector("[data-part='positioner']")).toHaveAttribute(
      'data-ui',
      'cascader',
    );
  });

  it('prints the path of the value, segment by segment', () => {
    render(<Basic defaultValue="bel" />);
    const segments = trigger().querySelectorAll("[data-part='value-segment']");
    expect([...segments].map((segment) => segment.textContent)).toEqual([
      'United States',
      'Washington',
      'Bellevue',
    ]);
  });

  it('is a combobox with a tree popup', () => {
    render(<Basic defaultOpen />);
    expect(trigger()).toHaveAttribute('aria-haspopup', 'tree');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });

  it('opens onto the level that holds the value, with the value active', () => {
    render(<Basic defaultValue="bel" />);
    press('ArrowDown');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger()).toHaveAttribute('aria-activedescendant', node('Bellevue').id);
    expect(node('Washington')).toHaveAttribute('aria-expanded', 'true');
  });

  it('enters a branch on the inline end and goes back on the inline start', () => {
    render(<Basic />);
    press('ArrowDown');
    expect(trigger()).toHaveAttribute('aria-activedescendant', node('United States').id);
    press('ArrowRight');
    expect(trigger()).toHaveAttribute('aria-activedescendant', node('Washington').id);
    expect(screen.getAllByRole('group')).toHaveLength(2);
    press('ArrowLeft');
    expect(trigger()).toHaveAttribute('aria-activedescendant', node('United States').id);
    expect(screen.getAllByRole('group')).toHaveLength(1);
  });

  it('stays in the column on the vertical arrows, as the contract departs from the tree', () => {
    render(<Basic />);
    press('ArrowDown');
    press('ArrowRight');
    press('ArrowDown');
    expect(trigger()).toHaveAttribute('aria-activedescendant', node('Porto').id);
    press('ArrowDown');
    expect(trigger()).toHaveAttribute('aria-activedescendant', node('Porto').id);
  });

  it('commits a leaf on Enter, closes, and says the keyboard did it', () => {
    const onValueChange = vi.fn();
    render(<Basic defaultValue="alf" onValueChange={onValueChange} />);
    press('ArrowDown');
    press('ArrowDown');
    press('Enter');
    expect(onValueChange).toHaveBeenCalledWith(
      'bel',
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveFocus();
  });

  it('opens a level on a press on a branch and commits a leaf on a press', () => {
    const onValueChange = vi.fn();
    render(<Basic defaultOpen onValueChange={onValueChange} />);
    fireEvent.click(node('United States'), { detail: 1 });
    fireEvent.click(node('Washington'), { detail: 1 });
    fireEvent.click(node('Ballard'), { detail: 1 });
    expect(onValueChange).toHaveBeenCalledWith(
      'alf',
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('refuses a disabled node', () => {
    const onValueChange = vi.fn();
    render(<Basic defaultOpen onValueChange={onValueChange} selectable="any" />);
    fireEvent.click(node('Andorra'), { detail: 1 });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(node('Andorra')).toHaveAttribute('aria-disabled', 'true');
  });

  it('waits for the value the consumer holds', () => {
    function Controlled() {
      const [value, setValue] = useState<CascaderValue>(null);
      return (
        <>
          <Basic defaultOpen onValueChange={(next) => setValue(next)} value={value} />
          <output>{String(value)}</output>
        </>
      );
    }
    render(<Controlled />);
    fireEvent.click(node('España'), { detail: 1 });
    fireEvent.click(node('Madrid'), { detail: 1 });
    expect(document.querySelector('output')?.textContent).toBe('mad');
  });

  it('toggles a branch with its descendants and emits the parent under checkedStrategy="parent"', () => {
    const onValueChange = vi.fn();
    render(
      <Basic
        checkedStrategy="parent"
        defaultOpen
        onValueChange={onValueChange}
        selectionMode="multiple"
      />,
    );
    fireEvent.click(node('United States'), { detail: 1 });
    const washington = node('Washington');
    fireEvent.click(washington.querySelector("[data-part='indicator']") as Element, { detail: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith(['lis'], expect.anything());
    expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('marks a branch whose children are partly chosen as mixed', () => {
    render(<Basic defaultOpen defaultValue={['alf']} selectionMode="multiple" />);
    press('ArrowDown');
    expect(node('United States')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('finds a node at any depth and prints the road to it', () => {
    render(<Basic defaultOpen search />);
    const field = screen.getByRole('combobox', { name: 'Search' });
    fireEvent.change(field, { target: { value: 'bel' } });
    const hit = node('Bellevue');
    expect(hit.querySelector("[data-part='description']")?.textContent).toBe(
      'United States / Washington',
    );
    expect(hit.querySelector("[data-ui='highlight'] [data-part='match']")?.textContent).toBe('Bel');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('asks for a level it does not hold, and aborts the request when the path moves on', () => {
    const requests: CascaderLoadRequest[] = [];
    render(<Basic defaultOpen onLoadChildren={(request) => requests.push(request)} />);
    fireEvent.click(node('France'), { detail: 1 });
    expect(requests.map((request) => request.key)).toEqual(['fr']);
    expect(document.querySelectorAll("[data-part='loader']")).toHaveLength(3);
    fireEvent.click(node('United States'), { detail: 1 });
    expect(requests[0]?.signal.aborted).toBe(true);
  });

  it('offers a retry on a level that failed', () => {
    const onRetry = vi.fn();
    render(
      <Basic
        defaultOpen
        defaultPath={['fr']}
        isNodeFailed={(place) => place.id === 'fr'}
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledWith('fr');
  });

  it('slides the window past the levels that do not fit and lists them as crumbs', () => {
    render(<Basic defaultOpen defaultPath={['pt', 'lis']} maxColumns={1} />);
    expect(screen.getAllByRole('group')).toHaveLength(1);
    const crumbs = within(screen.getByRole('navigation')).getAllByRole('button');
    expect(crumbs.map((crumb) => crumb.textContent)).toEqual(['All', 'United States']);
    fireEvent.click(crumbs[1] as HTMLElement, { detail: 1 });
    expect(screen.getByRole('group', { name: 'United States' })).toBeInTheDocument();
  });

  it('submits one hidden input per emitted key', () => {
    const { container } = render(
      <Basic defaultValue={['alf', 'mad']} name="places" selectionMode="multiple" />,
    );
    const inputs = container.querySelectorAll<HTMLInputElement>('input[type="hidden"]');
    expect([...inputs].map((input) => input.value)).toEqual(['alf', 'mad']);
  });

  it('clears the value and gives focus back to the control', () => {
    const onValueChange = vi.fn();
    render(<Basic defaultValue="alf" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onValueChange).toHaveBeenCalledWith(null, expect.objectContaining({ reason: 'clear' }));
    expect(trigger()).toHaveFocus();
  });

  it('takes the defaults an application set once', () => {
    render(
      <CascaderDefaultsProvider size="lg">
        <Basic messages={{ placeholder: 'Pick a place' }} />
      </CascaderDefaultsProvider>,
    );
    expect(trigger().closest("[data-part='root']")).toHaveAttribute('data-size', 'lg');
    expect(trigger()).toHaveTextContent('Pick a place');
  });

  it('speaks the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Basic defaultValue="alf" />
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Limpar seleção' })).toBeInTheDocument();
    // language: en-US
  });

  it('lets a request be refused before anything moves', () => {
    render(<Basic defaultValue="alf" onValueChange={(_value, request) => request.cancel()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(trigger()).toHaveTextContent('Ballard');
  });
});

describe('CascaderPanel', () => {
  it('is a tree on the page that takes focus and walks by key', async () => {
    render(<CascaderPanel<Place> aria-label="Places" layout="columns" {...data} />);
    const tree = screen.getByRole('tree', { name: 'Places' });
    expect(tree).toHaveAttribute('tabindex', '0');
    tree.focus();
    await act(async () => {});
    fireEvent.keyDown(tree, { key: 'ArrowDown' });
    expect(tree).toHaveAttribute('aria-activedescendant', node('España').id);
    fireEvent.keyDown(tree, { key: 'f' });
    expect(tree).toHaveAttribute('aria-activedescendant', node('France').id);
  });
});
