import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlStack } from './stack';
import type { StackAlign, StackGap } from './stack';

@Component({
  imports: [SlStack],
  template: `
    <div slStack id="plain">Workspace</div>
    <div slStack id="decided" [gap]="gap()" [align]="align()" justify="between">Workspace</div>
    <ul slStack id="list" aria-label="Sections" lang="pt-BR">
      <li>First</li>
    </ul>
  `,
})
class StackHost {
  readonly align = signal<StackAlign | undefined>(undefined);
  readonly gap = signal<StackGap | undefined>(undefined);
}

function mount() {
  const fixture = TestBed.createComponent(StackHost);
  fixture.detectChanges();
  return {
    fixture,
    element: (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement,
  };
}

describe('SlStack', () => {
  it('carries the identifier a consumer selects the family by', () => {
    const { element } = mount();

    expect(element('plain').getAttribute('data-ui')).toBe('stack');
    expect(element('plain').getAttribute('data-part')).toBe('root');
  });

  it('writes no axis the consumer did not decide', () => {
    const { element } = mount();

    for (const axis of ['gap', 'align', 'justify']) {
      expect(element('plain').hasAttribute(`data-${axis}`)).toBe(false);
    }
  });

  it('states each axis the consumer decided', () => {
    const { element, fixture } = mount();
    const host = fixture.componentInstance;

    host.gap.set(9);
    host.align.set('center');
    fixture.detectChanges();

    expect(element('decided').getAttribute('data-gap')).toBe('9');
    expect(element('decided').getAttribute('data-align')).toBe('center');
    expect(element('decided').getAttribute('data-justify')).toBe('between');
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
    expect(element('list').getAttribute('aria-label')).toBe('Sections');
    expect(element('list').getAttribute('lang')).toBe('pt-BR');
  });
});

@Component({
  imports: [SlStack],
  template: `<div slStack id="static" align="center">Draft</div>`,
})
class StackStaticAlignHost {}

describe('SlStack with a static align', () => {
  /*
   * `align` is also an obsolete HTML attribute that browsers still honor on
   * a div — it centers the text inside. Written statically for the input, it
   * stayed on the element and every line of the content was centerd.
   */
  it('keeps the decision in data-align and leaves no align attribute on the element', () => {
    TestBed.configureTestingModule({ imports: [StackStaticAlignHost] });
    const fixture = TestBed.createComponent(StackStaticAlignHost);
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('#static') as HTMLElement;
    expect(element.getAttribute('data-align')).toBe('center');
    expect(element.hasAttribute('align')).toBe(false);
  });
});
