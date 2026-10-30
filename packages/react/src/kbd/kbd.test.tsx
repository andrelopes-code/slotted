import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRef } from 'react';

import { SlottedProvider } from '../i18n';
import { Kbd, KbdDefaultsProvider, Shortcut } from './index';

const legends = (element: HTMLElement) =>
  [...element.querySelectorAll('[data-part="legend"]')].map((node) => node.textContent);

const parts = (element: HTMLElement) =>
  [...element.children].map((child) => child.getAttribute('data-part'));

describe('Kbd', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(
      <Kbd data-testid="key" keyName="mod" platform="mac">
        {undefined}
      </Kbd>,
    );

    const key = screen.getByTestId('key');
    expect(key.tagName).toBe('KBD');
    expect(key).toHaveAttribute('data-ui', 'kbd');
    expect(key).toHaveAttribute('data-part', 'root');
    expect(parts(key)).toEqual(['legend', 'name']);
  });

  it('writes every axis a consumer may style on, and its defaults', () => {
    render(<Kbd data-testid="key">K</Kbd>);

    const key = screen.getByTestId('key');
    expect(key).toHaveAttribute('data-size', 'md');
    expect(key).toHaveAttribute('data-variant', 'raised');
    expect(key).not.toHaveAttribute('data-disabled');
  });

  /**
   * ARIA in HTML maps `kbd` to no role and declares it Naming Prohibited, so the
   * word a reader hears has to be content. `⌘` is U+2318 PLACE OF INTEREST SIGN,
   * and `Ctrl` is an abbreviation whose pronunciation belongs to the screen
   * reader's dictionary rather than to this library — so both hide the legend
   * and carry the word.
   */
  it('hides the mark from the reader and gives it the word', () => {
    render(<Kbd data-testid="key" keyName="mod" platform="mac" />);

    const key = screen.getByTestId('key');
    expect(key).not.toHaveAttribute('aria-label');
    expect(key).not.toHaveAttribute('role');
    expect(key.querySelector('[data-part="legend"]')).toHaveAttribute('aria-hidden', 'true');
    expect(key.querySelector('[data-part="name"]')).toHaveTextContent('Command');
    expect(key).toHaveAttribute('data-key', 'mod');
  });

  it('marks a legend that is a mark, and leaves a word unmarked', () => {
    render(
      <>
        <Kbd data-testid="mark" keyName="mod" platform="mac" />
        <Kbd data-testid="word" keyName="mod" platform="windows" />
      </>,
    );

    expect(screen.getByTestId('mark').querySelector('[data-part="legend"]')).toHaveAttribute(
      'data-legend',
      'symbol',
    );
    expect(screen.getByTestId('word').querySelector('[data-part="legend"]')).not.toHaveAttribute(
      'data-legend',
    );
  });

  /**
   * Content written on its own is never given a name it did not ask for: only
   * the page knows what its own word says. A named key wins over content,
   * because it is the more specific of two explicit instructions — and because
   * Angular projects content and cannot ask whether any was written, so a rule
   * that depended on the answer would be one only React could keep.
   */
  it('lets a page write its own legend, and prefers a named key over one', () => {
    render(
      <>
        <Kbd data-testid="own">Any key</Kbd>
        <Kbd data-testid="both" keyName="mod" platform="mac">
          Cmd
        </Kbd>
      </>,
    );

    const own = screen.getByTestId('own');
    expect(parts(own)).toEqual(['legend']);
    expect(own.querySelector('[data-part="legend"]')).not.toHaveAttribute('aria-hidden');
    expect(own).not.toHaveAttribute('data-key');

    const both = screen.getByTestId('both');
    expect(legends(both)).toEqual(['⌘']);
    expect(both.querySelector('[data-part="name"]')).toHaveTextContent('Command');
  });

  it('carries a native attribute and a ref to the element that owns them', () => {
    const ref = createRef<HTMLElement>();
    render(<Kbd data-testid="key" id="undo" ref={ref} title="Undo" />);

    const key = screen.getByTestId('key');
    expect(key).toHaveAttribute('id', 'undo');
    expect(key).toHaveAttribute('title', 'Undo');
    expect(ref.current).toBe(key);
  });

  it('renders the wiring into another element when a page asks for one', () => {
    render(<Kbd keyName="escape" platform="mac" render={(props) => <var {...props} />} />);

    const rendered = document.querySelector('[data-ui="kbd"]');
    expect(rendered?.tagName).toBe('VAR');
    expect(rendered).toHaveAttribute('data-part', 'root');
  });

  /**
   * `kbd` may carry only the global ARIA attributes, and `aria-disabled` is not
   * one of them. The row this key belongs to owns the semantics; the key only
   * stops looking available.
   */
  it('dims without claiming the item’s semantics', () => {
    render(<Kbd data-testid="key" disabled keyName="escape" />);

    const key = screen.getByTestId('key');
    expect(key).toHaveAttribute('data-disabled', '');
    expect(key).not.toHaveAttribute('aria-disabled');
    expect(key).not.toHaveAttribute('disabled');
  });
});

