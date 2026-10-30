import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ChangeRequest } from '@slotted/core/state';
import { provideSlotted } from '@slotted/angular/i18n';
import type { DescriptionListMessages, PartialMessages } from '@slotted/core/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/description-list/contract.json';
import {
  SlDescriptionList,
  SlDescriptionListAction,
  SlDescriptionListDescription,
  SlDescriptionListHint,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from './description-list';
import {
  copyToClipboard,
  overflowsClamp,
  provideDescriptionListDefaults,
  spanWithin,
  type DescriptionListCopyRequest,
} from './description-list.constants';

/**
 * jsdom has no layout, so a value's `scrollHeight` is zero and its resolved
 * line height is empty — and the control that reveals a clamped value appears
 * only for a value that has more text than the clamp allows. The measurement is
 * stubbed rather than skipped, because what is being tested is what the family
 * does with the answer.
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

const PARTS = [
  SlDescriptionList,
  SlDescriptionListAction,
  SlDescriptionListDescription,
  SlDescriptionListHint,
  SlDescriptionListItem,
  SlDescriptionListTerm,
];

@Component({
  standalone: true,
  imports: PARTS,
  template: `
    <div
      slDescriptionList
      [columns]="columns()"
      [layout]="layout()"
      [termWidth]="termWidth()"
      [variant]="variant()"
    >
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Environment</dt>
        <dd slDescriptionListDescription>Production</dd>
      </div>
      <div slDescriptionListItem [span]="span()">
        <dt slDescriptionListTerm>
          Retention
          <span slDescriptionListHint>How long a deleted object stays recoverable.</span>
        </dt>
        <dd slDescriptionListDescription>30 days</dd>
      </div>
    </div>
  `,
})
class Panel {
  readonly columns = signal<1 | 2 | 3 | undefined>(undefined);
  readonly layout = signal<'row' | 'stack' | undefined>(undefined);
  readonly termWidth = signal<string | undefined>(undefined);
  readonly variant = signal<'plain' | 'ruled' | 'framed' | undefined>(undefined);
  readonly span = signal<1 | 2 | 3 | undefined>(undefined);
}

function panel() {
  const fixture = TestBed.createComponent(Panel);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector('[data-ui="description-list"]') as HTMLElement;
  return { fixture, root, list: root.querySelector('dl') as HTMLElement };
}

describe('SlDescriptionList', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const { list, root } = panel();

    expect(root.tagName).toBe('DIV');
    expect(root.getAttribute('data-part')).toBe('root');
    expect(list.tagName).toBe('DL');
    expect(list.getAttribute('data-part')).toBe('list');
    expect(list.querySelector('[data-part="item"]')?.tagName).toBe('DIV');
    expect(list.querySelector('[data-part="term"]')?.tagName).toBe('DT');
    expect(list.querySelector('[data-part="description"]')?.tagName).toBe('DD');
    expect(list.querySelector('[data-part="value"]')?.textContent?.trim()).toBe('Production');
    expect(list.querySelector('[data-part="hint"]')).not.toBeNull();
  });

  /**
   * `dl`, `dt` and `dd` carry `list`, `term` and `definition` already. MDN
   * records that writing the ARIA roles by hand changes how VoiceOver
   * announces the construct, so the family writes none of them.
   */
  it('writes no role of its own', () => {
    const { list, root } = panel();
    for (const element of [root, list, ...list.querySelectorAll('dt, dd, div')]) {
      expect(element.getAttribute('role')).toBeNull();
    }
  });

  it('answers every axis from the input, then the provider, then its own default', () => {
    const { fixture, root } = panel();
    expect(root.getAttribute('data-layout')).toBe(contract.resolution.layout[2]);
    expect(root.getAttribute('data-columns')).toBe(contract.resolution.columns[2]);
    expect(root.getAttribute('data-variant')).toBe(contract.resolution.variant[2]);
    expect(root.getAttribute('data-min-column-width')).toBe(contract.resolution.minColumnWidth[2]);

    fixture.componentInstance.layout.set('stack');
    fixture.componentInstance.columns.set(3);
    fixture.componentInstance.variant.set('framed');
    fixture.detectChanges();

    expect(root.getAttribute('data-layout')).toBe('stack');
    expect(root.getAttribute('data-columns')).toBe('3');
    expect(root.getAttribute('data-variant')).toBe('framed');
  });

  it('lets an application set the whole family once', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideDescriptionListDefaults({
          columns: 2,
          layout: 'stack',
          minColumnWidth: 'sm',
          variant: 'ruled',
        }),
      ],
    });

    const { fixture, root } = panel();
    expect(root.getAttribute('data-min-column-width')).toBe('sm');
    expect(root.getAttribute('data-layout')).toBe('stack');
    expect(root.getAttribute('data-columns')).toBe('2');
    expect(root.getAttribute('data-variant')).toBe('ruled');

    /* An explicit input is never overridden by the token. */
    fixture.componentInstance.layout.set('row');
    fixture.detectChanges();
    expect(root.getAttribute('data-layout')).toBe('row');
  });

  it('hands the term width to the stylesheet as a custom property', () => {
    const { fixture, root } = panel();
    fixture.componentInstance.termWidth.set('8rem');
    fixture.detectChanges();
    expect(root.style.getPropertyValue('--slotted-description-list-term-width')).toBe('8rem');
  });

  /**
   * Grid invents the tracks it is asked for, so a pair asking for three columns
   * of a two-column list would grow the list a column nobody declared.
   */
  it('clamps a span to the columns the list has', () => {
    expect(spanWithin(undefined, 3)).toBeUndefined();
    expect(spanWithin(1, 3)).toBeUndefined();
    expect(spanWithin(2, 3)).toBe(2);
    expect(spanWithin(3, 2)).toBe(2);

    const { fixture, list } = panel();
    fixture.componentInstance.columns.set(2);
    fixture.componentInstance.span.set(3);
    fixture.detectChanges();

    const items = list.querySelectorAll('[data-part="item"]');
    expect(items[1]?.getAttribute('data-span')).toBe('2');
    expect(items[0]?.getAttribute('data-span')).toBeNull();
  });
});

