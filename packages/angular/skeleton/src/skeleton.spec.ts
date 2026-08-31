import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlSkeleton } from './skeleton';
import type { SkeletonShape } from './skeleton';

@Component({
  imports: [SlSkeleton],
  template: `
    <span slSkeleton id="plain" [shape]="shape()"></span>
    <span slSkeleton id="shown" aria-hidden="false"></span>
  `,
})
class Host {
  readonly shape = signal<SkeletonShape>('text');
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    plain: () => element.querySelector<HTMLElement>('#plain')!,
    shown: () => element.querySelector<HTMLElement>('#shown')!,
  };
}

describe('SlSkeleton', () => {
  it('stays out of the accessibility tree, because it stands for nothing yet', () => {
    const { plain } = mount();

    expect(plain().getAttribute('aria-hidden')).toBe('true');
  });

  it('lets the consumer put it back in, for a placeholder that is the whole message', () => {
    const { shown } = mount();

    expect(shown().getAttribute('aria-hidden')).toBe('false');
  });

  it('takes the shape of a line of text unless told otherwise', () => {
    const { plain } = mount();

    expect(plain().getAttribute('data-shape')).toBe('text');
  });

  it('states every shape it was given to the stylesheet', () => {
    const { fixture, plain } = mount();

    fixture.componentInstance.shape.set('circle');
    fixture.detectChanges();

    expect(plain().getAttribute('data-shape')).toBe('circle');
  });

  it('carries the class the stylesheet paints', () => {
    const { plain } = mount();

    expect(plain().classList.contains('slotted-skeleton')).toBe(true);
  });
});
