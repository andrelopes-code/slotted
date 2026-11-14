import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlBarCompare } from './bar-compare';
import { SlPositionStrip } from './position-strip';

const VALUES = [1000, -500, 2000, 0, 1500, 500, 2500, 1000];

@Component({
  imports: [SlPositionStrip, SlBarCompare],
  template: `<span
      slPositionStrip
      label="Savings rate"
      [value]="800"
      [values]="values"
      [reference]="1200"
      [hideValue]="hidden()"
    ></span>
    <span slBarCompare [min]="-1600" [max]="800" [step]="800" [data]="pair"></span>
    <span slBarCompare [min]="-1600" [max]="800" [step]="800" [data]="single"></span>`,
})
class Host {
  readonly values = VALUES;
  readonly hidden = signal(false);
  readonly pair = [
    { label: 'Subject', value: -1000 },
    { label: 'Reference', texture: true, value: 33 },
  ];
  readonly single = [{ label: 'Benchmark', value: 400 }];
}

function mount() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const [strip, first, second] = [
    ...fixture.nativeElement.querySelectorAll('[data-ui="sparkline"]'),
  ] as HTMLElement[];

  return { fixture, strip: strip!, first: first!, second: second! };
}

const at = (element: Element | null) =>
  Number((element as HTMLElement | null)?.style.getPropertyValue('--slotted-sparkline-at'));

describe('SlPositionStrip', () => {
  it('places the value dot at its share of the extent, with the zero tick and the ends', () => {
    const { strip } = mount();

    expect(strip.getAttribute('role')).toBe('img');
    expect(at(strip.querySelector('[data-part="value"]'))).toBeCloseTo(1300 / 3000);
    expect(at(strip.querySelector('[data-part="zero"]'))).toBeCloseTo(500 / 3000);
    expect(strip.querySelector('[data-part="start"]')?.textContent).toBe('-500');
    expect(strip.querySelector('[data-part="end"]')?.textContent).toBe('2,500');
    expect(strip.getAttribute('aria-label')).toBe(
      'Savings rate: 800, against a range of -500 to 2,500, reference 1,200',
    );
  });

  it('draws no value dot while the value is hidden, and says so', () => {
    const { fixture, strip } = mount();

    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();

    expect(strip.querySelector('[data-part="value"]')).toBeNull();
    expect(strip.getAttribute('aria-label')).toBe(
      'Savings rate: value pending, against a range of -500 to 2,500, reference 1,200',
    );
  });
});

describe('SlBarCompare', () => {
  it('shares tick positions across hosts, hangs a negative bar left of zero and names every row', () => {
    const { first, second } = mount();
    const ticks = (root: Element) =>
      [...root.querySelectorAll('[data-part="row"]:first-child [data-part="tick"]')].map(at);
    const negative = first.querySelector('[data-part="row"][data-negative]')!;
    const bar = negative.querySelector('[data-part="bar"]') as HTMLElement;

    expect(ticks(first)).toEqual(ticks(second));
    expect(ticks(first)).toHaveLength(4);
    expect(Number(bar.style.getPropertyValue('--slotted-sparkline-to'))).toBeCloseTo(
      at(negative.querySelector('[data-part="zero"]')),
    );
    expect(first.getAttribute('aria-label')).toBe('Subject: -1,000; Reference: 33');
    expect(second.getAttribute('aria-label')).toBe('Benchmark: 400');
  });
});