describe('Shortcut', () => {
  /**
   * The HTML Standard: “nesting a `kbd` element within another `kbd` element
   * represents an actual key or other unit of input as a portion of a larger
   * input”. shadcn's group is a `div`.
   */
  it('nests the keys inside one kbd, which is what the specification says', () => {
    render(<Shortcut data-testid="shortcut" keys="mod+k" platform="windows" />);

    const shortcut = screen.getByTestId('shortcut');
    expect(shortcut.tagName).toBe('KBD');
    expect(shortcut).toHaveAttribute('data-ui', 'kbd');
    expect(shortcut).toHaveAttribute('data-part', 'shortcut');
    expect(shortcut).toHaveAttribute('data-platform', 'windows');
    expect(parts(shortcut)).toEqual(['root', 'separator', 'root']);
    expect([...shortcut.querySelectorAll('[data-part="root"]')].every((n) => n.tagName === 'KBD'));
  });

  /**
   * Apple Style Guide order is Fn, Control, Option, Shift, Command; Microsoft
   * writes the Windows key ahead of Ctrl, Alt and Shift. One authored string,
   * two right answers — no surveyed implementation reorders at all.
   */
  it('reorders the modifiers into the platform’s own convention', () => {
    render(
      <>
        <Shortcut data-testid="mac" keys="mod+shift+alt+ctrl+p" platform="mac" />
        <Shortcut data-testid="win" keys="shift+meta+alt+ctrl+p" platform="windows" />
      </>,
    );

    expect(legends(screen.getByTestId('mac'))).toEqual(['⌃', '⌥', '⇧', '⌘', 'P']);
    expect(legends(screen.getByTestId('win'))).toEqual(['Win', 'Ctrl', 'Alt', 'Shift', 'P']);
  });

  /** macOS writes ⌘⇧K with nothing between the keys; Windows writes Ctrl+Shift+K. */
  it('joins by platform, and draws no separator at all on a Mac', () => {
    render(
      <>
        <Shortcut data-testid="mac" keys="mod+shift+k" platform="mac" />
        <Shortcut data-testid="win" keys="mod+shift+k" platform="windows" />
      </>,
    );

    expect(screen.getByTestId('mac').querySelectorAll('[data-part="separator"]')).toHaveLength(0);
    expect(screen.getByTestId('win').querySelectorAll('[data-part="separator"]')).toHaveLength(2);
  });

  /**
   * The plus is punctuation joining two caps, and “Command Shift K” is what the
   * operating systems announce. The word is not hidden, because it is the only
   * thing that tells a sequence from a combination.
   */
  it('hides the plus from a reader and reads the word out', () => {
    render(<Shortcut data-testid="sequence" keys="mod+k mod+s" platform="windows" />);

    const separators = [
      ...screen.getByTestId('sequence').querySelectorAll('[data-part="separator"]'),
    ];
    const plus = separators.filter((node) => node.getAttribute('data-separator') === 'plus');
    const then = separators.filter((node) => node.getAttribute('data-separator') === 'then');

    expect(plus).toHaveLength(2);
    expect(plus.every((node) => node.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(then).toHaveLength(1);
    expect(then[0]).not.toHaveAttribute('aria-hidden');
    expect(then[0]).toHaveTextContent('then');
  });

  it('renders the steps of a sequence in the order they were written', () => {
    render(<Shortcut data-testid="sequence" keys="g i" platform="mac" />);
    expect(legends(screen.getByTestId('sequence'))).toEqual(['G', 'I']);
  });

  /**
   * A shortcut with nothing in it is nothing, not an empty cap at the end of a
   * row announcing that a shortcut exists.
   */
  it('renders nothing at all when it holds nothing', () => {
    render(
      <div data-testid="host">
        <Shortcut keys="" />
        <Shortcut />
      </div>,
    );

    expect(screen.getByTestId('host').children).toHaveLength(0);
  });

  /** The escape hatch is composition: authored keys are rendered as written. */
  it('renders keys a page authored itself, in the order the page wrote them', () => {
    render(
      <Shortcut data-testid="shortcut" platform="mac" variant="soft">
        <Kbd keyName="mod" />
        <Kbd>K</Kbd>
      </Shortcut>,
    );

    const shortcut = screen.getByTestId('shortcut');
    expect(legends(shortcut)).toEqual(['⌘', 'K']);
    /* The group's axes reach the keys someone wrote into it. */
    expect(
      [...shortcut.querySelectorAll('[data-part="root"]')].every(
        (node) => node.getAttribute('data-variant') === 'soft',
      ),
    ).toBe(true);
  });

  it('lets a key inside a group state its own axis, and keeps that value', () => {
    render(
      <Shortcut data-testid="shortcut" size="lg">
        <Kbd size="sm">K</Kbd>
      </Shortcut>,
    );

    expect(screen.getByTestId('shortcut').querySelector('[data-part="root"]')).toHaveAttribute(
      'data-size',
      'sm',
    );
  });

  it('dims every key and every separator with the combination', () => {
    render(<Shortcut data-testid="shortcut" disabled keys="mod+z" platform="windows" />);

    const shortcut = screen.getByTestId('shortcut');
    expect(shortcut).toHaveAttribute('data-disabled', '');
    expect(
      [...shortcut.querySelectorAll('[data-part="root"]')].every((node) =>
        node.hasAttribute('data-disabled'),
      ),
    ).toBe(true);
  });
});

describe('Kbd language', () => {
  it('writes and names its keys in the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Shortcut data-testid="shortcut" keys="space g" platform="windows" />
      </SlottedProvider>,
    );

    const shortcut = screen.getByTestId('shortcut');
    // language: pt-BR
    expect(legends(shortcut)).toEqual(['Espaço', 'G']);
    // language: en-US
    expect(shortcut.querySelector('[data-separator="then"]')).toHaveTextContent('depois');
  });
});

