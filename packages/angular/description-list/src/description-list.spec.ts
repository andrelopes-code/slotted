import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlDescriptionDetails } from './description-details';
import { SlDescriptionList } from './description-list';
import type { DescriptionListOrientation } from './description-list';
import { SlDescriptionTerm } from './description-term';

@Component({
  imports: [SlDescriptionDetails, SlDescriptionList, SlDescriptionTerm],
  template: `
    <dl slDescriptionList id="list" [orientation]="orientation()">
      <dt slDescriptionTerm>Maintainers</dt>
      <dd slDescriptionDetails>Ada Lovelace</dd>
      <dd slDescriptionDetails>Grace Hopper</dd>
    </dl>
  `,
})
class Host {
  readonly orientation = signal<DescriptionListOrientation>('vertical');
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    details: () => [...element.querySelectorAll<HTMLElement>('[data-part="details"]')],
    fixture,
    list: () => element.querySelector<HTMLElement>('#list')!,
    term: () => element.querySelector<HTMLElement>('[data-part="term"]')!,
  };
}

describe('SlDescriptionList', () => {
  it('uses the native list elements, which carry the pairing themselves', () => {
    const { details, list, term } = mount();

    expect(list().tagName).toBe('DL');
    expect(term().tagName).toBe('DT');
    expect(details()[0]?.tagName).toBe('DD');
  });

  it('stacks the pair unless told to lay it out in columns', () => {
    const { fixture, list } = mount();

    expect(list().getAttribute('data-orientation')).toBe('vertical');

    fixture.componentInstance.orientation.set('horizontal');
    fixture.detectChanges();

    expect(list().getAttribute('data-orientation')).toBe('horizontal');
  });

  it('adds no role, because dl, dt and dd already say what they are', () => {
    const { details, list, term } = mount();

    for (const element of [list(), term(), details()[0]!]) {
      expect(element.hasAttribute('role')).toBe(false);
    }
  });

  it('carries the class the stylesheet paints', () => {
    const { list } = mount();

    expect(list().classList.contains('slotted-description-list')).toBe(true);
  });

  it('keeps several details under one term', () => {
    const { details } = mount();

    expect(details()).toHaveLength(2);
  });
});
