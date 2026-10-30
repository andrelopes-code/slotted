import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlToolbar } from '@slotted/angular/toolbar';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/toggle/contract.json';
import { SlToggle, SlToggleIcon } from './toggle';
import { provideToggleDefaults } from './toggle-defaults';

@Component({
  standalone: true,
  imports: [SlToggle, SlToggleIcon, SlToolbar],
  template: `<button slToggle>Wrap</button>`,
})
class Host {
  pressed = false;
  readonly requests: { value: boolean; previous: boolean; reason: string }[] = [];
  cancel = false;

  record(request: { value: boolean; previous: boolean; reason: string; cancel: () => void }) {
    this.requests.push({
      value: request.value,
      previous: request.previous,
      reason: request.reason,
    });
    if (this.cancel) request.cancel();
  }

  follow(request: { value: boolean }) {
    this.pressed = request.value;
  }
}

function renderTemplate(template: string, providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  TestBed.overrideComponent(Host, { set: { template } });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

type Fixture = ReturnType<typeof renderTemplate>;

const control = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-ui="toggle"]') as HTMLButtonElement;

function click(element: HTMLElement, detail = 1) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
}

describe('SlToggle', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(
      `<button slToggle class="wrap"><svg slToggleIcon></svg>Wrap</button>`,
    );

    expect(control(fixture).tagName).toBe('BUTTON');
    expect(control(fixture).getAttribute('data-ui')).toBe(contract.ui);
    expect(control(fixture).getAttribute('data-part')).toBe('root');
    expect(control(fixture).classList.contains('wrap')).toBe(true);
    expect(control(fixture).getAttribute('type')).toBe('button');
    expect(control(fixture).querySelector('[data-part="icon"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(control(fixture).querySelector('[data-part="label"]')?.textContent).toBe('Wrap');
  });

  it('announces itself as a toggle in both states and keeps its label', () => {
    const fixture = renderTemplate(`<button slToggle>Wrap</button>`);

    expect(control(fixture).getAttribute('aria-pressed')).toBe('false');
    expect(control(fixture).hasAttribute('data-pressed')).toBe(false);
    click(control(fixture));
    fixture.detectChanges();
    expect(control(fixture).getAttribute('aria-pressed')).toBe('true');
    expect(control(fixture).hasAttribute('data-pressed')).toBe(true);
    expect(control(fixture).textContent?.trim()).toBe('Wrap');
  });

  it('starts from defaultPressed and moves on its own when uncontrolled', () => {
    const fixture = renderTemplate(
      `<button slToggle defaultPressed (pressedChange)="record($event)">Wrap</button>`,
    );

    expect(control(fixture).getAttribute('aria-pressed')).toBe('true');
    click(control(fixture));
    fixture.detectChanges();
    expect(control(fixture).getAttribute('aria-pressed')).toBe('false');
    expect(fixture.componentInstance.requests).toEqual([
      { value: false, previous: true, reason: 'pointer' },
    ]);
  });

  it('asks and waits when controlled, and follows the consumer’s next value', () => {
    const fixture = renderTemplate(
      `<button slToggle [pressed]="pressed" (pressedChange)="record($event); follow($event)">Wrap</button>`,
    );

    click(control(fixture));
    expect(fixture.componentInstance.requests).toEqual([
      { value: true, previous: false, reason: 'pointer' },
    ]);
    fixture.detectChanges();
    expect(control(fixture).getAttribute('aria-pressed')).toBe('true');
  });

  it('moves nothing when the consumer cancels the request', () => {
    const fixture = renderTemplate(
      `<button slToggle (pressedChange)="record($event)">Wrap</button>`,
    );
    fixture.componentInstance.cancel = true;

    click(control(fixture));
    fixture.detectChanges();
    expect(control(fixture).getAttribute('aria-pressed')).toBe('false');
  });

  it('tells a keyboard activation from a pointer one', () => {
    const fixture = renderTemplate(
      `<button slToggle (pressedChange)="record($event)">Wrap</button>`,
    );

    click(control(fixture), 0);
    click(control(fixture), 1);
    expect(fixture.componentInstance.requests.map((request) => request.reason)).toEqual([
      'keyboard',
      'pointer',
    ]);
  });

  it('runs the consumer’s handler first and moves nothing when it prevents default', () => {
    const fixture = renderTemplate(
      `<button slToggle (click)="$event.preventDefault()" (pressedChange)="record($event)">Wrap</button>`,
    );

    click(control(fixture));
    fixture.detectChanges();
    expect(fixture.componentInstance.requests).toEqual([]);
    expect(control(fixture).getAttribute('aria-pressed')).toBe('false');
  });

  it('is disabled natively, and says so in the DOM', () => {
    const fixture = renderTemplate(
      `<button slToggle disabled (pressedChange)="record($event)">Wrap</button>`,
    );

    expect(control(fixture).disabled).toBe(true);
    expect(control(fixture).hasAttribute('data-disabled')).toBe(true);
    click(control(fixture));
    expect(fixture.componentInstance.requests).toEqual([]);
  });

  it('resolves size and variant from the input, then the provider, then the contract', () => {
    let fixture = renderTemplate(`<button slToggle>Wrap</button>`);
    expect(control(fixture).getAttribute('data-size')).toBe(contract.members.toggle.defaults.size);
    expect(control(fixture).getAttribute('data-variant')).toBe(
      contract.members.toggle.defaults.variant,
    );

    fixture = renderTemplate(`<button slToggle>Wrap</button>`, [
      provideToggleDefaults({ size: 'sm', variant: 'ghost' }),
    ]);
    expect(control(fixture).getAttribute('data-size')).toBe('sm');
    expect(control(fixture).getAttribute('data-variant')).toBe('ghost');

    fixture = renderTemplate(`<button slToggle size="lg" variant="outline">Wrap</button>`, [
      provideToggleDefaults({ size: 'sm', variant: 'ghost' }),
    ]);
    expect(control(fixture).getAttribute('data-size')).toBe('lg');
    expect(control(fixture).getAttribute('data-variant')).toBe('outline');
  });

  it('keeps a type the consumer wrote and passes native attributes through', () => {
    const fixture = renderTemplate(
      `<button slToggle type="submit" name="wrap" value="on" aria-label="Wrap lines"><svg slToggleIcon></svg></button>`,
    );

    expect(control(fixture).getAttribute('type')).toBe('submit');
    expect(control(fixture).getAttribute('name')).toBe('wrap');
    expect(control(fixture).getAttribute('value')).toBe('on');
    expect(control(fixture).getAttribute('aria-label')).toBe('Wrap lines');
    /* An icon-only toggle projects no words, and the empty box is what the
       stylesheet reads as "no label". */
    expect(control(fixture).querySelector('[data-part="label"]')?.childNodes.length).toBe(0);
  });

  /** Inside a bar the toggle is one of its controls: the bar owns the tab stop. */
  it('is one control of a toolbar and writes no keyboard of its own', async () => {
    const fixture = renderTemplate(
      `<div slToolbar aria-label="Editor">
        <button slToggle aria-label="Bold"><svg slToggleIcon></svg></button>
        <button slToggle aria-label="Italic"><svg slToggleIcon></svg></button>
      </div>`,
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const [bold, italic] = [
      ...fixture.nativeElement.querySelectorAll('[data-ui="toggle"]'),
    ] as HTMLButtonElement[];
    expect(bold?.getAttribute('tabindex')).toBe('0');
    expect(italic?.getAttribute('tabindex')).toBe('-1');
  });
});
