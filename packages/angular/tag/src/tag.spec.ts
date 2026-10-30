import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { describe, expect, it } from 'vitest';

import { SlTag } from './tag';
import type { TagRemoveRequest, TagTone } from './tag';
import { SlTagBody } from './tag-body';
import { SlTagEnd, SlTagStart } from './tag-content';
import { provideTagDefaults } from './tag-defaults';
import { SlTagGroup } from './tag-group';
import { SlTagRemove } from './tag-remove';
import { SlTagToggle } from './tag-toggle';

@Component({
  imports: [SlTag, SlTagBody, SlTagEnd, SlTagGroup, SlTagRemove, SlTagStart, SlTagToggle],
  template: `
    <span slTag id="plain" [tone]="tone()">
      <span slTagBody id="plain-body">
        <span slTagStart id="start"></span>
        Design
        <span slTagEnd id="end"></span>
      </span>
    </span>

    <span slTag id="removable" removable [disabled]="disabled()" (remove)="record($event)">
      <span slTagBody>Ana Reis</span>
      <button slTagRemove id="removable-remove"></button>
    </span>

    <span slTag id="commanding">
      <button slTagBody id="command" [disabled]="false">Atribuir</button>
    </span>

    <span slTag id="navigating" [disabled]="disabled()">
      <a slTagBody id="destination" href="/equipes">#plataforma</a>
    </span>

    <span slTag id="toggling">
      <button
        slTagToggle
        id="toggle"
        [selected]="selected()"
        (selectedChange)="requests.push($event)"
      >
        Aberto
      </button>
    </span>

    <span slTag id="uncontrolled">
      <button slTagToggle id="uncontrolled-toggle" defaultSelected>Delivered</button>
    </span>

    <div slTagGroup id="group" aria-label="Filtros">
      <span slTag removable>
        <span slTagBody>Um</span>
        <button slTagRemove></button>
      </span>
      <span slTag removable>
        <span slTagBody>Dois</span>
        <button slTagRemove></button>
      </span>
    </div>

    <div slTagGroup id="listed" role="list" aria-label="Tecnologias">
      <span slTag id="listed-item"><span slTagBody>TypeScript</span></span>
    </div>
  `,
})
class Host {
  readonly tone = signal<TagTone | undefined>(undefined);
  readonly disabled = signal(false);
  readonly selected = signal<boolean | undefined>(false);
  readonly removals: TagRemoveRequest[] = [];
  readonly requests: ChangeRequest<boolean>[] = [];

  record(request: TagRemoveRequest) {
    this.removals.push(request);
  }
}

function mount(providers: unknown[] = []) {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const byId = (id: string) => element.querySelector<HTMLElement>(`#${id}`)!;
  return { fixture, host: fixture.componentInstance, byId, element };
}

describe('SlTag', () => {
  it('renders one anatomy on the consumer’s own elements', () => {
    const { byId } = mount();
    const chip = byId('plain');

    expect(chip.tagName).toBe('SPAN');
    expect(chip.getAttribute('data-ui')).toBe('tag');
    expect(chip.getAttribute('data-part')).toBe('root');
    expect(chip.getAttribute('data-tone')).toBe('secondary');
    expect(chip.getAttribute('data-variant')).toBe('soft');
    expect(byId('plain-body').getAttribute('data-part')).toBe('body');
    expect(byId('start').getAttribute('data-part')).toBe('start');
    expect(byId('end').getAttribute('data-part')).toBe('end');
    expect(chip.querySelector('[data-part="label"]')?.textContent?.trim()).toBe('Design');
  });

  it('takes an explicit input over the token, and the token over its own default', () => {
    const { byId, fixture, host } = mount([provideTagDefaults({ tone: 'accent', size: 'sm' })]);

    expect(byId('plain').getAttribute('data-tone')).toBe('accent');
    expect(byId('plain').getAttribute('data-size')).toBe('sm');

    host.tone.set('danger');
    fixture.detectChanges();
    expect(byId('plain').getAttribute('data-tone')).toBe('danger');
  });
});

