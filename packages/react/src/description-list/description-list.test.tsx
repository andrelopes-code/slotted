import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/description-list/contract.json';
import { SlottedProvider } from '../i18n';
import { DescriptionList } from './description-list';
import { copyToClipboard } from './description-list-clipboard';
import { DescriptionListDefaultsProvider } from './description-list-defaults';
import {
  DescriptionListAction,
  DescriptionListDescription,
  DescriptionListHint,
  DescriptionListItem,
  DescriptionListTerm,
  overflowsClamp,
  spanWithin,
} from './description-list-parts';
import type { DescriptionListProps } from './description-list.types';

function Panel(props: Partial<DescriptionListProps>) {
  return (
    <DescriptionList {...props}>
      <DescriptionListItem>
        <DescriptionListTerm>Environment</DescriptionListTerm>
        <DescriptionListDescription>Production</DescriptionListDescription>
      </DescriptionListItem>
      <DescriptionListItem>
        <DescriptionListTerm>
          Retention
          <DescriptionListHint>How long a deleted object stays recoverable.</DescriptionListHint>
        </DescriptionListTerm>
        <DescriptionListDescription>30 days</DescriptionListDescription>
      </DescriptionListItem>
    </DescriptionList>
  );
}

/**
 * The `dl` is reached by element rather than by role. HTML-AAM maps it to
 * `list` and carries an editorial note that the value may change with
 * w3c/aria#1662; the accessibility-tree implementation behind Testing Library
 * computes no role for it today. Asserting the role would be asserting the
 * state of an open specification question rather than the family's own work,
 * and the family's work is the element it chose.
 */
const list = () => document.querySelector('dl') as HTMLElement;
const root = () => list().parentElement as HTMLElement;

/**
 * jsdom has no layout, so a value's `scrollHeight` is zero and its resolved
 * line height is empty — and the control that reveals a clamped value appears
 * only for a value that has more text than the clamp allows. The measurement
 * is stubbed rather than skipped, because what is being tested is what the
 * family does with the answer.
 */
function withLayout(scrollHeight: number, lineHeight = '20px') {
  const computed = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    const style = computed(element as Element, pseudo as string | undefined);
    Object.defineProperty(style, 'lineHeight', { configurable: true, get: () => lineHeight });
    return style;
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight,
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
});

