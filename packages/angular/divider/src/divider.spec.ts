import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlDivider } from './divider';
import type { DividerAlign, DividerOrientation } from './divider';

@Component({
  imports: [SlDivider],
  template: `
    <hr
      slDivider
      id="plain"
      [decorative]="decorative()"
      [inset]="inset()"
      [orientation]="orientation()"
    />
    <hr slDivider id="kept-role" decorative role="presentation" />
    <div slDivider id="labelled" [align]="align()" [decorative]="decorative()" label="Or"></div>
    <ul>
      <li slDivider id="in-menu"></li>
    </ul>
    <hr slDivider id="named" aria-label="End of the invoice" />
  `,
})
class Host {
  readonly align = signal<DividerAlign>('center');
  readonly decorative = signal(false);
  readonly inset = signal(false);
  readonly orientation = signal<DividerOrientation>('horizontal');
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const byId = (id: string) => element.querySelector<HTMLElement>(`#${id}`)!;
  return {
    fixture,
    inMenu: () => byId('in-menu'),
    keptRole: () => byId('kept-role'),
    labelled: () => byId('labelled'),
    named: () => byId('named'),
    plain: () => byId('plain'),
  };
}

describe('SlDivider', () => {
  it('is a separator by default, without being told to be one', () => {
    const { plain } = mount();

    expect(plain().tagName).toBe('HR');
    expect(plain().hasAttribute('role')).toBe(false);
  });

  it('is selected by the identifier the contract declares, not by a class', () => {
    const { plain } = mount();

    expect(plain().getAttribute('data-ui')).toBe('divider');
    expect(plain().getAttribute('data-part')).toBe('root');
    expect(plain().classList.length).toBe(0);
  });

  it('leaves the accessibility tree when it is decorative', () => {
    const { fixture, plain } = mount();

    fixture.componentInstance.decorative.set(true);
    fixture.detectChanges();

    expect(plain().getAttribute('role')).toBe('none');
  });

  it('announces a vertical separator as vertical', () => {
    const { fixture, plain } = mount();

    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();

    expect(plain().getAttribute('aria-orientation')).toBe('vertical');
    expect(plain().getAttribute('data-orientation')).toBe('vertical');
  });

  it('leaves aria-orientation off a horizontal separator, which is the default', () => {
    const { plain } = mount();

    expect(plain().hasAttribute('aria-orientation')).toBe(false);
    expect(plain().getAttribute('data-orientation')).toBe('horizontal');
  });

  it('says nothing about orientation once it is out of the tree', () => {
    const { fixture, plain } = mount();

    fixture.componentInstance.decorative.set(true);
    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();

    expect(plain().hasAttribute('aria-orientation')).toBe(false);
  });

  it('stops short of both ends when it is inset', () => {
    const { fixture, plain } = mount();

    expect(plain().hasAttribute('data-inset')).toBe(false);

    fixture.componentInstance.inset.set(true);
    fixture.detectChanges();

    expect(plain().getAttribute('data-inset')).toBe('');
  });

  it('keeps the role the consumer set rather than replacing it', () => {
    const { keptRole } = mount();

    expect(keptRole().getAttribute('role')).toBe('presentation');
  });

  it('keeps the name the consumer wrote on the element', () => {
    const { named } = mount();

    expect(named().getAttribute('aria-label')).toBe('End of the invoice');
  });

  it('writes the separator role when the element is not an hr', () => {
    const { inMenu } = mount();

    expect(inMenu().tagName).toBe('LI');
    expect(inMenu().getAttribute('role')).toBe('separator');
  });

  describe('with a label', () => {
    /**
     * The separator role makes its children presentational, so the visible
     * label never reaches the accessibility tree. Without a name the rule is
     * announced as an empty separator, which is why the name is written.
     */
    it('is announced by the name, and shows the same string', () => {
      const { labelled } = mount();

      expect(labelled().getAttribute('role')).toBe('separator');
      expect(labelled().getAttribute('aria-label')).toBe('Or');
      expect(labelled().querySelector('[data-part="label"]')?.textContent?.trim()).toBe('Or');
      expect(labelled().getAttribute('data-labelled')).toBe('');
    });

    it('carries no name once it is decoration, because role="none" prohibits one', () => {
      const { fixture, labelled } = mount();

      fixture.componentInstance.decorative.set(true);
      fixture.detectChanges();

      expect(labelled().getAttribute('role')).toBe('none');
      expect(labelled().hasAttribute('aria-label')).toBe(false);
      expect(labelled().querySelector('[data-part="label"]')?.textContent?.trim()).toBe('Or');
    });

    it('places the label in the middle until it is asked for an end', () => {
      const { fixture, labelled } = mount();

      expect(labelled().getAttribute('data-align')).toBe('center');

      fixture.componentInstance.align.set('start');
      fixture.detectChanges();

      expect(labelled().getAttribute('data-align')).toBe('start');
    });

    it('states no alignment when there is nothing to align', () => {
      const { plain } = mount();

      expect(plain().hasAttribute('data-align')).toBe(false);
      expect(plain().querySelector('[data-part="label"]')).toBeNull();
    });
  });
});
