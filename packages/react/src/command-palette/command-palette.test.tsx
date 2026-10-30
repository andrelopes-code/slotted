import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/command-palette/contract.json';
import { SlottedProvider } from '../i18n';
import { CommandPalette, CommandPaletteTrigger } from './command-palette';
import { CommandPaletteDefaultsProvider } from './command-palette-defaults';
import type {
  CommandPaletteHandle,
  CommandPaletteItem,
  CommandPaletteProps,
} from './command-palette.types';

const ITEMS: CommandPaletteItem[] = [
  { id: 'inbox', label: 'Inbox', group: 'nav', shortcut: 'g i', keywords: ['mail'] },
  { id: 'projects', label: 'Projects', group: 'nav', href: '/projects' },
  {
    id: 'team',
    label: 'Switch team…',
    group: 'nav',
    children: [
      { id: 'acme', label: 'Acme Robotics' },
      { id: 'globex', label: 'Globex Freight' },
    ],
  },
  { id: 'deploy', label: 'Deploy to production', group: 'actions', shortcut: 'mod+shift+d' },
  { id: 'rollback', label: 'Roll back deployment', group: 'actions', disabled: true },
  { id: 'theme', label: 'Toggle dark mode' },
];
const GROUPS = [
  { id: 'nav', label: 'Go to' },
  { id: 'actions', label: 'Actions' },
];

function Inline(props: Partial<CommandPaletteProps>) {
  return <CommandPalette groups={GROUPS} items={ITEMS} presentation="inline" {...props} />;
}

const input = () => screen.getByRole('combobox');
const current = () => {
  const id = input().getAttribute('aria-activedescendant');
  return id === null ? null : document.getElementById(id);
};