describe('DescriptionList', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(<Panel className="panel" />);

    expect(root()).toHaveAttribute('data-ui', 'description-list');
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(root()).toHaveClass('panel');
    expect(list().tagName).toBe('DL');
    expect(list()).toHaveAttribute('data-part', 'list');
    expect(screen.getByText('Environment')).toHaveAttribute('data-part', 'term');
    expect(screen.getByText('Production')).toHaveAttribute('data-part', 'value');
  });

  /**
   * `dl`, `dt` and `dd` carry `list`, `term` and `definition` already. MDN
   * records that writing the ARIA roles by hand changes how VoiceOver
   * announces the construct, so the family writes none of them.
   */
  it('writes no role of its own', () => {
    render(<Panel />);

    for (const element of [root(), list(), screen.getByText('Environment')]) {
      expect(element).not.toHaveAttribute('role');
    }
    expect(screen.getByText('Environment').tagName).toBe('DT');
    expect(screen.getByText('Production').closest('dd')).not.toBeNull();
  });

  /** The `div` around each pair is the form the HTML Standard permits. */
  it('groups each pair in the wrapper the platform allows inside a dl', () => {
    render(<Panel />);
    const pair = screen.getByText('Environment').parentElement as HTMLElement;

    expect(pair.tagName).toBe('DIV');
    expect(pair).toHaveAttribute('data-part', 'item');
    expect(pair.parentElement).toBe(list());
  });

  it('answers every axis from the prop, then the provider, then its own default', () => {
    const { rerender } = render(<Panel />);
    expect(root()).toHaveAttribute('data-layout', contract.resolution.layout[2]);
    expect(root()).toHaveAttribute('data-columns', contract.resolution.columns[2]);
    expect(root()).toHaveAttribute('data-variant', contract.resolution.variant[2]);
    expect(root()).toHaveAttribute('data-min-column-width', contract.resolution.minColumnWidth[2]);

    rerender(
      <DescriptionListDefaultsProvider
        columns={2}
        layout="stack"
        minColumnWidth="sm"
        variant="framed"
      >
        <Panel />
      </DescriptionListDefaultsProvider>,
    );
    expect(root()).toHaveAttribute('data-min-column-width', 'sm');
    expect(root()).toHaveAttribute('data-layout', 'stack');
    expect(root()).toHaveAttribute('data-columns', '2');
    expect(root()).toHaveAttribute('data-variant', 'framed');

    rerender(
      <DescriptionListDefaultsProvider columns={2} layout="stack" variant="framed">
        <Panel columns={3} layout="row" minColumnWidth="md" variant="ruled" />
      </DescriptionListDefaultsProvider>,
    );
    expect(root()).toHaveAttribute('data-min-column-width', 'md');
    expect(root()).toHaveAttribute('data-layout', 'row');
    expect(root()).toHaveAttribute('data-columns', '3');
    expect(root()).toHaveAttribute('data-variant', 'ruled');
  });

  /** A length only the consumer knows, under the name that says so. */
  it('hands the term width to the stylesheet as a custom property', () => {
    render(<Panel termWidth="8rem" />);
    expect(root().style.getPropertyValue('--slotted-description-list-term-width')).toBe('8rem');
  });

  /**
   * Grid invents the tracks it is asked for, so a pair asking for three
   * columns of a two-column list would grow the list a column nobody declared.
   */
  it('clamps a span to the columns the list has', () => {
    expect(spanWithin(undefined, 3)).toBeUndefined();
    expect(spanWithin(1, 3)).toBeUndefined();
    expect(spanWithin(2, 3)).toBe(2);
    expect(spanWithin(3, 2)).toBe(2);
    expect(spanWithin(3, 1)).toBeUndefined();

    render(
      <DescriptionList columns={2}>
        <DescriptionListItem span={3}>
          <DescriptionListTerm>Endpoint</DescriptionListTerm>
          <DescriptionListDescription>db.example.com</DescriptionListDescription>
        </DescriptionListItem>
      </DescriptionList>,
    );
    expect(screen.getByText('Endpoint').parentElement).toHaveAttribute('data-span', '2');
  });

  it('refuses to render a part outside a list', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<DescriptionListItem />)).toThrow(/inside a DescriptionList/);
    quiet.mockRestore();
  });
});

