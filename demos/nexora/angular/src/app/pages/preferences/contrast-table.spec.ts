import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { ContrastReading } from '../../core/theming/contrast-reading';
import { ContrastTable } from './contrast-table';

describe('ContrastTable', () => {
  /**
   * The standard recipe holds every seed a reader can choose above its floor,
   * so a failing pair is written here by hand: the table has to say so, in the
   * danger tone, and keep the passing cells beside it as they are.
   */
  it('marks a pair below its floor apart from the pairs that meet it', () => {
    const readings: ContrastReading[] = [
      {
        scheme: 'light',
        pairs: [{ id: 'on-solid', label: 'Text on solid', ratio: 3.21, floor: 4.5, passes: false }],
      },
      {
        scheme: 'dark',
        pairs: [{ id: 'on-solid', label: 'Text on solid', ratio: 5.6, floor: 4.5, passes: true }],
      },
      {
        scheme: 'high-contrast',
        pairs: [{ id: 'on-solid', label: 'Text on solid', ratio: 7.25, floor: 7, passes: true }],
      },
    ];
    const fixture = TestBed.createComponent(ContrastTable);
    fixture.componentRef.setInput('readings', readings);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const cell = (scheme: string) =>
      root.querySelector<HTMLElement>(`td[data-pair="on-solid"][data-scheme="${scheme}"]`)!;
    const badge = (scheme: string) => cell(scheme).querySelector('[data-ui=badge]')!;

    expect(cell('light').querySelector('[data-ratio]')!.textContent).toBe('3.21:1');
    expect(badge('light').textContent?.trim()).toBe('Below 4.5:1');
    expect(badge('light').getAttribute('data-tone')).toBe('danger');
    expect(badge('dark').textContent?.trim()).toBe('Meets 4.5:1');
    expect(badge('dark').getAttribute('data-tone')).toBe('success');
    expect(badge('high-contrast').textContent?.trim()).toBe('Meets 7:1');
    /* A reading table is striped, so a theme's stripe shows on the page that chooses the theme. */
    expect(root.querySelector('[data-contrast]')!.hasAttribute('data-striped')).toBe(true);
  });
});