describe('SlTagRemove', () => {
  it('names itself after the value it removes', () => {
    const { byId } = mount();
    const control = byId('removable-remove');
    const labelledBy = control.getAttribute('aria-labelledby')?.split(' ') ?? [];

    expect(labelledBy).toHaveLength(2);
    const words = labelledBy
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .join(' ');
    expect(words).toBe('Remove Ana Reis');
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const { byId, fixture } = mount([provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })]);
    const word = () => {
      const [wordId] = byId('removable-remove').getAttribute('aria-labelledby')!.split(' ');
      return document.getElementById(wordId!)?.textContent?.trim();
    };

    expect(word()).toBe('Remover');

    locale.set('en-US');
    fixture.detectChanges();
    expect(word()).toBe('Remove');
  });

  it('draws the x glyph, hidden, inside the control', () => {
    const { byId } = mount();

    const glyph = byId('removable-remove').querySelector('[data-ui="icon"] > svg[data-glyph]');
    expect(glyph?.getAttribute('data-glyph')).toBe('x');
    expect(glyph?.parentElement?.getAttribute('aria-hidden')).toBe('true');
  });

  it('says the removal was asked for by the control', () => {
    const { byId, host } = mount();

    byId('removable-remove').click();

    expect(host.removals).toHaveLength(1);
    expect(host.removals[0]?.reason).toBe('remove');
  });

  it.each(['Backspace', 'Delete'])('removes on %s, and says the keyboard asked', (key) => {
    const { byId, host } = mount();

    byId('removable-remove').dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }),
    );

    expect(host.removals[0]?.reason).toBe('keyboard');
  });

  it('lets the request be refused before anything commits', () => {
    const { byId, host } = mount();

    byId('removable-remove').click();
    host.removals[0]?.cancel();

    expect(host.removals[0]?.cancelled).toBe(true);
  });

  it('refuses the removal when the chip is unavailable', () => {
    const { byId, fixture, host } = mount();

    host.disabled.set(true);
    fixture.detectChanges();
    byId('removable-remove').click();

    expect(host.removals).toHaveLength(0);
    expect(byId('removable-remove').hasAttribute('disabled')).toBe(true);
    expect(byId('removable').hasAttribute('data-disabled')).toBe(true);
  });

  /** A button inside a button is not legal HTML, and this is why the root is a span. */
  it('sits beside the body rather than inside it', () => {
    const { byId } = mount();

    expect(byId('removable-remove').parentElement?.getAttribute('data-part')).toBe('root');
  });
});

describe('SlTagBody', () => {
  it('keeps the command on the consumer’s own button', () => {
    const { byId } = mount();

    expect(byId('command').tagName).toBe('BUTTON');
    expect(byId('command').getAttribute('data-part')).toBe('body');
  });

  it('withholds an anchor’s destination while the chip is unavailable, and gives it back', () => {
    const { byId, fixture, host } = mount();

    host.disabled.set(true);
    fixture.detectChanges();
    expect(byId('destination').hasAttribute('href')).toBe(false);
    expect(byId('destination').getAttribute('aria-disabled')).toBe('true');
    expect(byId('destination').getAttribute('tabindex')).toBe('0');

    host.disabled.set(false);
    fixture.detectChanges();
    expect(byId('destination').getAttribute('href')).toBe('/equipes');
  });
});

describe('SlTagToggle', () => {
  it('announces its selection as a pressed state and keeps its label', () => {
    const { byId, fixture, host } = mount();
    const control = byId('toggle');

    expect(control.getAttribute('aria-pressed')).toBe('false');
    control.click();
    fixture.detectChanges();

    expect(host.requests).toHaveLength(1);
    expect(host.requests[0]?.value).toBe(true);
    expect(control.textContent?.trim()).toBe('Aberto');
  });

  it('never moves a selection the consumer owns', () => {
    const { byId, fixture } = mount();

    byId('toggle').click();
    fixture.detectChanges();

    expect(byId('toggle').getAttribute('aria-pressed')).toBe('false');
    expect(byId('toggling').hasAttribute('data-selected')).toBe(false);
  });

  it('moves its own state when nobody owns it, and paints the chip', () => {
    const { byId, fixture } = mount();

    expect(byId('uncontrolled-toggle').getAttribute('aria-pressed')).toBe('true');
    expect(byId('uncontrolled').hasAttribute('data-selected')).toBe(true);

    byId('uncontrolled-toggle').click();
    fixture.detectChanges();

    expect(byId('uncontrolled-toggle').getAttribute('aria-pressed')).toBe('false');
    expect(byId('uncontrolled').hasAttribute('data-selected')).toBe(false);
  });

  it('gives the selection a mark of its own, so colour is never the only signal', () => {
    const { byId } = mount();

    expect(
      byId('uncontrolled-toggle')
        .querySelector('[data-part="indicator"]')
        ?.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(
      byId('uncontrolled-toggle')
        .querySelector('[data-part="indicator"] > [data-ui="icon"] > svg[data-glyph]')
        ?.getAttribute('data-glyph'),
    ).toBe('check');
  });
});

describe('SlTagGroup', () => {
  it('is a toolbar with one tab stop, and moves between every control inside it', () => {
    const { byId } = mount();
    const group = byId('group');
    const controls = [...group.querySelectorAll<HTMLElement>('[data-part="remove"]')];

    expect(group.getAttribute('role')).toBe('toolbar');
    expect(group.getAttribute('tabindex')).toBe('-1');
    expect(controls[0]?.getAttribute('tabindex')).toBe('0');
    expect(controls[1]?.getAttribute('tabindex')).toBe('-1');

    controls[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }),
    );
    expect(document.activeElement).toBe(controls[1]);
  });

  it('stops being a widget when it is written as a list', () => {
    const { byId } = mount();

    expect(byId('listed').getAttribute('role')).toBe('list');
    expect(byId('listed-item').getAttribute('role')).toBe('listitem');
    expect(byId('listed-item').getAttribute('data-ui')).toBe('tag');
  });
});