describe('DescriptionListDescription', () => {
  it('keeps every character of a clamped value in the DOM', () => {
    render(
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionListTerm>Note</DescriptionListTerm>
          <DescriptionListDescription clamp={2}>
            Rotated the credentials.
          </DescriptionListDescription>
        </DescriptionListItem>
      </DescriptionList>,
    );

    const description = screen.getByText('Rotated the credentials.').closest('dd') as HTMLElement;
    expect(description).toHaveAttribute('data-clamp', '');
    expect(description.style.getPropertyValue('--slotted-description-list-clamp')).toBe('2');
    expect(screen.getByText('Rotated the credentials.')).toBeVisible();
  });

  /**
   * A clamp is a maximum rather than a promise. Most values in a panel are
   * shorter than it, and a control that reveals nothing is one a reader presses
   * once and learns to distrust.
   */
  it('decides whether there is anything to reveal by measuring, not by asking', () => {
    expect(overflowsClamp(60, 20, 2)).toBe(true);
    expect(overflowsClamp(40, 20, 2)).toBe(false);
    expect(overflowsClamp(41, 20, 2)).toBe(false);
    expect(overflowsClamp(100, Number.NaN, 2)).toBe(false);
    expect(overflowsClamp(100, 20, 0)).toBe(false);
  });

  it('draws no control for a value the clamp already fits', () => {
    withLayout(20);
    render(
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionListTerm>Note</DescriptionListTerm>
          <DescriptionListDescription clamp={2}>Rotated.</DescriptionListDescription>
        </DescriptionListItem>
      </DescriptionList>,
    );

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Rotated.').closest('dd')).toHaveAttribute('data-clamp', '');
  });

  it('reveals a clamped value and clamps it again, uncontrolled', () => {
    withLayout(200);
    render(
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionListTerm>Note</DescriptionListTerm>
          <DescriptionListDescription clamp={2}>Rotated.</DescriptionListDescription>
        </DescriptionListItem>
      </DescriptionList>,
    );

    const toggle = screen.getByRole('button', { name: 'Show more' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle.querySelector('[data-ui="icon"] > svg[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'chevron-down',
    );

    fireEvent.click(toggle);
    const collapse = screen.getByRole('button', { name: 'Show less' });
    expect(collapse).toHaveAttribute('aria-expanded', 'true');
    expect(collapse.closest('dd')).toHaveAttribute('data-revealed', '');

    fireEvent.click(collapse);
    expect(screen.getByRole('button', { name: 'Show more' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  /** Controlled means the component asks and waits; it never moves itself. */
  it('never moves a controlled value on its own', () => {
    withLayout(200);
    const onRevealedChange = vi.fn();
    render(
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionListTerm>Note</DescriptionListTerm>
          <DescriptionListDescription
            clamp={2}
            onRevealedChange={onRevealedChange}
            revealed={false}
          >
            Rotated.
          </DescriptionListDescription>
        </DescriptionListItem>
      </DescriptionList>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(onRevealedChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Show more' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  /**
   * A boolean cannot say whether a value was revealed by a press or by a key,
   * and a consumer that has to guess writes the wrong handler.
   */
  it('carries the reason a reveal was asked for, and can be refused', () => {
    withLayout(200);
    const onRevealedChange = vi.fn();
    render(
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionListTerm>Note</DescriptionListTerm>
          <DescriptionListDescription clamp={2} onRevealedChange={onRevealedChange}>
            Rotated.
          </DescriptionListDescription>
        </DescriptionListItem>
      </DescriptionList>,
    );

    const toggle = screen.getByRole('button', { name: 'Show more' });
    fireEvent.click(toggle);
    expect(onRevealedChange.mock.calls[0]?.[1]).toMatchObject({
      previous: false,
      reason: 'pointer',
      value: true,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    const keyed = screen.getByRole('button', { name: 'Show more' });
    fireEvent.keyDown(keyed, { key: 'Enter' });
    fireEvent.click(keyed);
    expect(onRevealedChange.mock.calls.at(-1)?.[1]).toMatchObject({ reason: 'keyboard' });

    onRevealedChange.mockImplementation((_value, request) => request.cancel());
    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  it('draws the placeholder for a value that is missing, and says why', () => {
    render(
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionListTerm>Owner</DescriptionListTerm>
          <DescriptionListDescription>{null}</DescriptionListDescription>
        </DescriptionListItem>
      </DescriptionList>,
    );

    expect(screen.getByText('Not provided')).toHaveAttribute('data-ui', 'visually-hidden');
    const mark = document.querySelector('[data-part="placeholder"]') as HTMLElement;
    expect(mark).toHaveAttribute('aria-hidden', 'true');
    /* An em dash, never a hyphen: a hyphen is a word joiner (DL2). */
    expect(mark.textContent).toBe('\u2014');
  });

  /**
   * Words a consumer states are meant to be seen. Without them the mark is
   * shown and the sentence is read instead, because a panel of twelve empty
   * rows saying "Not provided" twelve times is noise.
   */
  it('shows the words it was given, and the mark when it was given none', () => {
    const { rerender } = render(
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionListTerm>Owner</DescriptionListTerm>
          <DescriptionListDescription empty placeholder="Not set yet" />
        </DescriptionListItem>
      </DescriptionList>,
    );

    const words = screen.getByText('Not set yet');
    expect(words).toHaveAttribute('data-part', 'placeholder');
    expect(words).not.toHaveAttribute('aria-hidden');
    expect(document.querySelector('[data-ui="visually-hidden"]')).toBeNull();

    rerender(
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionListTerm>Owner</DescriptionListTerm>
          <DescriptionListDescription empty />
        </DescriptionListItem>
      </DescriptionList>,
    );

    const mark = document.querySelector('[data-part="placeholder"]') as HTMLElement;
    expect(mark.textContent).toBe('\u2014');
    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Not provided')).toHaveAttribute('data-ui', 'visually-hidden');
  });

  it('takes the placeholder text from the description, then the list messages, then the language', () => {
    const { rerender } = render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <DescriptionList>
          <DescriptionListItem>
            <DescriptionListTerm>Owner</DescriptionListTerm>
            <DescriptionListDescription empty />
          </DescriptionListItem>
        </DescriptionList>
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(screen.getByText('Não informado')).toBeInTheDocument();
    // language: en-US

    rerender(
      <DescriptionList messages={{ placeholder: 'No value' }}>
        <DescriptionListItem>
          <DescriptionListTerm>Owner</DescriptionListTerm>
          <DescriptionListDescription empty />
        </DescriptionListItem>
      </DescriptionList>,
    );
    expect(screen.getByText('No value')).toBeInTheDocument();

    rerender(
      <DescriptionList messages={{ placeholder: 'No value' }}>
        <DescriptionListItem>
          <DescriptionListTerm>Owner</DescriptionListTerm>
          <DescriptionListDescription empty placeholder="Not provided" />
        </DescriptionListItem>
      </DescriptionList>,
    );
    expect(screen.getByText('Not provided')).toBeInTheDocument();
  });
});

describe('copying', () => {
  const writeText = vi.fn<(value: string) => Promise<void>>();

  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis.navigator, 'clipboard');
  });

  function Copyable(props: { copyValue?: string; onCopy?: (request: unknown) => void }) {
    return (
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionListTerm>Resource name</DescriptionListTerm>
          <DescriptionListDescription copy {...props}>
            arn:aws:iam::421900075512:role/billing
          </DescriptionListDescription>
        </DescriptionListItem>
      </DescriptionList>
    );
  }

  it('puts the rendered value on the clipboard and says it finished', async () => {
    render(<Copyable />);

    const control = screen.getByRole('button', { name: 'Copy' });
    const glyph = () => control.querySelector('[data-ui="icon"] > svg[data-glyph]');
    expect(glyph()).toHaveAttribute('data-glyph', 'copy');
    fireEvent.click(control);

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith('arn:aws:iam::421900075512:role/billing'),
    );
    await waitFor(() => expect(control).toHaveAttribute('data-complete', ''));
    expect(glyph()).toHaveAttribute('data-glyph', 'check');
  });

  /** A formatted value is what the reader sees, and not always what is copied. */
  it('copies the stated value when the rendered one is a formatting of it', async () => {
    render(<Copyable copyValue="arn:aws:iam::421900075512:role/billing-reconciler" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith('arn:aws:iam::421900075512:role/billing-reconciler'),
    );
  });

  /**
   * The clipboard belongs to the platform, so a refusal is reported rather
   * than hidden: the control returns to rest and the value stays selectable.
   */
  it('reports a refused write and claims nothing', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const onCopy = vi.fn();
    render(
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionListTerm>Key</DescriptionListTerm>
          <DescriptionListDescription copy onCopy={onCopy}>
            sk_live
          </DescriptionListDescription>
        </DescriptionListItem>
      </DescriptionList>,
    );

    const control = screen.getByRole('button', { name: 'Copy' });
    fireEvent.click(control);

    await waitFor(() => expect(onCopy).toHaveBeenCalled());
    expect(onCopy.mock.calls[0]?.[0]).toMatchObject({ copied: false, reason: 'pointer' });
    expect(control).not.toHaveAttribute('data-complete');
  });

  /**
   * Both ways refused. `document.execCommand` does not exist in this
   * environment, so a rejected `writeText` reaches the end of the ladder, which
   * is the case this test is about: leaving the control at rest made a working
   * button indistinguishable from a broken one, so the family does the part it
   * still can — it selects the value and says so.
   */
  it('selects the value where the clipboard is refused, so the reader can take it', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const onCopy = vi.fn();
    render(<Copyable onCopy={onCopy} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => expect(onCopy).toHaveBeenCalled());
    expect(onCopy.mock.calls[0]?.[0]).toMatchObject({ copied: false, selected: true });
    expect(String(document.getSelection())).toContain('arn:aws:iam');
  });

  it('reports the same refusal where the platform offers no clipboard at all', async () => {
    Reflect.deleteProperty(globalThis.navigator, 'clipboard');
    await expect(copyToClipboard('value')).resolves.toBe(false);
  });

  /**
   * The rung between the two. A browser refuses `writeText` outside a user
   * gesture and while the document is not focused — both measured against the
   * running Storybook (DL1) — and answers `document.execCommand('copy')` in
   * exactly those cases. The control has copied, and says so.
   */
  it('copies through the command where the API refuses, and claims the success', async () => {
    writeText.mockRejectedValue(new DOMException('not focused', 'NotAllowedError'));
    const command = vi.fn().mockReturnValue(true);
    const had = document.execCommand;
    document.execCommand = command as unknown as typeof document.execCommand;
    const onCopy = vi.fn();
    render(<Copyable onCopy={onCopy} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => expect(onCopy).toHaveBeenCalled());
    expect(command).toHaveBeenCalledWith('copy');
    expect(onCopy.mock.calls[0]?.[0]).toMatchObject({ copied: true, selected: false });
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveAttribute('data-complete');
    document.execCommand = had;
  });
});

describe('a row action', () => {
  it('is a second definition of the same term, named by it', () => {
    render(
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionListTerm>Name</DescriptionListTerm>
          <DescriptionListDescription>Sarah Phillips</DescriptionListDescription>
          <DescriptionListAction>
            <a href="#name">Change</a>
          </DescriptionListAction>
        </DescriptionListItem>
      </DescriptionList>,
    );

    const action = screen.getByRole('link').closest('dd') as HTMLElement;
    expect(action).toHaveAttribute('data-part', 'action');
    expect(action.getAttribute('aria-describedby')).toBe(screen.getByText('Name').id);
  });

  /** A consumer's own reference survives and is composed with. */
  it('keeps a description the consumer wrote', () => {
    render(
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionListTerm>Name</DescriptionListTerm>
          <DescriptionListDescription>Sarah Phillips</DescriptionListDescription>
          <DescriptionListAction aria-describedby="policy">
            <a href="#name">Change</a>
          </DescriptionListAction>
        </DescriptionListItem>
      </DescriptionList>,
    );

    const described = screen.getByRole('link').closest('dd')?.getAttribute('aria-describedby');
    expect(described?.split(' ')).toEqual(['policy', screen.getByText('Name').id]);
  });
});

describe('composition', () => {
  it('substitutes the rendered element of every part', () => {
    render(
      <DescriptionList render={(props) => <section {...props} />}>
        <DescriptionListItem render={(props) => <div {...props} data-testid="pair" />}>
          <DescriptionListTerm>Name</DescriptionListTerm>
          <DescriptionListDescription>Sarah</DescriptionListDescription>
        </DescriptionListItem>
      </DescriptionList>,
    );

    expect(root().tagName).toBe('SECTION');
    expect(screen.getByTestId('pair')).toHaveAttribute('data-part', 'item');
  });

  it('passes native attributes and events through to the element that owns them', () => {
    const onClick = vi.fn();
    render(
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionListTerm id="own-id" lang="pt-BR" title="Nome">
            Nome
          </DescriptionListTerm>
          <DescriptionListDescription onClick={onClick}>Sarah</DescriptionListDescription>
        </DescriptionListItem>
      </DescriptionList>,
    );

    const term = screen.getByText('Nome');
    expect(term).toHaveAttribute('id', 'own-id');
    expect(term).toHaveAttribute('lang', 'pt-BR');
    expect(term).toHaveAttribute('title', 'Nome');

    fireEvent.click(screen.getByText('Sarah'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  /** A consumer owning the value keeps it after every render. */
  it('lets a consumer own the revealed state', () => {
    withLayout(200);
    function Owner() {
      const [revealed, setRevealed] = useState(false);
      return (
        <DescriptionList>
          <DescriptionListItem>
            <DescriptionListTerm>Note</DescriptionListTerm>
            <DescriptionListDescription
              clamp={2}
              onRevealedChange={(next) => setRevealed(next)}
              revealed={revealed}
            >
              Rotated.
            </DescriptionListDescription>
          </DescriptionListItem>
        </DescriptionList>
      );
    }

    render(<Owner />);
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });
});
