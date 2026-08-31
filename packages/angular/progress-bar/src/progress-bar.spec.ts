import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { SlProgressBar } from './progress-bar';

@Component({
  imports: [SlProgressBar],
  template: `
    <div
      slProgressBar
      id="bar"
      aria-label="Upload"
      [max]="max()"
      [value]="value()"
      [valueText]="valueText()"
    ></div>
  `,
})
class Host {
  readonly max = signal(100);
  readonly value = signal<number | null>(40);
  readonly valueText = signal('');
}

@Component({
  imports: [SlProgressBar],
  template: `<div slProgressBar [value]="40"></div>`,
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

describe('SlProgressBar', () => {
  it('reports its position against the maximum', () => {
    const { bar } = mount();

    expect(bar().getAttribute('role')).toBe('progressbar');
    expect(bar().getAttribute('aria-valuenow')).toBe('40');
    expect(bar().getAttribute('aria-valuemin')).toBe('0');
    expect(bar().getAttribute('aria-valuemax')).toBe('100');
  });

  it('measures against the maximum it was given', () => {
    const { bar, fixture, indicator } = mount();

    fixture.componentInstance.max.set(7);
    fixture.componentInstance.value.set(3);
    fixture.detectChanges();

    expect(bar().getAttribute('aria-valuemax')).toBe('7');
    expect(indicator().style.inlineSize).toBe('42.8571%');
  });

  it('says nothing about a position it does not know', () => {
    const { bar, fixture } = mount();

    fixture.componentInstance.value.set(null);
    fixture.detectChanges();

    expect(bar().hasAttribute('aria-valuenow')).toBe(false);
    expect(bar().getAttribute('data-indeterminate')).toBe('');
  });

  it('holds the indicator inside the track when the value overshoots', () => {
    const { bar, fixture, indicator } = mount();

    fixture.componentInstance.value.set(140);
    fixture.detectChanges();

    expect(bar().getAttribute('aria-valuenow')).toBe('100');
    expect(indicator().style.inlineSize).toBe('100%');
  });

  it('treats a negative value as no progress rather than as a reversed bar', () => {
    const { bar, fixture } = mount();

    fixture.componentInstance.value.set(-20);
    fixture.detectChanges();

    expect(bar().getAttribute('aria-valuenow')).toBe('0');
  });

  it('reports words when a percentage would say less', () => {
    const { bar, fixture } = mount();

    fixture.componentInstance.valueText.set('3 of 7 files');
    fixture.detectChanges();

    expect(bar().getAttribute('aria-valuetext')).toBe('3 of 7 files');
  });

  it('stays quiet when the consumer named it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mount();

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns in development when nothing names it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    TestBed.createComponent(NamelessHost).detectChanges();

    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
