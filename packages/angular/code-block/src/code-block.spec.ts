import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import type { CodeLine, CodeMarks } from '@slotted/core/code';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/code-block/contract.json';
import { SlCodeBlock, SlCodeBlockAction, SlCodeBlockLine } from './code-block';
import { provideCodeBlockDefaults } from './code-block.constants';

const CODE = [
  'const a = 1;',
  'const b = 2;',
  'export const sum = a + b;',
  'console.log(sum);',
].join('\n');

const tokenise = (code: string): CodeLine[] =>
  code.split('\n').map((line) =>
    line
      .split(/(\bconst\b|\bexport\b|\d+)/)
      .filter((piece) => piece !== '')
      .map((piece) =>
        /^\d+$/.test(piece)
          ? { scope: 'number' as const, text: piece }
          : piece === 'const' || piece === 'export'
            ? { scope: 'keyword' as const, text: piece }
            : { text: piece },
      ),
  );

@Component({
  imports: [SlCodeBlock, SlCodeBlockAction, SlCodeBlockLine],
  template: `<div
    slCodeBlock
    #block="slCodeBlock"
    [code]="code()"
    [language]="language()"
    [title]="title()"
    [lineNumbers]="lineNumbers()"
    [start]="start()"
    [marks]="marks()"
    [collapseAfter]="collapseAfter()"
    [maxLines]="maxLines()"
    [copy]="copy()"
    [copyRemoved]="copyRemoved()"
    [loading]="loading()"
    [highlight]="highlight()"
    [tokens]="tokens()"
    [(wrap)]="wrap"
    [(revealed)]="revealed"
    (wrapChangeRequest)="onWrap($event)"
    (revealedChangeRequest)="onRevealed($event)"
    (copyRequest)="onCopy($event)"
    (highlightError)="onError($event)"
  >
    @if (action()) {
      <button slCodeBlockAction type="button">Run</button>
    }
  </div>`,
})
class TestHost {
  readonly code = signal(CODE);
  readonly language = signal('ts');
  readonly title = signal<string | undefined>('sum.ts');
  readonly lineNumbers = signal<boolean | undefined>(true);
  readonly start = signal(1);
  readonly marks = signal<CodeMarks | undefined>(undefined);
  readonly collapseAfter = signal<number | undefined>(undefined);
  readonly maxLines = signal<number | undefined>(undefined);
  readonly copy = signal<boolean | undefined>(undefined);
  readonly copyRemoved = signal(false);
  readonly loading = signal(false);
  readonly highlight = signal<
    ((code: string, language: string) => Promise<CodeLine[]>) | null | undefined
  >(undefined);
  readonly tokens = signal<readonly CodeLine[] | undefined>(undefined);
  readonly action = signal(false);
  readonly wrap = signal(false);
  readonly revealed = signal(false);
  readonly onWrap = vi.fn();
  readonly onRevealed = vi.fn();
  readonly onCopy = vi.fn();
  readonly onError = vi.fn();
}

function setup(providers: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [TestHost], providers: providers as never[] });
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector('[data-ui="code-block"]') as HTMLElement;
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    part: (name: string) => root.querySelector(`[data-part="${name}"]`) as HTMLElement,
    /** The glyph a part draws, read from the `slIcon` inside it. */
    glyph: (name: string) =>
      root
        .querySelector(`[data-part="${name}"] > [data-ui="icon"] > svg[data-glyph]`)
        ?.getAttribute('data-glyph'),
    lines: () => [...root.querySelectorAll('[data-part="line"]')] as HTMLElement[],
    settle: () => fixture.detectChanges(),
  };
}

