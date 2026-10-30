import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlInline } from './inline';
import type { InlineAlign, InlineGap } from './inline';

@Component({
  imports: [SlInline],
  template: `
    <div slInline id="plain">Draft</div>
    <div slInline id="decided" [gap]="gap()" [align]="align()" justify="end" wrap="nowrap">
      Draft
    </div>
    <ul slInline id="list" aria-label="Statuses" lang="pt-BR">
      <li>Draft</li>
    </ul>
  `,
})
class InlineHost {
  readonly align = signal<InlineAlign | undefined>(undefined);
  readonly gap = signal<InlineGap | undefined>(undefined);
}

function mount() {
  const fixture = TestBed.createComponent(InlineHost);
  fixture.detectChanges();
  return {
    fixture,
    element: (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement,
  };
}

describe('SlInline', () => {
  it('carries the identifier a consumer selects the family by', () => {
    const { element } = mount();

    expect(element('plain').getAttribute('data-ui')).toBe('inline');
    expect(element('plain').getAttribute('data-part')).toBe('root');
  });

  it('writes no axis the consumer did not decide, because the base rule holds the defaults', () => {
    const { element } = mount();

    for (const axis of ['gap', 'align', 'justify', 'wrap']) {
      expect(element('plain').hasAttribute(`data-${axis}`)).toBe(false);
    }
  });

  it('states each axis the consumer decided', () => {
    const { element, fixture } = mount();
    const host = fixture.componentInstance;

    host.gap.set(2);
    host.align.set('baseline');
    fixture.detectChanges();

    expect(element('decided').getAttribute('data-gap')).toBe('2');
    expect(element('decided').getAttribute('data-align')).toBe('baseline');
    expect(element('decided').getAttribute('data-justify')).toBe('end');
    expect(element('decided').getAttribute('data-wrap')).toBe('nowrap');
  });

  it('treats no separation as a decision, not as an absent one', () => {
    const { element, fixture } = mount();

    fixture.componentInstance.gap.set(0);
    fixture.detectChanges();

    expect(element('decided').getAttribute('data-gap')).toBe('0');
  });

  it('leaves the element and its native attributes to the consumer', () => {
    const { element } = mount();

    expect(element('list').tagName).toBe('UL');
    expect(element('list').hasAttribute('role')).toBe(false);
    expect(element('list').getAttribute('aria-label')).toBe('Statuses');
    expect(element('list').getAttribute('lang')).toBe('pt-BR');
  });
});

@Component({
  imports: [SlInline],
  template: `<div slInline id="static" align="center">Draft</div>`,
})
class InlineStaticAlignHost {}

describe('SlInline with a static align', () => {
  /*
   * `align` is also an obsolete HTML attribute that browsers still honor on
   * a div — it centers the text inside. Written statically for the input, it
   * stayed on the element and every line of the content was centerd.
   */
  it('keeps the decision in data-align and leaves no align attribute on the element', () => {
    TestBed.configureTestingModule({ imports: [InlineStaticAlignHost] });
    const fixture = TestBed.createComponent(InlineStaticAlignHost);
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('#static') as HTMLElement;
    expect(element.getAttribute('data-align')).toBe('center');
    expect(element.hasAttribute('align')).toBe(false);
  });
});
