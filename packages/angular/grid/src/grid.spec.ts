import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlGrid } from './grid';
import type { GridColumns, GridGap } from './grid';

@Component({
  imports: [SlGrid],
  template: `
    <div slGrid id="plain">Revenue</div>
    <div
      slGrid
      id="decided"
      [gap]="gap()"
      [columns]="columns()"
      minItemWidth="lg"
      align="center"
      justify="end"
    >
      Revenue
    </div>
    <ul slGrid id="list" aria-label="Sections" lang="pt-BR">
      <li>Revenue</li>
    </ul>
  `,
})
class GridHost {
  readonly columns = signal<GridColumns | undefined>(undefined);
  readonly gap = signal<GridGap | undefined>(undefined);
}

function mount() {
  const fixture = TestBed.createComponent(GridHost);
  fixture.detectChanges();
  return {
    fixture,
    element: (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement,
  };
}

describe('SlGrid', () => {
  it('carries the identifier a consumer selects the family by', () => {
    const { element } = mount();

    expect(element('plain').getAttribute('data-ui')).toBe('grid');
    expect(element('plain').getAttribute('data-part')).toBe('root');
  });

  it('writes no axis the consumer did not decide', () => {
    const { element } = mount();

    for (const axis of ['gap', 'columns', 'min-item-width', 'align', 'justify']) {
      expect(element('plain').hasAttribute(`data-${axis}`)).toBe(false);
    }
  });

  it('states each axis the consumer decided', () => {
    const { element, fixture } = mount();
    const host = fixture.componentInstance;

    host.gap.set(2);
    host.columns.set(3);
    fixture.detectChanges();

    expect(element('decided').getAttribute('data-gap')).toBe('2');
    expect(element('decided').getAttribute('data-columns')).toBe('3');
    expect(element('decided').getAttribute('data-min-item-width')).toBe('lg');
    expect(element('decided').getAttribute('data-align')).toBe('center');
    expect(element('decided').getAttribute('data-justify')).toBe('end');
  });

  it('hands the count to the track function, which cannot read an attribute', () => {
    const { element, fixture } = mount();

    fixture.componentInstance.columns.set(4);
    fixture.detectChanges();

    expect(element('decided').style.getPropertyValue('--slotted-grid-columns')).toBe('4');
  });

  it('writes no count property when the grid fits as many tracks as it can', () => {
    const { element } = mount();

    expect(element('plain').style.getPropertyValue('--slotted-grid-columns')).toBe('');
  });

  it('leaves the element and its native attributes to the consumer, and adds no role', () => {
    const { element } = mount();

    expect(element('list').tagName).toBe('UL');
    expect(element('list').hasAttribute('role')).toBe(false);
    expect(element('list').getAttribute('aria-label')).toBe('Sections');
    expect(element('list').getAttribute('lang')).toBe('pt-BR');
  });
});

@Component({
  imports: [SlGrid],
  template: `<div slGrid id="static" align="center">Draft</div>`,
})
class GridStaticAlignHost {}

describe('SlGrid with a static align', () => {
  /*
   * `align` is also an obsolete HTML attribute that browsers still honour on
   * a div — it centres the text inside. Written statically for the input, it
   * stayed on the element and every line of the content was centred.
   */
  it('keeps the decision in data-align and leaves no align attribute on the element', () => {
    TestBed.configureTestingModule({ imports: [GridStaticAlignHost] });
    const fixture = TestBed.createComponent(GridStaticAlignHost);
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('#static') as HTMLElement;
    expect(element.getAttribute('data-align')).toBe('center');
    expect(element.hasAttribute('align')).toBe(false);
  });
});