describe('SlCodeBlock', () => {
  it('is selected in public by the family identifier, and draws the fence parts from text', () => {
    const { glyph, root, part, lines } = setup();
    expect(root.getAttribute('data-ui')).toBe(contract.ui);
    expect(root.getAttribute('data-part')).toBe('root');
    expect(root.getAttribute('data-language')).toBe('ts');
    for (const name of [
      'header',
      'icon',
      'title',
      'language',
      'actions',
      'copy',
      'body',
      'pre',
      'code',
      'line',
      'number',
      'marker',
      'text',
    ]) {
      expect(part(name)).not.toBeNull();
    }
    /* The scroll-area's root is this family's body: the template's part wins over the directive's. */
    expect(part('body').getAttribute('data-ui')).toBe('scroll-area');
    /* A `.ts` name is no kind the upload map knows: the plain file glyph. */
    expect(glyph('icon')).toBe('file');
    expect(part('code').className).toBe('language-ts');
    expect(lines()).toHaveLength(4);
    expect(lines()[2]!.getAttribute('data-line')).toBe('3');
    expect(part('text').textContent).toBe('const a = 1;');
    expect(root.hasAttribute('data-line-numbers')).toBe(true);
    expect(root.style.getPropertyValue('--slotted-code-block-digits')).toBe('1');
  });

  it('never writes HTML: a script tag in the sample is six characters', () => {
    const { host, root, part, settle } = setup();
    host.code.set('<script>alert(1)</script>');
    settle();
    expect(root.querySelector('script')).toBeNull();
    expect(part('text').textContent).toBe('<script>alert(1)</script>');
  });

  it('draws plain text first and swaps the engine’s tokens in when they arrive', async () => {
    const highlight = vi.fn(async (code: string) => tokenise(code));
    const { host, root, settle } = setup();
    host.highlight.set(highlight);
    settle();
    expect(root.querySelector('[data-part="token"]')).toBeNull();
    await vi.waitFor(() => {
      settle();
      expect(root.querySelectorAll('[data-token="keyword"]').length).toBe(4);
    });
    expect(highlight).toHaveBeenCalledWith(CODE, 'ts');
  });

  it('takes the engine from the provider, and reports a rejected one', async () => {
    const highlight = vi.fn(() => Promise.reject(new Error('no grammar')));
    const { host, part, settle } = setup([
      provideCodeBlockDefaults({ highlight, lineNumbers: true }),
    ]);
    host.lineNumbers.set(undefined);
    settle();
    await vi.waitFor(() => expect(host.onError).toHaveBeenCalled());
    settle();
    expect(part('text').textContent).toBe('const a = 1;');
  });

  it('marks lines in one precedence and dims outside the focus', () => {
    const { host, root, lines, settle } = setup();
    host.marks.set({ add: '2', focus: '2-3', highlight: '1-2', remove: [3] });
    settle();
    expect(root.hasAttribute('data-marks')).toBe(true);
    expect(lines().map((line) => line.getAttribute('data-mark'))).toEqual([
      'highlight',
      'add',
      'remove',
      null,
    ]);
    expect(lines().map((line) => line.hasAttribute('data-dim'))).toEqual([
      true,
      false,
      false,
      true,
    ]);
  });

  it('copies the code the consumer gave, without the removed lines, and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
    try {
      const { glyph, host, part, settle } = setup();
      host.marks.set({ remove: '2' });
      settle();
      expect(glyph('copy')).toBe('copy');
      part('copy').click();
      await vi.waitFor(() => expect(host.onCopy).toHaveBeenCalled());
      expect(writeText).toHaveBeenCalledWith(
        ['const a = 1;', 'export const sum = a + b;', 'console.log(sum);'].join('\n'),
      );
      expect(host.onCopy.mock.calls[0]![0].copied).toBe(true);
      expect(host.onCopy.mock.calls[0]![0].reason).toBe('pointer');
      settle();
      expect(part('copy').hasAttribute('data-complete')).toBe(true);
      expect(glyph('copy')).toBe('check');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('draws no copy control when copy is off, and projects the consumer’s own action', () => {
    const { host, root, part, settle } = setup();
    host.copy.set(false);
    host.action.set(true);
    settle();
    expect(root.querySelector('[data-part="copy"]')).toBeNull();
    expect(part('actions').querySelector('button')?.textContent).toBe('Run');
  });

  it('wraps as a pressed control, carrying the reason, and indents the continuation', () => {
    const { host, root, lines, settle } = setup();
    host.code.set('  indented();\nplain();');
    host.wrap.set(true);
    settle();
    expect(root.hasAttribute('data-wrap')).toBe(true);
    const wrap = root.querySelector('[data-part="wrap"]') as HTMLButtonElement;
    expect(wrap.getAttribute('aria-pressed')).toBe('true');
    expect(wrap.getAttribute('aria-label')).toBe('Unwrap lines');
    expect(wrap.querySelector('[data-ui="icon"] > svg')?.getAttribute('data-glyph')).toBe(
      'text-wrap',
    );
    expect(lines()[0]!.style.getPropertyValue('--slotted-code-block-indent')).toBe('2');
    expect(lines()[1]!.style.getPropertyValue('--slotted-code-block-indent')).toBe('');
    wrap.click();
    settle();
    expect(host.onWrap.mock.calls[0]![0].value).toBe(false);
    expect(host.onWrap.mock.calls[0]![0].reason).toBe('pointer');
    expect(host.wrap()).toBe(false);
    expect(root.hasAttribute('data-wrap')).toBe(false);
  });

  it('collapses after the given lines, reveals on request, and collapses again on Escape', () => {
    const { host, root, part, settle } = setup();
    host.collapseAfter.set(2);
    settle();
    expect(root.hasAttribute('data-collapse')).toBe(true);
    expect(root.style.getPropertyValue('--slotted-code-block-collapse')).toBe('2');
    const reveal = part('reveal') as HTMLButtonElement;
    expect(reveal.textContent?.trim()).toBe('Show 2 more lines');
    reveal.click();
    settle();
    expect(host.onRevealed.mock.calls[0]![0].value).toBe(true);
    expect(host.revealed()).toBe(true);
    expect(root.hasAttribute('data-revealed')).toBe(true);
    expect(reveal.textContent?.trim()).toBe('Show less');
    part('body').dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    settle();
    expect(host.onRevealed.mock.calls[1]![0].reason).toBe('escape');
    expect(host.revealed()).toBe(false);
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const { host, part, settle } = setup([
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);
    host.collapseAfter.set(3);
    settle();
    // language: pt-BR
    expect(part('reveal').textContent?.trim()).toBe('Mostrar mais 1 linha');
    expect(part('copy').getAttribute('aria-label')).toBe('Copiar código');
    // language: en-US

    locale.set('en-US');
    settle();
    expect(part('reveal').textContent?.trim()).toBe('Show 1 more line');
  });

  it('refuses a cancelled request', () => {
    const { host, root, part, settle } = setup();
    host.collapseAfter.set(1);
    host.onRevealed.mockImplementation((request: { cancel(): void }) => request.cancel());
    settle();
    part('reveal').click();
    settle();
    expect(host.revealed()).toBe(false);
    expect(root.hasAttribute('data-revealed')).toBe(false);
  });

  it('bounds the body with maxLines and names the region after the title', () => {
    const { host, root, part, settle } = setup();
    host.maxLines.set(2);
    settle();
    expect(root.style.getPropertyValue('--slotted-code-block-max-lines')).toBe('2');
    expect(part('body').hasAttribute('data-max-lines')).toBe(true);
  });

  it('scrolls only inline unless maxLines bounds it, so the page keeps its wheel', () => {
    const { host, part, settle } = setup();
    settle();
    expect(part('body').getAttribute('data-axis')).toBe('inline');
    host.maxLines.set(2);
    settle();
    expect(part('body').getAttribute('data-axis')).toBe('both');
  });

  it('draws skeleton lines while loading and one empty line for an empty string', () => {
    const { host, root, lines, settle } = setup();
    host.code.set('');
    settle();
    expect(root.hasAttribute('data-empty')).toBe(true);
    expect(lines()).toHaveLength(1);
    host.loading.set(true);
    settle();
    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelector('[data-ui="skeleton"]')).not.toBeNull();
    expect(root.querySelector('[data-part="copy"]')).toBeNull();
  });

  it('numbers from start and widens the gutter to the last number', () => {
    const { host, root, lines, settle } = setup();
    host.start.set(98);
    settle();
    expect(lines()[0]!.querySelector('[data-part="number"]')?.textContent).toBe('98');
    expect(root.style.getPropertyValue('--slotted-code-block-digits')).toBe('3');
  });

  it('accepts tokens the consumer made, and lets a template draw a line', () => {
    @Component({
      imports: [SlCodeBlock, SlCodeBlockLine],
      template: `<div slCodeBlock code="x" [tokens]="tokens">
        <ng-template slCodeBlockLine let-line let-number="number"
          ><mark>{{ number }}</mark></ng-template
        >
      </div>`,
    })
    class Custom {
      readonly tokens: CodeLine[] = [[{ scope: 'keyword', text: 'x' }]];
    }
    TestBed.configureTestingModule({ imports: [Custom] });
    const fixture = TestBed.createComponent(Custom);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('mark')?.textContent).toBe('1');
  });

  it('exposes copyCode and scrollToLine through exportAs', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
    try {
      const { fixture } = setup();
      const block = fixture.debugElement
        .query((node) => node.name === 'div' && node.attributes['slCodeBlock'] !== undefined)
        ?.injector.get(SlCodeBlock) as SlCodeBlock;
      expect(await block.copyCode()).toBe(true);
      expect(writeText).toHaveBeenCalledWith(CODE);
      expect(() => block.scrollToLine(3)).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('starts an unbound block from defaultWrap and defaultRevealed, and moves on its own', () => {
    @Component({
      imports: [SlCodeBlock],
      template: `<div
        slCodeBlock
        [code]="code"
        defaultWrap
        defaultRevealed
        [collapseAfter]="2"
      ></div>`,
    })
    class Uncontrolled {
      readonly code = CODE;
    }
    TestBed.configureTestingModule({ imports: [Uncontrolled] });
    const fixture = TestBed.createComponent(Uncontrolled);
    fixture.detectChanges();
    const root = document.querySelector('[data-ui="code-block"]') as HTMLElement;
    expect(root.hasAttribute('data-wrap')).toBe(true);
    expect(root.hasAttribute('data-revealed')).toBe(true);
    (root.querySelector('[data-part="reveal"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.hasAttribute('data-revealed')).toBe(false);
  });
});