describe('CommandPalette', () => {
  it('renders the anatomy the contract declares, inline', () => {
    const { container } = render(<Inline />);
    const root = container.querySelector("[data-ui='command-palette']");
    expect(root?.getAttribute('data-presentation')).toBe('inline');
    for (const part of [
      'header',
      'search',
      'input',
      'clear',
      'list',
      'group',
      'group-label',
      'item',
      'label',
      'status',
      'footer',
      'hint',
    ]) {
      expect(container.querySelector(`[data-part='${part}']`), part).not.toBeNull();
    }
    for (const part of contract.members.commandPalette.parts) {
      if (
        [
          'trigger',
          'close',
          'busy',
          'pages',
          'page',
          'match',
          'description',
          'meta',
          'placeholder',
          'empty',
          'separator',
          'icon',
          'shortcut',
          'arrow',
        ].includes(part)
      )
        continue;
      expect(container.querySelector(`[data-part='${part}']`), part).not.toBeNull();
    }
  });

  /** The family's own marks are Glyph elements; the chevrons mirror in a right-to-left document. */
  it('draws the search, clear, arrow and trail marks as glyphs', () => {
    const nested: CommandPaletteItem[] = [
      {
        id: 'settings',
        label: 'Settings',
        children: [{ id: 'members', label: 'Members', children: [{ id: 'ana', label: 'Ana' }] }],
      },
    ];
    const { container } = render(
      <CommandPalette
        defaultPages={['settings', 'members']}
        items={nested}
        presentation="inline"
      />,
    );
    const glyph = (selector: string) =>
      container.querySelector(`${selector} > [data-ui='icon'] > svg[data-glyph]`);
    expect(glyph("[data-part='search']")?.getAttribute('data-glyph')).toBe('search');
    expect(glyph("[data-part='clear']")?.getAttribute('data-glyph')).toBe('x');
    const trail = container.querySelectorAll("[data-part='pages'] > li > [data-ui='icon']");
    expect(trail).toHaveLength(1);
    expect(trail[0]?.hasAttribute('data-directional')).toBe(true);
    expect(trail[0]?.querySelector('svg')?.getAttribute('data-glyph')).toBe('chevron-right');
  });

  it('wires the combobox pattern: expanded, controls, activedescendant, options', () => {
    render(<Inline />);
    expect(input().getAttribute('aria-expanded')).toBe('true');
    expect(input().getAttribute('aria-autocomplete')).toBe('list');
    const list = screen.getByRole('listbox');
    expect(input().getAttribute('aria-controls')).toBe(list.id);
    expect(current()?.textContent).toContain('Inbox');
    expect(current()?.getAttribute('aria-selected')).toBe('true');
    expect(screen.getAllByRole('option').length).toBe(6);
  });

  it('draws groups in the declared order with the ungrouped tail last', () => {
    const { container } = render(<Inline />);
    const labels = [...container.querySelectorAll("[data-part='group-label']")].map(
      (n) => n.textContent,
    );
    expect(labels).toEqual(['Go to', 'Actions']);
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options.at(-1)).toContain('Toggle dark mode');
  });

  it('ranks what was typed, marks the match and announces the count', () => {
    const onQueryChange = vi.fn();
    const { container } = render(<Inline onQueryChange={onQueryChange} />);
    fireEvent.change(input(), { target: { value: 'dep' } });
    expect(onQueryChange).toHaveBeenCalledWith(
      'dep',
      expect.objectContaining({ reason: 'keyboard' }),
    );
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(
      ['Deploy to production⌘⇧D', 'Roll back deployment'].map((t) =>
        expect.stringContaining(t.slice(0, 6)),
      ),
    );
    expect(container.querySelector("[data-part='match']")?.textContent).toBe('Dep');
    expect(screen.getByRole('status').textContent).toBe('2 results');
    expect(container.querySelector("[data-ui='command-palette']")?.hasAttribute('data-query')).toBe(
      true,
    );
  });

  it('answers a keyword the label does not hold', () => {
    render(<Inline />);
    fireEvent.change(input(), { target: { value: 'mail' } });
    expect(screen.getAllByRole('option').map((o) => o.textContent?.startsWith('Inbox'))).toEqual([
      true,
    ]);
  });

  it('says so when nothing matched', () => {
    const { container } = render(<Inline messages={{ empty: 'Nothing here' }} />);
    fireEvent.change(input(), { target: { value: 'xylophone' } });
    expect(screen.queryAllByRole('option')).toEqual([]);
    expect(container.querySelector("[data-part='empty']")?.textContent).toBe('Nothing here');
    expect(container.querySelector("[data-ui='command-palette']")?.hasAttribute('data-empty')).toBe(
      true,
    );
  });

  it('moves the highlight with the arrows, skips a disabled item and wraps with loop', () => {
    const onHighlightedIdChange = vi.fn();
    render(<Inline onHighlightedIdChange={onHighlightedIdChange} />);
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(current()?.textContent).toContain('Projects');
    expect(onHighlightedIdChange).toHaveBeenLastCalledWith(
      'projects',
      expect.objectContaining({ reason: 'keyboard' }),
    );
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(current()?.textContent).toContain('Deploy');
    /* Roll back is disabled and is skipped. */
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(current()?.textContent).toContain('Toggle dark mode');
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(current()?.textContent).toContain('Inbox');
    fireEvent.keyDown(input(), { key: 'ArrowUp' });
    expect(current()?.textContent).toContain('Toggle dark mode');
    fireEvent.keyDown(input(), { key: 'Home', ctrlKey: true });
    expect(current()?.textContent).toContain('Inbox');
    fireEvent.keyDown(input(), { key: 'End', ctrlKey: true });
    expect(current()?.textContent).toContain('Toggle dark mode');
  });

  it('leaves Home and End to the caret, and does not wrap on PageDown', () => {
    render(<Inline />);
    const home = fireEvent.keyDown(input(), { key: 'Home' });
    expect(home).toBe(true);
    fireEvent.keyDown(input(), { key: 'PageDown' });
    expect(current()?.textContent).toContain('Toggle dark mode');
    fireEvent.keyDown(input(), { key: 'PageDown' });
    expect(current()?.textContent).toContain('Toggle dark mode');
  });

  it('executes the current item on Enter with reason keyboard, and never a disabled one', () => {
    const onSelect = vi.fn();
    const onRecentChange = vi.fn();
    render(<Inline onRecentChange={onRecentChange} onSelect={onSelect} />);
    fireEvent.change(input(), { target: { value: 'deploy' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'deploy' }),
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(onRecentChange).toHaveBeenCalledWith(
      ['deploy'],
      expect.objectContaining({ reason: 'select' }),
    );

    onSelect.mockClear();
    fireEvent.change(input(), { target: { value: 'roll back' } });
    expect(current()).toBeNull();
    fireEvent.keyDown(input(), { key: 'Enter' });
    fireEvent.click(screen.getByRole('option'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('runs the item’s own handler before the root’s, and the pointer executes too', () => {
    const own = vi.fn();
    const root = vi.fn();
    render(<Inline items={[{ id: 'a', label: 'Alpha', onSelect: own }]} onSelect={root} />);
    fireEvent.click(screen.getByRole('option'));
    expect(own).toHaveBeenCalledWith(expect.objectContaining({ reason: 'pointer' }));
    expect(root).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), expect.anything());
    expect(own.mock.invocationCallOrder[0]).toBeLessThan(root.mock.invocationCallOrder[0] ?? 0);
  });

  it('opens a page on an item with children, draws the trail, and returns on Backspace', () => {
    const onPagesChange = vi.fn();
    const { container } = render(<Inline onPagesChange={onPagesChange} />);
    const team = screen.getByRole('option', { name: /Switch team/ });
    expect(team.hasAttribute('data-page')).toBe(true);
    const arrow = team.querySelector("[data-part='arrow'] > [data-ui='icon'][data-directional]");
    expect(arrow?.querySelector('svg')?.getAttribute('data-glyph')).toBe('chevron-right');
    fireEvent.click(team);
    expect(onPagesChange).toHaveBeenCalledWith(
      ['team'],
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(container.querySelector("[data-part='page']")?.textContent).toBe('Switch team…');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Acme Robotics',
      'Globex Freight',
    ]);
    expect(current()?.textContent).toBe('Acme Robotics');

    fireEvent.change(input(), { target: { value: 'glo' } });
    fireEvent.keyDown(input(), { key: 'Backspace' });
    expect(screen.getAllByRole('option').length).toBe(1);
    fireEvent.change(input(), { target: { value: '' } });
    fireEvent.keyDown(input(), { key: 'Backspace' });
    expect(onPagesChange).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(screen.getAllByRole('option').length).toBe(6);
  });

  it('returns to a page from its button in the trail', () => {
    const { container } = render(<Inline defaultPages={['team']} />);
    fireEvent.click(container.querySelector("[data-part='page']") as HTMLElement);
    expect(screen.getAllByRole('option').length).toBe(2);
  });

  it('opens on the recents and moves an executed item to the front', () => {
    const { container } = render(<Inline defaultRecent={['theme']} />);
    const labels = [...container.querySelectorAll("[data-part='group-label']")].map(
      (n) => n.textContent,
    );
    expect(labels[0]).toBe('Recent');
    expect(screen.getAllByRole('option')[0]?.textContent).toContain('Toggle dark mode');
    fireEvent.click(screen.getByRole('option', { name: /Inbox/ }));
    expect(screen.getAllByRole('option')[0]?.textContent).toContain('Inbox');
    expect(screen.getAllByRole('option').length).toBe(6);
  });

  it('draws a destination as a link', () => {
    render(<Inline />);
    const projects = screen.getByRole('option', { name: /Projects/ });
    expect(projects.tagName).toBe('A');
    expect(projects.getAttribute('href')).toBe('/projects');
  });

  it('draws and announces a shortcut, and never a sequence', () => {
    render(<Inline />);
    const deploy = screen.getByRole('option', { name: /Deploy/ });
    expect(deploy.getAttribute('aria-keyshortcuts')).toMatch(/^(Meta|Control)\+Shift\+D$/);
    expect(deploy.querySelector("[data-part='shortcut'] [data-ui='kbd']")).not.toBeNull();
    expect(screen.getByRole('option', { name: /Inbox/ }).hasAttribute('aria-keyshortcuts')).toBe(
      false,
    );
  });

  it('keeps an asynchronous item busy, refuses a second run, and closes when it settles', async () => {
    let settle: () => void = () => {};
    const handler = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        defaultOpen
        items={[{ id: 'slow', label: 'Slow', onSelect: handler }]}
        onOpenChange={onOpenChange}
      />,
    );
    const option = await screen.findByRole('option');
    fireEvent.click(option);
    fireEvent.click(option);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(option.hasAttribute('data-loading')).toBe(true);
    expect(option.getAttribute('aria-busy')).toBe('true');
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => {
      settle();
    });
    await waitFor(() =>
      expect(onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'select' }),
      ),
    );
  });

  it('stays open and announces the error when a handler rejects', async () => {
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        defaultOpen
        messages={{ error: 'Failed: {message}' }}
        items={[{ id: 'bad', label: 'Bad', onSelect: () => Promise.reject(new Error('nope')) }]}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(await screen.findByRole('option'));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Failed: nope'));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('option').hasAttribute('data-loading')).toBe(false);
  });

  it('holds the palette open when the handler asks', async () => {
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        defaultOpen
        items={[{ id: 'k', label: 'Keep', onSelect: (request) => request.keepOpen() }]}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(await screen.findByRole('option'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('opens on the hotkey, focuses the input when already open, and closes with Escape in steps', async () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette items={ITEMS} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole('combobox')).toBeNull();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'keyboard' }),
    );
    const field = await screen.findByRole('combobox');
    await waitFor(() => expect(document.activeElement).toBe(field));

    fireEvent.change(field, { target: { value: 'in' } });
    fireEvent.keyDown(field, { key: 'Escape' });
    expect((field as HTMLInputElement).value).toBe('');
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'escape' }),
    );
  });

  it('closes from the close part with the reason dismiss', async () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette items={ITEMS} onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    await screen.findByRole('combobox');
    const close = document.querySelector(
      '[data-ui="command-palette"] [data-part="close"]',
    ) as HTMLButtonElement;
    expect(close.textContent).toBe('Close');
    fireEvent.click(close);
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'dismiss' }),
    );
  });

  it('leaves a bare hotkey alone inside an editable field, and turns off with null', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <>
        <textarea aria-label="Notes" />
        <CommandPalette hotkey="/" items={ITEMS} onOpenChange={onOpenChange} />
      </>,
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: '/' });
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: '/' });
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    rerender(
      <>
        <textarea aria-label="Notes" />
        <CommandPalette hotkey={null} items={ITEMS} onOpenChange={onOpenChange} />
      </>,
    );
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it('opens from its trigger, which the consumer may render as their own element', async () => {
    render(
      <CommandPalette items={ITEMS}>
        <CommandPaletteTrigger render={(props) => <button {...props}>Search</button>} />
      </CommandPalette>,
    );
    const trigger = screen.getByRole('button', { name: 'Search' });
    expect(trigger.getAttribute('data-part')).toBe('trigger');
    fireEvent.click(trigger);
    expect(await screen.findByRole('combobox')).not.toBeNull();
  });

  it('resets the query and the pages when it closes, each through its own request', async () => {
    const onQueryChange = vi.fn();
    const onPagesChange = vi.fn();
    function Owner() {
      const [open, setOpen] = useState(true);
      return (
        <CommandPalette
          defaultPages={['team']}
          defaultQuery="glo"
          items={ITEMS}
          onOpenChange={setOpen}
          onPagesChange={onPagesChange}
          onQueryChange={onQueryChange}
          open={open}
        />
      );
    }
    render(<Owner />);
    const field = await screen.findByRole('combobox');
    fireEvent.keyDown(field, { key: 'Escape' });
    fireEvent.keyDown(field, { key: 'Escape' });
    fireEvent.keyDown(field, { key: 'Escape' });
    await waitFor(() =>
      expect(onQueryChange).toHaveBeenCalledWith('', expect.objectContaining({ reason: 'clear' })),
    );
    expect(onPagesChange).toHaveBeenCalledWith([], expect.objectContaining({ reason: 'keyboard' }));
  });

  it('exposes a handle for the actions a consumer cannot express declaratively', async () => {
    function Owner() {
      const ref = useRef<CommandPaletteHandle>(null);
      return (
        <>
          <button onClick={() => ref.current?.open()} type="button">
            open
          </button>
          <button onClick={() => ref.current?.setQuery('toggle')} type="button">
            query
          </button>
          {/* The second button is outside the layer, which a modal palette
              reads as an outside press; the test is about the handle. */}
          <CommandPalette items={ITEMS} outsidePress="none" ref={ref} />
        </>
      );
    }
    render(<Owner />);
    fireEvent.click(screen.getByText('open'));
    const field = await screen.findByRole('combobox');
    fireEvent.click(screen.getByText('query'));
    expect((field as HTMLInputElement).value).toBe('toggle');
    expect(screen.getAllByRole('option').length).toBe(1);
  });

  it('takes its defaults from the provider and its words from the language in force', () => {
    const { container } = render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <CommandPaletteDefaultsProvider size="lg">
          <Inline messages={{ placeholder: 'Buscar…' }} />
        </CommandPaletteDefaultsProvider>
      </SlottedProvider>,
    );
    expect(container.querySelector("[data-ui='command-palette']")?.getAttribute('data-size')).toBe(
      'lg',
    );
    expect(input().getAttribute('placeholder')).toBe('Buscar…');
    // language: pt-BR
    expect(input().getAttribute('aria-label')).toBe('Pesquisar comandos');
    expect(container.querySelector("[data-part='footer']")?.textContent).toContain('Navegar');
    // language: en-US
  });

  it('lets the consumer replace the row content, the empty message and the footer', () => {
    const { container } = render(
      <Inline
        empty={<em>nada</em>}
        footer={null}
        renderItem={(item, state) => (
          <b data-testid={state.current ? 'current' : undefined}>{item.label}</b>
        )}
      />,
    );
    expect(screen.getByTestId('current').textContent).toBe('Inbox');
    expect(container.querySelector("[data-part='footer']")).toBeNull();
    fireEvent.change(input(), { target: { value: 'zzz' } });
    expect(container.querySelector("[data-part='empty'] em")?.textContent).toBe('nada');
  });

  it('shows the wait as three rows and says so, while loading with nothing to show', () => {
    const { container } = render(<Inline items={[]} loading />);
    expect(
      container.querySelectorAll("[data-part='placeholder'] [data-ui='skeleton']").length,
    ).toBe(3);
    expect(container.querySelector("[data-part='busy'][data-ui='spinner']")).not.toBeNull();
    expect(screen.getByRole('listbox').getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('Loading…');
  });

  it('composes the consumer’s input handlers rather than replacing them', () => {
    const onKeyDown = vi.fn((event: React.KeyboardEvent) => event.preventDefault());
    render(<Inline inputProps={{ onKeyDown }} />);
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(onKeyDown).toHaveBeenCalled();
    expect(current()?.textContent).toContain('Inbox');
  });
});

