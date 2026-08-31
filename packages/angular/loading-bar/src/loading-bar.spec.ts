import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { SlLoadingBar } from './loading-bar';
import type { LoadingBarPlacement } from './loading-bar';

@Component({
  imports: [SlLoadingBar],
  template: `
    <div
      slLoadingBar
      id="bar"
      aria-label="Loading page"
      [max]="max()"
      [placement]="placement()"
      [value]="value()"
      [valueText]="valueText()"
    ></div>
  `,
})
class Host {
  readonly max = signal(100);
  readonly placement = signal<LoadingBarPlacement>('inline');
  readonly value = signal<number | null>(40);
  readonly valueText = signal('');
}

@Component({
  imports: [SlLoadingBar],
  template: `<div slLoadingBar></div>`,
})
class NamelessHost {}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    bar: () => element.querySelector<HTMLElement>('#bar')!,
    fixture,
    indicator: () => element.querySelector<HTMLElement>('[data-part="indicator"]')!,
  };
}

describe('SlLoadingBar', () => {
  it('reports its position the way a progress bar does', () => {
    const { bar } = mount();

    expect(bar().getAttribute('role')).toBe('progressbar');
    expect(bar().getAttribute('aria-valuenow')).toBe('40');
    expect(bar().getAttribute('aria-valuemax')).toBe('100');
  });

  it('is indeterminate with no value, which is the usual case for a page', () => {
    const { bar, fixture } = mount();

    fixture.componentInstance.value.set(null);
    fixture.detectChanges();

    expect(bar().hasAttribute('aria-valuenow')).toBe(false);
    expect(bar().getAttribute('data-indeterminate')).toBe('');
  });

  it('sits in the flow unless it is told to take the viewport', () => {
    const { bar, fixture } = mount();

    expect(bar().getAttribute('data-placement')).toBe('inline');

    fixture.componentInstance.placement.set('fixed');
    fixture.detectChanges();

    expect(bar().getAttribute('data-placement')).toBe('fixed');
  });

  it('holds the indicator inside the track when the value overshoots', () => {
    const { bar, fixture, indicator } = mount();

    fixture.componentInstance.value.set(140);
    fixture.detectChanges();

    expect(bar().getAttribute('aria-valuenow')).toBe('100');
    expect(indicator().style.inlineSize).toBe('100%');
  });

  it('reports words when a percentage would say less', () => {
    const { bar, fixture } = mount();

    fixture.componentInstance.valueText.set('Step 1 of 4');
    fixture.detectChanges();

    expect(bar().getAttribute('aria-valuetext')).toBe('Step 1 of 4');
  });

  it('warns in development when nothing names it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    TestBed.createComponent(NamelessHost).detectChanges();

    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