describe('KbdDefaultsProvider', () => {
  it('sets the platform, the painting and the wording once for a subtree', () => {
    render(
      <KbdDefaultsProvider
        legends={{ ctrl: 'Strg' }}
        names={{ ctrl: 'Steuerung' }}
        platform="windows"
        size="sm"
        variant="soft"
      >
        <Shortcut data-testid="shortcut" keys="ctrl+k ctrl+s" messages={{ then: 'dann' }} />
      </KbdDefaultsProvider>,
    );

    const shortcut = screen.getByTestId('shortcut');
    expect(shortcut).toHaveAttribute('data-size', 'sm');
    expect(shortcut).toHaveAttribute('data-variant', 'soft');
    expect(legends(shortcut)).toEqual(['Strg', 'K', 'Strg', 'S']);
    expect(shortcut.querySelector('[data-part="name"]')).toHaveTextContent('Steuerung');
    expect(shortcut.querySelector('[data-separator="then"]')).toHaveTextContent('dann');
  });

  it('never overrides a value a key stated for itself', () => {
    render(
      <KbdDefaultsProvider platform="windows" variant="soft">
        <Kbd data-testid="key" keyName="mod" platform="mac" variant="outline" />
      </KbdDefaultsProvider>,
    );

    const key = screen.getByTestId('key');
    expect(key).toHaveAttribute('data-variant', 'outline');
    expect(legends(key)).toEqual(['⌘']);
  });
});

describe('platform detection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('draws the Mac symbols on a Mac without being told', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel' });
    render(<Shortcut data-testid="shortcut" keys="mod+k" />);

    expect(screen.getByTestId('shortcut')).toHaveAttribute('data-platform', 'mac');
    expect(legends(screen.getByTestId('shortcut'))).toEqual(['⌘', 'K']);
  });

  it('prefers the declared platform over the legacy one', () => {
    vi.stubGlobal('navigator', { userAgentData: { platform: 'Windows' }, platform: 'MacIntel' });
    render(<Shortcut data-testid="shortcut" keys="mod+k" />);

    expect(screen.getByTestId('shortcut')).toHaveAttribute('data-platform', 'windows');
  });
});
