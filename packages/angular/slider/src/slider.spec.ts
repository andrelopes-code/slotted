import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';

import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';

import contract from '../../../../specs/components/slider/contract.json';
import { provideSliderDefaults } from './slider-defaults';
import { SlSlider } from './slider';

@Component({
  standalone: true,
  imports: [SlSlider],
  template: `<div
    slSlider
    [defaultValue]="start"
    [min]="min"
    [max]="max"
    [step]="step"
    [marks]="marks"
    [minStepsBetween]="gap"
    [thumbLabels]="labels"
    [readOnly]="readOnly"
    (valueChange)="requests.push($event)"
    (valueCommit)="commits.push($event)"
    aria-label="Volume"
  ></div>`,
})
class Host {
  start: number | number[] = 40;
  min = 0;
  max = 100;
  step = 1;
  gap = 0;
  readOnly: boolean | undefined = undefined;
  marks: (number | { value: number; label?: string })[] | undefined = undefined;
  labels: string[] | undefined = undefined;
  readonly requests: unknown[] = [];
  readonly commits: unknown[] = [];
}

function mount(patch: Partial<Host> = {}) {
  const fixture = TestBed.createComponent(Host);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  return fixture;
}

const thumbsOf = (fixture: { nativeElement: HTMLElement }) =>
  Array.from(fixture.nativeElement.querySelectorAll<HTMLInputElement>('[data-part="input"]'));

const rootOf = (fixture: { nativeElement: HTMLElement }) =>
  fixture.nativeElement.querySelector('[data-ui="slider"]') as HTMLElement;

const press = (thumb: HTMLInputElement, key: string, modifier: Partial<KeyboardEventInit> = {}) =>
  thumb.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...modifier }));

describe('SlSlider', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
  });

  it('is selected in public by the family identifier and its parts', () => {
    const fixture = mount();
    const root = rootOf(fixture);

    expect(root.getAttribute('data-ui')).toBe('slider');
    expect(root.getAttribute('data-part')).toBe('root');
    for (const part of ['output', 'control', 'track', 'indicator', 'thumb', 'input', 'bubble']) {
      expect(root.querySelector(`[data-part="${part}"]`)).not.toBeNull();
    }
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const root = rootOf(mount());

    expect(root.getAttribute('data-size')).toBe(contract.members.slider.defaults.size);
    expect(root.getAttribute('data-orientation')).toBe(
      contract.members.slider.defaults.orientation,
    );
    expect(root.getAttribute('data-value-label')).toBe(contract.members.slider.defaults.valueLabel);
  });

  it('holds the value in a native range input rather than in a role', () => {
    const [thumb] = thumbsOf(mount());

    expect(thumb?.type).toBe('range');
    expect(thumb?.hasAttribute('role')).toBe(false);
    expect(thumb?.value).toBe('40');
  });

  /** A percentage of a track is geometry, and geometry is written as a property. */
  it('positions the fill and the thumbs from private properties', () => {
    const fixture = mount({ start: [20, 80] });
    const root = rootOf(fixture);
    const indicator = root.querySelector('[data-part="indicator"]') as HTMLElement;
    const thumbs = Array.from(root.querySelectorAll<HTMLElement>('[data-part="thumb"]'));

    expect(indicator.style.getPropertyValue('--_start')).toBe('20');
    expect(indicator.style.getPropertyValue('--_end')).toBe('80');
    expect(thumbs[0]?.style.getPropertyValue('--_position')).toBe('20');
    expect(thumbs[1]?.style.getPropertyValue('--_position')).toBe('80');
  });

  /**
   * The APG's multi-thumb pattern requires the dependent sliders' announced
   * range to follow the neighbour's value.
   */
  it('moves each thumb’s own bounds to its neighbour', () => {
    const thumbs = thumbsOf(mount({ start: [20, 80], step: 5, gap: 2 }));

    expect(thumbs[0]?.max).toBe('70');
    expect(thumbs[1]?.min).toBe('30');
  });

  it('sorts a value set a consumer handed backwards', () => {
    const thumbs = thumbsOf(mount({ start: [80, 20] }));

    expect(thumbs.map((thumb) => thumb.value)).toEqual(['20', '80']);
  });

  describe('keyboard', () => {
    it('steps by one step on the arrows and by the large amount on Shift', () => {
      const fixture = mount();
      const [thumb] = thumbsOf(fixture);

      press(thumb as HTMLInputElement, 'ArrowRight');
      fixture.detectChanges();
      expect(thumbsOf(fixture)[0]?.value).toBe('41');

      press(thumbsOf(fixture)[0] as HTMLInputElement, 'ArrowUp', { shiftKey: true });
      fixture.detectChanges();
      expect(thumbsOf(fixture)[0]?.value).toBe('51');
    });

    it('moves by the large amount on the page keys', () => {
      const fixture = mount();

      press(thumbsOf(fixture)[0] as HTMLInputElement, 'PageDown');
      fixture.detectChanges();

      expect(thumbsOf(fixture)[0]?.value).toBe('30');
    });

    it('reaches this thumb’s bounds rather than the scale’s', () => {
      const fixture = mount({ start: [20, 80] });

      press(thumbsOf(fixture)[0] as HTMLInputElement, 'End');
      fixture.detectChanges();

      expect(thumbsOf(fixture)[0]?.value).toBe('80');
    });

    it('answers no key while the control is read-only', () => {
      const fixture = mount({ readOnly: true });

      press(thumbsOf(fixture)[0] as HTMLInputElement, 'ArrowRight');
      fixture.detectChanges();

      expect(thumbsOf(fixture)[0]?.value).toBe('40');
      expect(thumbsOf(fixture)[0]?.getAttribute('aria-readonly')).toBe('true');
      expect(thumbsOf(fixture)[0]?.hasAttribute('readonly')).toBe(false);
    });
  });

  describe('state', () => {
    it('carries the reason, the previous value and cancel()', () => {
      const fixture = mount();

      press(thumbsOf(fixture)[0] as HTMLInputElement, 'ArrowRight');
      fixture.detectChanges();

      const request = fixture.componentInstance.requests[0] as {
        value: number;
        previous: number;
        reason: string;
      };
      expect(request.value).toBe(41);
      expect(request.previous).toBe(40);
      expect(request.reason).toBe('keyboard');
    });

    it('commits once per key press, beside the change it carries', () => {
      const fixture = mount();

      press(thumbsOf(fixture)[0] as HTMLInputElement, 'ArrowRight');
      fixture.detectChanges();

      expect(fixture.componentInstance.commits).toEqual([41]);
    });

    it('hands an array back when it was given one', () => {
      const fixture = mount({ start: [20, 80] });

      press(thumbsOf(fixture)[0] as HTMLInputElement, 'ArrowRight');
      fixture.detectChanges();

      expect((fixture.componentInstance.requests[0] as { value: number[] }).value).toEqual([
        21, 80,
      ]);
    });
  });

  describe('marks', () => {
    it('draws a tick per mark and marks the two at the ends of the scale', () => {
      const fixture = mount({ marks: [0, 50, 100] });
      const marks = rootOf(fixture).querySelectorAll('[data-part="mark"]');

      expect(marks.length).toBe(3);
      expect(marks[0]?.getAttribute('data-edge')).toBe('start');
      expect(marks[2]?.getAttribute('data-edge')).toBe('end');
      expect(rootOf(fixture).getAttribute('data-marks')).toBe('ticks');
    });

    /** The APG names `aria-valuetext` for exactly this. */
    it('announces a mark’s label in place of the number at that value', () => {
      const fixture = mount({
        start: 50,
        marks: [
          { value: 0, label: 'Low' },
          { value: 50, label: 'Medium' },
        ],
      });

      expect(thumbsOf(fixture)[0]?.getAttribute('aria-valuetext')).toBe('Medium');
      expect(rootOf(fixture).getAttribute('data-marks')).toBe('labelled');
    });
  });

  it('lets an application decide once what its sliders look like', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideSliderDefaults({ size: 'lg', valueLabel: 'always' })],
    });

    const root = rootOf(mount());
    expect(root.getAttribute('data-size')).toBe('lg');
    expect(root.getAttribute('data-value-label')).toBe('always');
  });

  it('writes its value in the language in force, and follows a change of it', () => {
    const locale = signal('de-DE');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [Host], providers: [provideSlotted({ locale })] });

    const fixture = mount({ max: 2000, start: 1480 });
    expect(thumbsOf(fixture)[0]?.getAttribute('aria-valuetext')).toBe('1.480');

    locale.set('en-US');
    fixture.detectChanges();
    expect(thumbsOf(fixture)[0]?.getAttribute('aria-valuetext')).toBe('1,480');
  });
});

