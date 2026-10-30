import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/stepper/contract.json';
import { SlStepper, SlStepperList, SlStepperNext, SlStepperPanel, SlStepperStep } from './stepper';
import { provideStepperDefaults } from './stepper.constants';

@Component({
  imports: [SlStepper, SlStepperList, SlStepperNext, SlStepperPanel, SlStepperStep],
  template: `<div
    slStepper
    [step]="step()"
    [defaultStep]="defaultStep()"
    [linear]="linear()"
    [autoComplete]="autoComplete()"
    [navigation]="navigation()"
    [orientation]="orientation()"
    (stepChange)="onStepChange($event)"
  >
    <ol slStepperList>
      @for (name of names(); track name; let i = $index) {
        <li
          slStepperStep
          [label]="name"
          [complete]="completed().includes(i) ? true : undefined"
          [disabled]="closed().includes(i) ? true : undefined"
          [invalid]="failed().includes(i)"
          [loading]="waiting().includes(i)"
        >
          <div slStepperPanel>Body of {{ name }}</div>
        </li>
      }
    </ol>
    <button slStepperNext type="button">Continue</button>
  </div>`,
})
class TestHost {
  readonly names = signal(['Cart', 'Address', 'Payment', 'Review']);
  readonly completed = signal<number[]>([]);
  readonly closed = signal<number[]>([]);
  readonly failed = signal<number[]>([]);
  readonly waiting = signal<number[]>([]);
  readonly step = signal<number | undefined>(undefined);
  readonly defaultStep = signal(0);
  readonly linear = signal(false);
  readonly autoComplete = signal(false);
  readonly navigation = signal<'button' | 'link' | 'none' | undefined>(undefined);
  readonly orientation = signal<'horizontal' | 'vertical' | undefined>(undefined);
  readonly onStepChange = vi.fn();
}

function setup(providers: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [TestHost], providers: providers as never[] });
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector('[data-ui="stepper"]') as HTMLElement;
  const items = () => [...root.querySelectorAll('[data-part="item"]')] as HTMLElement[];
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    items,
    item: (index: number) => items()[index] as HTMLElement,
    trigger: (index: number) =>
      items()[index]?.querySelector('[data-part="trigger"]') as HTMLElement,
    settle: () => fixture.detectChanges(),
  };
}

