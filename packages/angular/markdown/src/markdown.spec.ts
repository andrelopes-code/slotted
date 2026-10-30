import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fromMarkedTokens } from '@slotted/core/markdown';
import type { MarkdownNode } from '@slotted/core/markdown';
import { provideSlotted } from '@slotted/angular/i18n';
import { provideSkeletonDefaults } from '@slotted/angular/skeleton';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { marked } from 'marked';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/markdown/contract.json';
import { SlMarkdown, SlMarkdownChildren, SlMarkdownEmpty, SlMarkdownNode } from './markdown';
import type { MarkdownRetryReason, MarkdownStatus, MarkdownTaskChange } from './markdown';
import { provideMarkdownDefaults } from './markdown-defaults';

const md = (source: string): MarkdownNode => fromMarkedTokens(marked.lexer(source));

@Component({
  imports: [SlMarkdown, SlMarkdownChildren, SlMarkdownEmpty, SlMarkdownNode],
  template: `
    <div
      slMarkdown
      id="root"
      [tree]="tree()"
      [status]="status()"
      [loading]="loading()"
      [streaming]="streaming()"
      [idPrefix]="prefix()"
      [headingAnchors]="anchors()"
      [headingOffset]="offset()"
      [editableTasks]="editable()"
      [retryable]="retryable()"
      (taskChange)="tasks.push($event)"
      (retry)="retries.push($event)"
    >
      <span slMarkdownEmpty>Nothing written yet.</span>
      <ng-template slMarkdownNode="html" let-element>
        <span class="raw">{{ element.node?.value }}</span>
      </ng-template>
      <ng-template slMarkdownNode="strong" let-element>
        <b class="loud"><ng-container [slMarkdownChildren]="element" /></b>
      </ng-template>
    </div>
  `,
})
class Host {
  readonly tree = signal<MarkdownNode | null>(md('Hello'));
  readonly status = signal<MarkdownStatus>('ready');
  readonly loading = signal(false);
  readonly streaming = signal(false);
  readonly prefix = signal('');
  readonly anchors = signal<boolean | undefined>(undefined);
  readonly offset = signal(0);
  readonly editable = signal(false);
  readonly retryable = signal(false);
  readonly tasks: MarkdownTaskChange[] = [];
  readonly retries: MarkdownRetryReason[] = [];
}

@Component({
  imports: [SlMarkdown],
  template: `<div slMarkdown id="root" [allow]="allow" [source]="source()"></div>`,
})
class SourceHost {
  readonly allow = ['paragraph', 'text', 'list', 'listItem', 'strong', 'link'];
  readonly source = signal('- **a** [b](/c)');
}

function mount(source?: string, providers: unknown[] = []) {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  if (source !== undefined) fixture.componentInstance.tree.set(md(source));
  fixture.detectChanges();
  const root = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#root')!;
  const update = () => fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, root, update };
}

/** A language model's answer arrives as CommonMark text; the family reads it without a parser of the consumer's own. */
describe('SlMarkdown from source', () => {
  it('parses the allowed subset and keeps any other syntax as text', () => {
    const fixture = TestBed.createComponent(SourceHost);
    fixture.detectChanges();
    const root = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#root')!;
    const item = root.querySelector('ul > li') as HTMLElement;
    expect(item.querySelector('strong')?.textContent).toBe('a');
    expect(item.querySelector('a')?.getAttribute('href')).toBe('/c');

    fixture.componentInstance.source.set('# t');
    fixture.detectChanges();
    expect(root.querySelector('h1')).toBeNull();
    expect(root.querySelector('p')?.textContent).toBe('# t');
  });
});