@Component({
  standalone: true,
  imports: [SlSlider, ReactiveFormsModule],
  template: `<div slSlider [formControl]="control" aria-label="Volume"></div>`,
})
class ReactiveHost {
  readonly control = new FormControl<number>(30, { nonNullable: true });
}

describe('SlSlider in a reactive form', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ReactiveHost] });
  });

  it('takes the control’s value and writes back to it', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();

    const thumb = fixture.nativeElement.querySelector('[data-part="input"]') as HTMLInputElement;
    expect(thumb.value).toBe('30');

    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.control.value).toBe(31);
  });

  it('answers a control the form disabled', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();

    fixture.componentInstance.control.disable();
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('[data-ui="slider"]') as HTMLElement;
    expect(root.getAttribute('data-disabled')).toBe('');
  });
});

@Component({
  standalone: true,
  imports: [SlSlider, SlField, SlFieldLabel],
  template: `<div slField [size]="'sm'" [invalid]="true" [disabled]="true">
    <label slFieldLabel>Volume</label>
    <div slSlider [defaultValue]="40"></div>
  </div>`,
})
class FieldHost {}

describe('SlSlider inside a field', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FieldHost] });
  });

  it('takes the identifier, the size and the shared states with nothing written', () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('[data-ui="slider"]') as HTMLElement;
    const thumb = fixture.nativeElement.querySelector('[data-part="input"]') as HTMLInputElement;

    expect(root.getAttribute('data-size')).toBe('sm');
    expect(root.getAttribute('data-invalid')).toBe('');
    expect(root.getAttribute('data-disabled')).toBe('');
    expect(thumb.hasAttribute('disabled')).toBe(true);
    expect(thumb.id.length).toBeGreaterThan(0);
  });
});

/** Nothing here should have to be told the value moved twice. */
describe('SlSlider under a controlled value', () => {
  it('asks rather than moves when the consumer owns the value', () => {
    @Component({
      standalone: true,
      imports: [SlSlider],
      template: `<div slSlider [value]="held()" (valueChange)="seen.push($event)"></div>`,
    })
    class ControlledHost {
      readonly held = signal(40);
      readonly seen: unknown[] = [];
    }

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ControlledHost] });
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();

    const thumb = fixture.nativeElement.querySelector('[data-part="input"]') as HTMLInputElement;
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.seen.length).toBe(1);
    expect(
      (fixture.nativeElement.querySelector('[data-part="input"]') as HTMLInputElement).value,
    ).toBe('40');
  });
});