@Component({
  standalone: true,
  imports: PARTS,
  template: `
    <div slDescriptionList>
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Change note</dt>
        <dd
          slDescriptionListDescription
          [clamp]="clamp()"
          [revealed]="revealed()"
          (revealedChange)="requests.push($event)"
        >
          Rotated the reconciliation credentials.
        </dd>
      </div>
    </div>
  `,
})
class Clamped {
  readonly clamp = signal(2);
  readonly revealed = signal<boolean | undefined>(undefined);
  readonly requests: ChangeRequest<boolean>[] = [];
}

describe('a clamped value', () => {
  function clamped(scrollHeight = 200) {
    withLayout(scrollHeight);
    const fixture = TestBed.createComponent(Clamped);
    fixture.detectChanges();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      description: root.querySelector('[data-part="description"]') as HTMLElement,
      toggle: () => root.querySelector('[data-part="toggle"]') as HTMLButtonElement,
    };
  }

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
    const { toggle, description } = clamped(20);
    expect(toggle()).toBeNull();
    expect(description.getAttribute('data-clamp')).toBe('');
  });

  it('keeps every character in the DOM and says how many lines it shows', () => {
    const { description } = clamped();

    expect(description.getAttribute('data-clamp')).toBe('');
    expect(description.style.getPropertyValue('--slotted-description-list-clamp')).toBe('2');
    expect(description.querySelector('[data-part="value"]')?.textContent).toContain(
      'Rotated the reconciliation credentials.',
    );
  });

  it('reveals and clamps again, uncontrolled', () => {
    const { description, fixture, toggle } = clamped();

    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(toggle().textContent?.trim()).toBe('Show more');
    expect(
      toggle().querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph'),
    ).toBe('chevron-down');

    toggle().click();
    fixture.detectChanges();
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(toggle().textContent?.trim()).toBe('Show less');
    expect(description.getAttribute('data-revealed')).toBe('');

    toggle().click();
    fixture.detectChanges();
    expect(description.getAttribute('data-revealed')).toBeNull();
  });

  /** Controlled means the component asks and waits; it never moves itself. */
  it('never moves a controlled value on its own', () => {
    const { fixture, toggle } = clamped();
    fixture.componentInstance.revealed.set(false);
    fixture.detectChanges();

    toggle().click();
    fixture.detectChanges();

    expect(fixture.componentInstance.requests.length).toBe(1);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('carries the reason a reveal was asked for, and can be refused', () => {
    const { fixture, toggle } = clamped();

    toggle().click();
    fixture.detectChanges();
    expect(fixture.componentInstance.requests[0]).toMatchObject({
      previous: false,
      reason: 'pointer',
      value: true,
    });

    toggle().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    toggle().click();
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)?.reason).toBe('keyboard');
  });
});

@Component({
  standalone: true,
  imports: PARTS,
  template: `
    <div slDescriptionList [messages]="words()">
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Resource name</dt>
        <dd
          slDescriptionListDescription
          copy
          [copyValue]="copyValue()"
          (copied)="results.push($event)"
        >
          arn:aws:iam::421900075512:role/billing
        </dd>
      </div>
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Owner</dt>
        <dd slDescriptionListDescription empty [placeholder]="placeholder()"></dd>
      </div>
      <div slDescriptionListItem>
        <dt slDescriptionListTerm id="own-term">Name</dt>
        <dd slDescriptionListDescription>Sarah Phillips</dd>
        <dd slDescriptionListAction aria-describedby="policy"><a href="#name">Change</a></dd>
      </div>
    </div>
  `,
})
class Panels {
  readonly copyValue = signal<string | undefined>(undefined);
  readonly placeholder = signal<string | undefined>(undefined);
  readonly words = signal<PartialMessages<DescriptionListMessages> | undefined>(undefined);
  readonly results: DescriptionListCopyRequest[] = [];
}