describe('SlMarkdown', () => {
  it('is selected by the family identifier and writes the contract defaults', () => {
    const { root } = mount();
    expect(root.getAttribute('data-ui')).toBe(contract.ui);
    expect(root.getAttribute('data-status')).toBe(contract.members.markdown.defaults.status);
    expect(root.querySelector("[data-ui='prose'] > p")?.textContent).toBe('Hello');
  });

  it('never writes raw HTML it was not asked to, and draws a refused link as its text', () => {
    const { root } = mount('[click](javascript:alert(1)) <img src=x onerror=alert(1)>');
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('a')).toBeNull();
    expect(root.querySelector('.raw')?.textContent).toContain('<img');
  });

  it('lets a template replace a kind and render its children in place', () => {
    const { root } = mount('a **b** c');
    const loud = root.querySelector('b.loud');
    expect(loud?.textContent).toBe('b');
    expect(root.querySelector('strong')).toBeNull();
  });

  it('gives headings stable ids and permalinks, moved by the offset', () => {
    const { host, root, update } = mount('# Setup\n\n# Setup');
    host.prefix.set('m-');
    host.anchors.set(true);
    host.offset.set(1);
    update();
    const headings = [...root.querySelectorAll('h2')];
    expect(headings.map((heading) => heading.id)).toEqual(['m-setup', 'm-setup-1']);
    const anchor = headings[0]?.querySelector("[data-part='anchor']");
    expect(anchor?.getAttribute('href')).toBe('#m-setup');
    expect(anchor?.getAttribute('aria-label')).toBe('Link to section: Setup');
  });

  it('opens an external link through slLink, and keeps a local one plain', () => {
    const { root } = mount('[docs](https://example.com) [home](/home)');
    const [external, local] = [...root.querySelectorAll('a')];
    expect(external?.getAttribute('target')).toBe('_blank');
    expect(external?.getAttribute('data-ui')).toBe('link');
    expect(local?.hasAttribute('target')).toBe(false);
  });

  it('keeps external links in the tab when the application says so', () => {
    const { root } = mount('[docs](https://example.com)', [
      provideMarkdownDefaults({ external: 'same-tab' }),
    ]);
    expect(root.querySelector('a')?.hasAttribute('target')).toBe(false);
  });

  it('draws a fence with slCodeBlock and a table with logical alignment', () => {
    const { root } = mount('```ts title="a.ts"\nlet a;\n```\n\n| a | b |\n|:-|-:|\n| 1 | 2 |');
    const block = root.querySelector("[data-part='embed'] > [data-ui='code-block']");
    expect(block?.textContent).toContain('a.ts');
    const cells = [...root.querySelectorAll('td')];
    expect(cells.map((cell) => cell.getAttribute('data-align'))).toEqual(['start', 'end']);
    expect(root.querySelectorAll("th[scope='col']")).toHaveLength(2);
  });

  it('reads a GitHub alert into an alert that does not announce itself', () => {
    const { root } = mount('> [!TIP]\n> Use the flag.');
    const alert = root.querySelector("[data-ui='alert']");
    expect(alert?.getAttribute('data-tone')).toBe('success');
    expect(alert?.getAttribute('data-live')).toBe('off');
    expect(alert?.textContent).toContain('Tip');
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const { root, update } = mount('> [!TIP]\n> Use the flag.', [
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);
    expect(root.querySelector("[data-ui='alert']")?.textContent).toContain('Dica');

    locale.set('en-US');
    update();
    expect(root.querySelector("[data-ui='alert']")?.textContent).toContain('Tip');
  });

  it('draws tasks read-only until the template enables them, and asks for each change', () => {
    const { host, root, update } = mount('- [x] Write\n- [ ] Review');
    const inputs = () => [...root.querySelectorAll<HTMLInputElement>("[data-part='task'] input")];
    expect(inputs().map((input) => input.getAttribute('aria-readonly'))).toEqual(['true', 'true']);

    host.editable.set(true);
    update();
    inputs()[1]?.click();
    update();
    expect(host.tasks).toHaveLength(1);
    expect(host.tasks[0]).toMatchObject({ checked: true, index: 1, offset: null });
    expect(inputs()[1]?.checked).toBe(false);
  });

  it('draws the projected empty content for a document with nothing in it', () => {
    const { root } = mount('   ');
    expect(root.hasAttribute('data-empty')).toBe(true);
    expect(root.querySelector("[data-part='empty']")?.textContent?.trim()).toBe(
      'Nothing written yet.',
    );
  });

  it('draws the error part, and a retry only when the template enables it', () => {
    const { host, root, update } = mount();
    host.status.set('error');
    update();
    expect(root.querySelector("[data-part='error']")?.textContent).toContain(
      'The document could not be loaded.',
    );
    expect(root.querySelector('button')).toBeNull();

    host.retryable.set(true);
    update();
    root.querySelector('button')?.dispatchEvent(new MouseEvent('click', { detail: 1 }));
    expect(host.retries).toEqual(['pointer']);
  });

  it('paints the placeholder only after skeleton’s delay', () => {
    vi.useFakeTimers();
    try {
      const { host, root, update } = mount(undefined, [
        provideSkeletonDefaults({ delay: 200, minDuration: 0 }),
      ]);
      host.tree.set(null);
      host.loading.set(true);
      update();
      expect(root.hasAttribute('data-loading')).toBe(false);
      vi.advanceTimersByTime(250);
      update();
      expect(root.hasAttribute('data-loading')).toBe(true);
      expect(root.getAttribute('aria-busy')).toBe('true');
      expect(root.querySelector("[data-ui='skeleton'][data-part='text']")).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the blocks it drew when streamed content is appended', () => {
    const { host, root, update } = mount('One.\n\nTwo');
    host.streaming.set(true);
    update();
    const first = root.querySelector('p');
    host.tree.set(md('One.\n\nTwo and three.\n\nFour'));
    update();
    expect(root.querySelector('p')).toBe(first);
    expect(root.getAttribute('aria-busy')).toBe('true');
  });

  it('numbers footnotes and links each reference both ways', () => {
    const { host, root, update } = mount();
    host.tree.set({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Claim' },
            { type: 'footnoteReference', identifier: 'a' },
          ],
        },
        {
          type: 'footnoteDefinition',
          identifier: 'a',
          children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Source' }] }],
        },
      ],
    });
    update();
    const reference = root.querySelector('[data-footnote-ref]');
    expect(reference?.getAttribute('href')).toBe('#fn-a');
    expect(root.querySelector('#footnote-label')?.textContent?.trim()).toBe('Footnotes');
    const back = root.querySelector("[data-part='backref']");
    expect(back?.getAttribute('href')).toBe('#fnref-a');
    expect(back?.closest('p')?.textContent).toContain('Source');
    /* The arrow is the Glyph element, hidden, and the link keeps its own name. */
    expect(
      back
        ?.querySelector('[data-ui="icon"][aria-hidden="true"] > svg[data-glyph]')
        ?.getAttribute('data-glyph'),
    ).toBe('arrow-left');
  });
});
