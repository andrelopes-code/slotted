import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { resolveAspectRatio, SlAspectRatio } from './aspect-ratio';
import type { AspectRatioValue } from './aspect-ratio';

@Component({
  imports: [SlAspectRatio],
  template: `
    <div slAspectRatio id="named" [ratio]="ratio()">
      <iframe title="player"></iframe>
    </div>
    <figure slAspectRatio id="figure" ratio="square" aria-label="Map"></figure>
  `,
})
class Host {
  readonly ratio = signal<AspectRatioValue>('video');
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const query = <T extends HTMLElement>(selector: string) =>
    fixture.nativeElement.querySelector(selector) as T;
  return { fixture, host: fixture.componentInstance, query };
}

describe('SlAspectRatio', () => {
  it('names the family and its one part so the stylesheet and the consumer can select it', () => {
    const { query } = mount();
    const frame = query('#named');

    expect(frame.getAttribute('data-ui')).toBe('aspect-ratio');
    expect(frame.getAttribute('data-part')).toBe('root');
    expect(frame.getAttribute('data-ratio')).toBe('video');
    expect(frame.style.getPropertyValue('--slotted-aspect-ratio')).toBe('');
    expect(frame.querySelector('iframe')).not.toBeNull();
  });

  /** A pair is written as it was given; a number as its quotient. */
  it('writes a number the consumer stated on the instance, and says so in the DOM', () => {
    const { fixture, host, query } = mount();

    host.ratio.set([21, 9]);
    fixture.detectChanges();

    expect(query('#named').getAttribute('data-ratio')).toBe('custom');
    expect(query('#named').style.getPropertyValue('--slotted-aspect-ratio')).toBe('21 / 9');

    host.ratio.set(1.85);
    fixture.detectChanges();

    expect(query('#named').style.getPropertyValue('--slotted-aspect-ratio')).toBe('1.85');

    host.ratio.set('portrait');
    fixture.detectChanges();

    expect(query('#named').getAttribute('data-ratio')).toBe('portrait');
    expect(query('#named').style.getPropertyValue('--slotted-aspect-ratio')).toBe('');
  });

  it('is written on the element the consumer chose', () => {
    const { query } = mount();

    expect(query('#figure').tagName).toBe('FIGURE');
    expect(query('#figure').getAttribute('aria-label')).toBe('Map');
    expect(query('#figure').getAttribute('data-ratio')).toBe('square');
  });

  it('resolves every name to itself and everything else to custom', () => {
    expect(resolveAspectRatio('landscape')).toEqual({ attribute: 'landscape', token: null });
    expect(resolveAspectRatio([4, 3])).toEqual({ attribute: 'custom', token: '4 / 3' });
    expect(resolveAspectRatio(0.5)).toEqual({ attribute: 'custom', token: '0.5' });
  });
});