describe('SlStepper', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const { root, item, trigger } = setup();

    expect(root.getAttribute('data-part')).toBe('root');
    expect(root.querySelector('[data-part="list"]')?.tagName).toBe('OL');
    expect(item(0).tagName).toBe('LI');
    expect(trigger(0).querySelector('[data-part="marker"]')?.textContent?.trim()).toBe('1');
    expect(trigger(0).querySelector('[data-part="label"]')?.textContent).toContain('Cart');
  });

  it('names the sequence without claiming a role the guide refuses', () => {
    const { root } = setup();

    expect(root.querySelector('[data-part="list"]')?.getAttribute('aria-label')).toBe('Progress');
    expect(root.querySelector('[role="tablist"]')).toBeNull();
    expect(root.querySelector('[role="tab"]')).toBeNull();
    expect(contract.declined.tabRole.deferTo).toBe('tabs');
  });

  it('marks the current step with the value the specification names', () => {
    const { host, item, root, trigger, settle } = setup();
    host.defaultStep.set(2);
    settle();

    expect(trigger(2).getAttribute('aria-current')).toBe('step');
    expect(item(2).getAttribute('data-current')).toBe('');
    expect(trigger(0).hasAttribute('aria-current')).toBe(false);
    /* One step is current, so one element carries the mark. */
    expect(root.querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  /**
   * The five states a step is read in, in one flow: the step behind is
   * complete, the step the reader is on is current, the step after it is
   * upcoming and carries no mark at all, and the last two are the failed step
   * and the closed one.
   */
  it('writes the five states, and nothing at all on an upcoming step', () => {
    const { host, item, settle } = setup();
    host.names.set(['Cart', 'Address', 'Payment', 'Review', 'Receipt']);
    host.defaultStep.set(1);
    host.completed.set([0]);
    host.failed.set([3]);
    host.closed.set([4]);
    settle();

    expect(item(0).getAttribute('data-complete')).toBe('');
    expect(item(1).getAttribute('data-current')).toBe('');
    for (const state of ['complete', 'current', 'invalid', 'loading', 'disabled']) {
      expect(item(2).hasAttribute('data-' + state)).toBe(false);
    }
    expect(item(3).getAttribute('data-invalid')).toBe('');
    expect(item(4).getAttribute('data-disabled')).toBe('');

    /* A check over a finished step, a cross over a failed one, and the number
       alone everywhere else, the current step included. */
    const glyphs = [0, 1, 2, 3, 4].map(
      (index) =>
        item(index)
          .querySelector('[data-part="marker"] > [data-ui="icon"] > svg[data-glyph]')
          ?.getAttribute('data-glyph') ?? null,
    );
    expect(glyphs).toEqual(['check', null, null, 'x', null]);
  });

  it('says where each step is and what state it is in', () => {
    const { host, trigger, settle } = setup();
    host.defaultStep.set(1);
    host.completed.set([0]);
    settle();

    const announced = (index: number) =>
      trigger(index).querySelector('[data-part="status"]')?.textContent;
    expect(announced(0)).toBe(', Step 1 of 4, completed');
    expect(announced(1)).toBe(', Step 2 of 4, current');
    expect(announced(3)).toBe(', Step 4 of 4');
  });

  it('never claims completion the consumer did not claim', () => {
    const { host, item, settle } = setup();
    host.defaultStep.set(2);
    settle();
    expect(item(0).hasAttribute('data-complete')).toBe(false);

    host.autoComplete.set(true);
    settle();
    expect(item(0).getAttribute('data-complete')).toBe('');
  });

  it('fills the connector for a step the reader walked past', () => {
    const { host, item, settle } = setup();
    host.defaultStep.set(2);
    settle();

    const connector = (index: number) => item(index).querySelector('[data-part="separator"]');
    expect(connector(0)?.getAttribute('data-complete')).toBe('');
    expect(connector(2)?.hasAttribute('data-complete')).toBe(false);
    expect(connector(3)).toBeNull();
  });

  it('moves when a header is pressed, and carries the reason', () => {
    const { host, item, trigger, settle } = setup();

    trigger(2).click();
    settle();

    expect(host.onStepChange).toHaveBeenCalledWith(
      expect.objectContaining({ previous: 0, reason: 'pointer', value: 2 }),
    );
    expect(item(2).getAttribute('data-current')).toBe('');
  });

  /**
   * Backwards through a linear flow: the step is complete, so it is reachable
   * and its header answers, which is the whole point of marking it complete.
   */
  it('goes back when the header of a completed step is pressed', () => {
    const { host, item, trigger, settle } = setup();
    host.linear.set(true);
    host.defaultStep.set(2);
    host.completed.set([0, 1]);
    settle();

    expect(item(1).getAttribute('data-complete')).toBe('');
    expect(trigger(1).hasAttribute('aria-disabled')).toBe(false);

    trigger(1).click();
    settle();

    expect(host.onStepChange).toHaveBeenCalledWith(
      expect.objectContaining({ previous: 2, reason: 'pointer', value: 1 }),
    );
    expect(item(1).getAttribute('data-current')).toBe('');
    expect(trigger(1).getAttribute('aria-current')).toBe('step');
  });

  /**
   * The step behind is reached because it is behind, and not because anything
   * about it is finished: `autoComplete` is off, so walking past a step leaves
   * it pending, and a linear flow that only opened what is finished would trap
   * the reader on the step they are on.
   */
  it('goes back to an earlier step a linear flow never marked complete', () => {
    const { host, item, trigger, settle } = setup();
    host.linear.set(true);
    host.defaultStep.set(2);
    settle();

    expect(item(1).hasAttribute('data-complete')).toBe(false);
    expect(trigger(1).hasAttribute('aria-disabled')).toBe(false);

    trigger(1).click();
    settle();

    expect(host.onStepChange).toHaveBeenCalledWith(
      expect.objectContaining({ previous: 2, reason: 'pointer', value: 1 }),
    );
    expect(item(1).getAttribute('data-current')).toBe('');
  });

  it('never moves state the consumer owns', () => {
    const { host, item, trigger, settle } = setup();
    host.step.set(1);
    settle();

    trigger(3).click();
    settle();

    expect(host.onStepChange).toHaveBeenCalledOnce();
    expect(item(1).getAttribute('data-current')).toBe('');
  });

  describe('linear', () => {
    it('reaches backwards and one step forward, and no further', () => {
      const { host, trigger, settle } = setup();
      host.linear.set(true);
      host.defaultStep.set(1);
      host.completed.set([0]);
      settle();

      expect(trigger(1).hasAttribute('aria-disabled')).toBe(false);
      expect(trigger(2).getAttribute('aria-disabled')).toBe('true');
      expect(trigger(3).getAttribute('aria-disabled')).toBe('true');
    });

    /** Discoverable, not removed: a reader finds the step and that it is closed. */
    it('keeps an unreachable step in the tab sequence', () => {
      const { host, trigger, settle } = setup();
      host.linear.set(true);
      settle();

      expect(trigger(3).hasAttribute('disabled')).toBe(false);
      expect(trigger(3).getAttribute('aria-disabled')).toBe('true');
      expect(contract.unreachableAttribute).toBe('aria-disabled');
    });

    it('opens the next step once the one before it is complete', () => {
      const { host, trigger, settle } = setup();
      host.linear.set(true);
      host.defaultStep.set(1);
      host.completed.set([0]);
      settle();
      expect(trigger(2).getAttribute('aria-disabled')).toBe('true');

      host.completed.set([0, 1]);
      settle();
      expect(trigger(2).hasAttribute('aria-disabled')).toBe(false);
      expect(trigger(3).getAttribute('aria-disabled')).toBe('true');
    });

    it('refuses the move an unreachable header would make', () => {
      const { host, trigger, settle } = setup();
      host.linear.set(true);
      settle();

      trigger(3).click();
      settle();
      expect(host.onStepChange).not.toHaveBeenCalled();
    });
  });

  describe('the keyboard', () => {
    const arrow = (element: HTMLElement, key: string) =>
      element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));

    it('follows the reading direction along a row', () => {
      const { trigger } = setup();
      trigger(0).focus();

      arrow(trigger(0), 'ArrowRight');
      expect(document.activeElement).toBe(trigger(1));

      arrow(trigger(1), 'ArrowLeft');
      expect(document.activeElement).toBe(trigger(0));
    });

    it('answers the block arrows only when the flow runs down the page', () => {
      const { host, trigger, settle } = setup();
      trigger(0).focus();
      arrow(trigger(0), 'ArrowDown');
      expect(document.activeElement).toBe(trigger(0));

      host.orientation.set('vertical');
      settle();
      arrow(trigger(0), 'ArrowDown');
      expect(document.activeElement).toBe(trigger(1));
    });

    it('takes Home and End to the ends, and wraps', () => {
      const { trigger } = setup();
      trigger(1).focus();

      arrow(trigger(1), 'End');
      expect(document.activeElement).toBe(trigger(3));

      arrow(trigger(3), 'Home');
      expect(document.activeElement).toBe(trigger(0));

      arrow(trigger(0), 'ArrowLeft');
      expect(document.activeElement).toBe(trigger(3));

      arrow(trigger(3), 'ArrowRight');
      expect(document.activeElement).toBe(trigger(0));
    });

    /**
     * The arrows reach a header a linear flow has not opened, because Tab
     * reaches it: they are on top of the tab sequence rather than in place of
     * it, and a step a reader may not activate is still one they may find.
     */
    it('reaches every header, exactly where Tab does', () => {
      const { host, trigger, settle } = setup();
      host.linear.set(true);
      settle();
      trigger(0).focus();

      arrow(trigger(0), 'ArrowRight');
      expect(document.activeElement).toBe(trigger(1));
      expect(trigger(1).getAttribute('aria-disabled')).toBe('true');
      expect(trigger(1).hasAttribute('tabindex')).toBe(false);
    });
  });

  it('renders a button, a link or neither, as the flow allows', () => {
    const { host, trigger, settle } = setup();
    expect(trigger(0).tagName).toBe('BUTTON');

    host.navigation.set('link');
    settle();
    expect(trigger(0).tagName).toBe('A');

    host.navigation.set('none');
    settle();
    expect(trigger(0).tagName).toBe('SPAN');
  });

  it('shows the current step panel and hides the rest, related without a tab role', () => {
    const { host, root, trigger, settle } = setup();
    host.defaultStep.set(1);
    settle();

    const panels = [...root.querySelectorAll('[data-part="panel"]')] as HTMLElement[];
    expect(panels[1]?.hasAttribute('hidden')).toBe(false);
    expect(panels[0]?.hasAttribute('hidden')).toBe(true);
    expect(panels[1]?.getAttribute('role')).toBe('group');
    expect(panels[1]?.getAttribute('aria-labelledby')).toBe(trigger(1).id);
  });

  it('advances through the consumer own button rather than one of its own', () => {
    const { item, root, settle } = setup();

    const advance = root.querySelector('button[slStepperNext]') as HTMLButtonElement;
    advance.click();
    settle();

    expect(item(1).getAttribute('data-current')).toBe('');
    expect(contract.advance.angular).toBe('slStepperPrevious and slStepperNext');
  });

  it('takes the application defaults, and yields to an explicit input', () => {
    const { host, root, settle } = setup([
      provideStepperDefaults({ labelPlacement: 'bottom', orientation: 'vertical' }),
    ]);
    expect(root.getAttribute('data-orientation')).toBe('vertical');
    expect(root.getAttribute('data-label-placement')).toBe('bottom');

    host.orientation.set('horizontal');
    settle();
    expect(root.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const { host, root, item, settle } = setup([
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);
    host.completed.set([0]);
    host.defaultStep.set(1);
    settle();
    const announced = () => item(0).querySelector('[data-part="status"]')?.textContent?.trim();

    expect(root.querySelector('ol')?.getAttribute('aria-label')).toBe('Progresso');
    // language: pt-BR
    expect(announced()).toBe(', Etapa 1 de 4 e concluída');
    // language: en-US

    locale.set('en-US');
    settle();
    expect(announced()).toBe(', Step 1 of 4, completed');
  });
});