/**
 * A finger that starts a scroll on the list fires a pointermove over a row
 * before the pointercancel. The highlight follows a mouse or a pen only, and a
 * highlight the pointer made never scrolls the list under it.
 */
describe('the pointer and the highlight', () => {
  /* jsdom has no scrollIntoView; each test stands one in and takes it away. */
  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });
  const row = (label: string) =>
    screen.getByText(label).closest('[data-part="item"]') as HTMLElement;

  it('leaves the highlight where it is while a finger scrolls the list', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(<Inline />);
    const before = input().getAttribute('aria-activedescendant');
    scrollIntoView.mockClear();

    const deploy = row('Deploy to production');
    fireEvent.pointerDown(deploy, { pointerType: 'touch' });
    fireEvent.pointerMove(deploy, { pointerType: 'touch' });
    fireEvent.pointerCancel(deploy, { pointerType: 'touch' });

    expect(input().getAttribute('aria-activedescendant')).toBe(before);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('follows a mouse without scrolling the row it moved onto', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(<Inline />);
    scrollIntoView.mockClear();

    const deploy = row('Deploy to production');
    fireEvent.pointerMove(deploy, { pointerType: 'mouse' });

    expect(current()).toBe(deploy);
    expect(scrollIntoView).not.toHaveBeenCalled();

    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