describe('copying, the missing value and the row action', () => {
  const writeText = vi.fn<(value: string) => Promise<void>>();

  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  function panels() {
    const fixture = TestBed.createComponent(Panels);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('puts the rendered value on the clipboard and says it finished', async () => {
    const { fixture, root } = panels();
    const control = root.querySelector('[data-part="copy"]') as HTMLButtonElement;
    const glyph = () =>
      control.querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');
    expect(glyph()).toBe('copy');

    control.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith('arn:aws:iam::421900075512:role/billing');
    expect(control.getAttribute('data-complete')).toBe('');
    expect(glyph()).toBe('check');
    expect(fixture.componentInstance.results[0]?.copied).toBe(true);
  });

  /** A formatted value is what the reader sees, and not always what is copied. */
  it('copies the stated value when the rendered one is a formatting of it', async () => {
    const { fixture, root } = panels();
    fixture.componentInstance.copyValue.set('arn:aws:iam::421900075512:role/billing-reconciler');
    fixture.detectChanges();

    (root.querySelector('[data-part="copy"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledWith('arn:aws:iam::421900075512:role/billing-reconciler');
  });

  /**
   * The clipboard belongs to the platform, so a refusal is reported rather than
   * hidden: the control returns to rest and the value stays selectable.
   */
  it('reports a refused write and claims nothing', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const { fixture, root } = panels();
    const control = root.querySelector('[data-part="copy"]') as HTMLButtonElement;

    control.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.results[0]?.copied).toBe(false);
    expect(control.getAttribute('data-complete')).toBeNull();
  });

  it('reports the same refusal where the platform offers no clipboard at all', async () => {
    Reflect.deleteProperty(navigator, 'clipboard');
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
    const { fixture, root } = panels();
    const control = root.querySelector('[data-part="copy"]') as HTMLButtonElement;

    control.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(command).toHaveBeenCalledWith('copy');
    expect(fixture.componentInstance.results[0]).toMatchObject({ copied: true, selected: false });
    expect(control.getAttribute('data-complete')).toBe('');
    document.execCommand = had;
  });

  /**
   * Words a consumer states are meant to be seen. Without them the mark is drawn
   * and the sentence is read instead, because a panel of twelve empty rows
   * saying "Not provided" twelve times is noise.
   */
  it('draws the placeholder for a value that is missing, and says why', () => {
    const { root } = panels();
    const mark = root.querySelector('[data-part="placeholder"]') as HTMLElement;

    expect(mark.getAttribute('aria-hidden')).toBe('true');
    /* An em dash, never a hyphen: a hyphen is a word joiner (DL2). */
    expect(mark.textContent).toBe('\u2014');
    expect(root.querySelector('[data-ui="visually-hidden"]')?.textContent).toBe('Not provided');
  });

  it('reads the list messages over the language in force', () => {
    const { fixture, root } = panels();
    fixture.componentInstance.words.set({ placeholder: 'No value', copy: 'Copy' });
    fixture.detectChanges();
    expect(root.querySelector('[data-ui="visually-hidden"]')?.textContent).toBe('No value');
    expect(root.querySelector('[data-part="copy"]')?.getAttribute('aria-label')).toBe('Copy');
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const { fixture, root } = panels();
    const hidden = () => root.querySelector('[data-ui="visually-hidden"]')?.textContent;
    // language: pt-BR
    expect(hidden()).toBe('Não informado');
    // language: en-US
    expect(root.querySelector('[data-part="copy"]')?.getAttribute('aria-label')).toBe('Copiar');

    locale.set('en-US');
    fixture.detectChanges();
    expect(hidden()).toBe('Not provided');
  });

  it('shows the words it was given rather than drawing over them', () => {
    const { fixture, root } = panels();
    fixture.componentInstance.placeholder.set('Not set yet');
    fixture.detectChanges();

    const mark = root.querySelector('[data-part="placeholder"]') as HTMLElement;
    expect(mark.textContent?.trim()).toBe('Not set yet');
    expect(mark.getAttribute('aria-hidden')).toBeNull();
    expect(root.querySelector('[data-ui="visually-hidden"]')).toBeNull();
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
    const { fixture, root } = panels();

    (root.querySelector('[data-part="copy"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.results[0]).toMatchObject({ copied: false, selected: true });
    expect(String(document.getSelection())).toContain('arn:aws:iam');
  });

  /** A static attribute the consumer wrote survives, and is composed with. */
  it('names a row action by its own term, after anything the consumer wrote', () => {
    const { root } = panels();
    const action = root.querySelector('[data-part="action"]') as HTMLElement;
    const term = root.querySelector('#own-term') as HTMLElement;

    expect(term.id).toBe('own-term');
    const described = action.getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(described[0]).toBe('policy');
    expect(described[1]).toMatch(/^slotted-description-list-/);
  });
});
