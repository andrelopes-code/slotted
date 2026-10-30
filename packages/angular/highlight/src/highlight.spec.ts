import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { provideHighlightDefaults } from './highlight-defaults';
import { SlHighlight } from './highlight';

@Component({
  standalone: true,
  imports: [SlHighlight],
  template: `<span slHighlight text=""></span>`,
})
class Host {
  matcher = () => [[0, 1]] as const;
  ranges = [[4, 40]] as const;
  queries = ['an', 'resume'];
}

/** Several renders in one test: each starts from a fresh module. */
function renderTemplate(template: string, providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.overrideComponent(Host, { set: { template } });
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

/**
 * The rendered DOM with Angular's control-flow anchors removed: `@for` and
 * `@if` leave comment nodes, which are how the markup was produced, not the
 * markup.
 */
const shape = (root: Element) =>
  [...root.childNodes]
    .filter((node) => node.nodeType !== node.COMMENT_NODE)
    .map((node) =>
      node.nodeType === node.ELEMENT_NODE
        ? `<${(node as Element).tagName.toLowerCase()}${(node as Element).hasAttribute('data-current') ? ' current' : ''}>${node.textContent}`
        : node.textContent,
    );

const marks = (root: Element) =>
  [...root.querySelectorAll('[data-part="match"]')].map((node) => node.textContent);

const root = (fixture: { nativeElement: HTMLElement }) =>
  fixture.nativeElement.querySelector('[data-ui="highlight"]') as HTMLElement;

describe('SlHighlight', () => {
  it('is selected in public by the family identifier, and its marks by the part', () => {
    const fixture = renderTemplate(`<span slHighlight text="Blueberry" query="berr"></span>`);
    const element = root(fixture);

    expect(element.tagName).toBe('SPAN');
    expect(element.getAttribute('data-part')).toBe('root');
    expect(element.textContent).toBe('Blueberry');
    expect(shape(element)).toEqual(['Blue', '<mark>berr', 'y']);
    expect(element.querySelector('mark')?.getAttribute('data-part')).toBe('match');
    expect(element.querySelector('mark')?.hasAttribute('data-ui')).toBe(false);
  });

  it('renders the text alone for an empty query, and never parses it', () => {
    const fixture = renderTemplate(
      `<span slHighlight text="a <b>bold</b> claim" query="  "></span>`,
    );
    const element = root(fixture);
    expect(shape(element)).toEqual(['a <b>bold</b> claim']);
    expect(element.querySelector('b')).toBeNull();
  });

  it('marks every occurrence by default, in the reader’s locale, and the first on request', () => {
    expect(
      marks(root(renderTemplate(`<span slHighlight text="Ana Banana" query="an"></span>`))),
    ).toEqual(['An', 'anan']);
    expect(
      marks(
        root(
          renderTemplate(
            `<span slHighlight text="Ana Banana" query="an" occurrences="first"></span>`,
          ),
        ),
      ),
    ).toEqual(['An']);
    expect(
      marks(root(renderTemplate(`<span slHighlight text="Resumé" query="resume"></span>`))),
    ).toEqual(['Resumé']);
  });

  it('takes ranges over a matcher over the default', () => {
    expect(
      marks(
        root(
          renderTemplate(
            `<span slHighlight text="Blueberry" query="berry" [matcher]="matcher"></span>`,
          ),
        ),
      ),
    ).toEqual(['B']);
    expect(
      marks(
        root(
          renderTemplate(
            `<span slHighlight text="Blueberry" query="berry" [matcher]="matcher" [ranges]="ranges"></span>`,
          ),
        ),
      ),
    ).toEqual(['berry']);
  });

  it('puts data-current on the match at the stated index, counting matches only', () => {
    const fixture = renderTemplate(
      `<span slHighlight text="one two one two one" query="one" [current]="1"></span>`,
    );
    expect(shape(root(fixture))).toEqual([
      '<mark>one',
      ' two ',
      '<mark current>one',
      ' two ',
      '<mark>one',
    ]);
    const out = renderTemplate(
      `<span slHighlight text="one two one two one" query="one" [current]="7"></span>`,
    );
    expect(root(out).querySelector('[data-current]')).toBeNull();
  });

  it('writes disabled on the root and nowhere else', () => {
    const element = root(
      renderTemplate(`<span slHighlight text="Blueberry" query="berr" disabled></span>`),
    );
    expect(element.getAttribute('data-disabled')).toBe('');
    expect(element.querySelector('mark')?.hasAttribute('data-disabled')).toBe(false);
  });

  it('reads its defaults from the provider, and lets the instance win', () => {
    const fixture = renderTemplate(
      `<span slHighlight id="inherited" text="Ana Banana Résumé" [query]="queries"></span>
       <span slHighlight id="own" text="Ana Banana Résumé" [query]="queries" occurrences="all" sensitivity="base"></span>`,
      [provideHighlightDefaults({ occurrences: 'first', sensitivity: 'accent' })],
    );
    expect(marks(fixture.nativeElement.querySelector('#inherited'))).toEqual(['An']);
    expect(marks(fixture.nativeElement.querySelector('#own'))).toEqual(['An', 'anan', 'Résumé']);
  });

  it('keeps the consumer’s own attributes on the element it was written on', () => {
    const element = root(
      renderTemplate(`<p slHighlight text="Blueberry" query="berr" lang="pt-BR" class="mine"></p>`),
    );
    expect(element.tagName).toBe('P');
    expect(element.getAttribute('lang')).toBe('pt-BR');
    expect(element.classList.contains('mine')).toBe(true);
    expect(element.getAttribute('data-ui')).toBe('highlight');
  });
});
