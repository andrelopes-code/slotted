import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { describe, expect, it } from 'vitest';

import { SlMeter } from './meter';
import { provideMeterDefaults } from './meter-defaults';

@Component({
  imports: [SlMeter],
  template: `<div
    slMeter
    aria-label="Share"
    [value]="value()"
    [max]="max()"
    [low]="low()"
    [high]="high()"
    [optimum]="optimum()"
    [decorative]="decorative()"
  ></div>`,
})
class Host {
  readonly value = signal(41);
  readonly max = signal(100);
  readonly low = signal<number | undefined>(undefined);
  readonly high = signal<number | undefined>(undefined);
  readonly optimum = signal<number | undefined>(undefined);
  readonly decorative = signal(false);
}

function mount(providers: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [Host], providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector('[data-ui="meter"]') as HTMLElement;

  return { fixture, host: fixture.componentInstance, root };
}

describe('SlMeter', () => {
  it('is a meter with its value and range, and never a progressbar', () => {
    const { fixture, root } = mount();

    expect(root.getAttribute('role')).toBe('meter');
    expect(root.getAttribute('aria-valuenow')).toBe('41');
    expect(root.getAttribute('aria-valuemin')).toBe('0');
    expect(root.getAttribute('aria-valuemax')).toBe('100');
    expect(root.getAttribute('aria-valuetext')).toBe('41%');
    expect(root.style.getPropertyValue('--slotted-meter-ratio')).toBe('0.41');
    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).toBeNull();
  });

  it('carries no role and is hidden under decorative', () => {
    const { fixture, host, root } = mount();

    host.decorative.set(true);
    fixture.detectChanges();

    expect(root.hasAttribute('role')).toBe(false);
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.hasAttribute('aria-valuenow')).toBe(false);
  });

  it('takes its tone from the region the value falls in', () => {
    const { fixture, host, root } = mount();

    host.value.set(95);
    host.low.set(60);
    host.high.set(85);
    host.optimum.set(0);
    fixture.detectChanges();

    expect(root.getAttribute('data-tone')).toBe('danger');
  });

  it('writes the share in the language in force and with the application’s defaults', () => {
    const { fixture, host, root } = mount([
      provideSlotted({ locale: 'pt-BR' }),
      provideMeterDefaults({ size: 'sm' }),
    ]);

    host.value.set(4380);
    host.max.set(10000);
    fixture.detectChanges();

    expect(root.getAttribute('aria-valuetext')).toBe('43,8%');
    expect(root.getAttribute('data-size')).toBe('sm');
  });
});
