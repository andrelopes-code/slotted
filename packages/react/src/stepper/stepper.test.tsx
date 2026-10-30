import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/stepper/contract.json';
import { SlottedProvider } from '../i18n';
import { Stepper, useStepper } from './stepper';
import { StepperDefaultsProvider } from './stepper-defaults';
import { StepperList, StepperNext, StepperPanel, StepperStep } from './stepper-parts';
import type { StepperProps, StepperStepProps } from './stepper.types';

const NAMES = ['Cart', 'Address', 'Payment', 'Review'];

function Checkout({
  names = NAMES,
  stepProps = {},
  ...props
}: Partial<StepperProps> & {
  names?: string[];
  stepProps?: Record<number, Partial<StepperStepProps>>;
}) {
  return (
    <Stepper {...props}>
      <StepperList>
        {names.map((name, index) => (
          <StepperStep key={name} label={name} {...stepProps[index]} />
        ))}
      </StepperList>
    </Stepper>
  );
}

const root = () => screen.getByRole('list').parentElement as HTMLElement;
const items = () => [...root().querySelectorAll('[data-part="item"]')] as HTMLElement[];
const item = (index: number) => items()[index] as HTMLElement;
const trigger = (index: number) =>
  item(index).querySelector('[data-part="trigger"]') as HTMLElement;
const marker = (index: number) => item(index).querySelector('[data-part="marker"]') as HTMLElement;

describe('Stepper', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(<Checkout className="wizard" />);

    expect(root().tagName).toBe('DIV');
    expect(root()).toHaveAttribute('data-ui', 'stepper');
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(root()).toHaveClass('wizard');
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(item(0)).toHaveAttribute('data-part', 'item');
    expect(marker(0)).toHaveTextContent('1');
    expect(item(0).querySelector('[data-part="label"]')).toHaveTextContent('Cart');
  });

  /**
   * The sequence comes from `ol` and `li`, and the family claims neither the
   * tab role nor a second landmark. Section 7 of the feature guide forbids the
   * first, in the Tabs entry itself.
   */
  it('names the sequence without claiming a role the guide refuses', () => {
    render(<Checkout messages={{ label: 'Checkout' }} />);

    expect(screen.getByRole('list')).toHaveAccessibleName('Checkout');
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(contract.declined.tabRole.deferTo).toBe('tabs');
  });

  it('marks the current step with the value the specification names', () => {
    render(<Checkout defaultStep={2} />);

    expect(trigger(2)).toHaveAttribute('aria-current', 'step');
    expect(item(2)).toHaveAttribute('data-current', '');
    expect(trigger(0)).not.toHaveAttribute('aria-current');
    /* One step is current, so one element carries the mark. */
    expect(root().querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  /** A reader hears the position and the status, not the number in the circle. */
  it('says where each step is and what state it is in', () => {
    render(<Checkout defaultStep={1} stepProps={{ 0: { complete: true } }} />);

    expect(trigger(0)).toHaveAccessibleName('Cart, Step 1 of 4, completed');
    expect(trigger(1)).toHaveAccessibleName('Address, Step 2 of 4, current');
    expect(trigger(3)).toHaveAccessibleName('Review, Step 4 of 4');
    expect(marker(0)).toHaveAttribute('aria-hidden', 'true');
  });

  describe('statuses', () => {
    it('takes the consumer word over the position', () => {
      render(<Checkout defaultStep={1} stepProps={{ 3: { complete: true } }} />);

      expect(item(0)).not.toHaveAttribute('data-complete');
      expect(item(3)).toHaveAttribute('data-complete', '');
    });

    it('never claims completion the consumer did not claim', () => {
      const { rerender } = render(<Checkout defaultStep={2} />);
      expect(item(0)).not.toHaveAttribute('data-complete');

      rerender(<Checkout autoComplete defaultStep={2} />);
      expect(item(0)).toHaveAttribute('data-complete', '');
      expect(contract.members.stepper.defaults.autoComplete).toBe(false);
    });

    it('keeps the current step current even once it is complete', () => {
      render(<Checkout autoComplete defaultStep={2} />);

      expect(item(2)).toHaveAttribute('data-current', '');
      expect(item(2)).not.toHaveAttribute('data-complete');
    });

    it('writes every state a consumer may style', () => {
      render(
        <Checkout
          defaultStep={0}
          stepProps={{ 1: { invalid: true }, 2: { loading: true }, 3: { disabled: true } }}
        />,
      );

      expect(item(1)).toHaveAttribute('data-invalid', '');
      expect(item(2)).toHaveAttribute('data-loading', '');
      expect(item(3)).toHaveAttribute('data-disabled', '');
    });

    /**
     * The five states a step is read in, in one flow: the step behind is
     * complete, the step the reader is on is current, the step after it is
     * upcoming and carries no mark at all, and the last two are the failed
     * step and the closed one.
     */
    it('writes the five states, and nothing at all on an upcoming step', () => {
      render(
        <Checkout
          defaultStep={1}
          names={['Cart', 'Address', 'Payment', 'Review', 'Receipt']}
          stepProps={{ 0: { complete: true }, 3: { invalid: true }, 4: { disabled: true } }}
        />,
      );

      expect(item(0)).toHaveAttribute('data-complete', '');
      expect(item(1)).toHaveAttribute('data-current', '');
      for (const state of ['complete', 'current', 'invalid', 'loading', 'disabled']) {
        expect(item(2)).not.toHaveAttribute(`data-${state}`);
      }
      expect(item(3)).toHaveAttribute('data-invalid', '');
      expect(item(4)).toHaveAttribute('data-disabled', '');

      /* A check over a finished step, a cross over a failed one, and the
         number alone everywhere else, the current step included. */
      const glyphs = [0, 1, 2, 3, 4].map(
        (index) =>
          marker(index)
            .querySelector('[data-ui="icon"] > svg[data-glyph]')
            ?.getAttribute('data-glyph') ?? null,
      );
      expect(glyphs).toEqual(['check', null, null, 'x', null]);
    });

    it('fills the connector for a step the reader walked past', () => {
      render(<Checkout defaultStep={2} />);

      const connector = (index: number) =>
        item(index).querySelector('[data-part="separator"]') as HTMLElement | null;
      expect(connector(0)).toHaveAttribute('data-complete', '');
      expect(connector(1)).toHaveAttribute('data-complete', '');
      expect(connector(2)).not.toHaveAttribute('data-complete');
      expect(connector(3)).toBeNull();
    });
  });

  describe('the step', () => {
    it('moves when a header is pressed, and carries the reason', () => {
      const onStepChange = vi.fn();
      render(<Checkout onStepChange={onStepChange} />);

      fireEvent.click(trigger(2));

      expect(onStepChange).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ previous: 0, reason: 'pointer' }),
      );
      expect(item(2)).toHaveAttribute('data-current', '');
    });

    /**
     * Backwards through a linear flow: the step is complete, so it is reachable
     * and its header answers, which is the whole point of marking it complete.
     */
    it('goes back when the header of a completed step is pressed', () => {
      const onStepChange = vi.fn();
      render(
        <Checkout
          defaultStep={2}
          linear
          onStepChange={onStepChange}
          stepProps={{ 0: { complete: true }, 1: { complete: true } }}
        />,
      );

      expect(item(1)).toHaveAttribute('data-complete', '');
      expect(trigger(1)).not.toHaveAttribute('aria-disabled');

      fireEvent.click(trigger(1));

      expect(onStepChange).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ previous: 2, reason: 'pointer' }),
      );
      expect(item(1)).toHaveAttribute('data-current', '');
      expect(trigger(1)).toHaveAttribute('aria-current', 'step');
    });

    /**
     * The step behind is reached because it is behind, and not because
     * anything about it is finished: `autoComplete` is off, so walking past a
     * step leaves it pending, and a linear flow that only opened what is
     * finished would trap the reader on the step they are on.
     */
    it('goes back to an earlier step a linear flow never marked complete', () => {
      const onStepChange = vi.fn();
      render(<Checkout defaultStep={2} linear onStepChange={onStepChange} />);

      expect(item(1)).not.toHaveAttribute('data-complete');
      expect(trigger(1)).not.toHaveAttribute('aria-disabled');

      fireEvent.click(trigger(1));

      expect(onStepChange).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ previous: 2, reason: 'pointer' }),
      );
      expect(item(1)).toHaveAttribute('data-current', '');
    });

    it('never moves state the consumer owns', () => {
      const onStepChange = vi.fn();
      render(<Checkout onStepChange={onStepChange} step={1} />);

      fireEvent.click(trigger(3));

      expect(onStepChange).toHaveBeenCalledOnce();
      expect(item(1)).toHaveAttribute('data-current', '');
    });

    it('follows the consumer once they accept the request', () => {
      function Controlled() {
        const [step, setStep] = useState(0);
        return <Checkout onStepChange={setStep} step={step} />;
      }
      render(<Controlled />);

      fireEvent.click(trigger(2));
      expect(item(2)).toHaveAttribute('data-current', '');
    });

    /**
     * A consumer refuses a move by cancelling the request the library already
     * defines. Zag needs `isStepValid` and `onStepInvalid` for the same job.
     */
    it('is refused by cancelling the request, and needs no second hook', () => {
      render(<Checkout onStepChange={(_, request) => request.cancel()} />);

      fireEvent.click(trigger(2));
      expect(item(0)).toHaveAttribute('data-current', '');
      expect(contract.declined.validation.deferTo).toBe('the consumer');
    });
  });

  describe('linear', () => {
    it('reaches backwards and one step forward, and no further', () => {
      render(<Checkout defaultStep={1} linear stepProps={{ 0: { complete: true } }} />);

      expect(trigger(0)).not.toHaveAttribute('aria-disabled');
      expect(trigger(1)).not.toHaveAttribute('aria-disabled');
      expect(trigger(2)).toHaveAttribute('aria-disabled', 'true');
      expect(trigger(3)).toHaveAttribute('aria-disabled', 'true');
    });

    it('opens the next step once the one before it is complete', () => {
      render(
        <Checkout
          defaultStep={1}
          linear
          stepProps={{ 0: { complete: true }, 1: { complete: true } }}
        />,
      );

      expect(trigger(2)).not.toHaveAttribute('aria-disabled');
      expect(trigger(3)).toHaveAttribute('aria-disabled', 'true');
    });

    /** Discoverable, not removed: a reader finds the step and that it is closed. */
    it('keeps an unreachable step in the tab sequence', () => {
      render(<Checkout defaultStep={0} linear />);

      expect(trigger(3)).not.toHaveAttribute('disabled');
      expect(trigger(3)).toHaveAttribute('aria-disabled', 'true');
      expect(trigger(3)).toHaveAccessibleName('Review, Step 4 of 4, unavailable');
      expect(contract.unreachableAttribute).toBe('aria-disabled');
    });

    it('refuses the move an unreachable header would make', () => {
      const onStepChange = vi.fn();
      render(<Checkout linear onStepChange={onStepChange} />);

      fireEvent.click(trigger(3));
      expect(onStepChange).not.toHaveBeenCalled();
    });
  });

  describe('the keyboard', () => {
    it('follows the reading direction along a row', () => {
      render(<Checkout />);
      trigger(0).focus();

      fireEvent.keyDown(trigger(0), { key: 'ArrowRight' });
      expect(document.activeElement).toBe(trigger(1));

      fireEvent.keyDown(trigger(1), { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(trigger(0));
    });

    it('answers the block arrows only when the flow runs down the page', () => {
      const { rerender } = render(<Checkout />);
      trigger(0).focus();
      fireEvent.keyDown(trigger(0), { key: 'ArrowDown' });
      expect(document.activeElement).toBe(trigger(0));

      rerender(<Checkout orientation="vertical" />);
      trigger(0).focus();
      fireEvent.keyDown(trigger(0), { key: 'ArrowDown' });
      expect(document.activeElement).toBe(trigger(1));
    });

    it('takes Home and End to the ends', () => {
      render(<Checkout />);
      trigger(1).focus();

      fireEvent.keyDown(trigger(1), { key: 'End' });
      expect(document.activeElement).toBe(trigger(3));

      fireEvent.keyDown(trigger(3), { key: 'Home' });
      expect(document.activeElement).toBe(trigger(0));
    });

    /**
     * The arrows reach a header a linear flow has not opened, because Tab
     * reaches it: they were added on top of the tab sequence rather than
     * replacing it, and a step a reader may not activate is still one they are
     * allowed to find.
     */
    it('reaches every header, exactly where Tab does', () => {
      render(<Checkout defaultStep={0} linear />);
      trigger(0).focus();

      fireEvent.keyDown(trigger(0), { key: 'ArrowRight' });
      expect(document.activeElement).toBe(trigger(1));
      expect(trigger(1)).toHaveAttribute('aria-disabled', 'true');

      fireEvent.keyDown(trigger(1), { key: 'ArrowRight' });
      expect(document.activeElement).toBe(trigger(2));
    });

    it('wraps at both ends', () => {
      render(<Checkout />);
      trigger(3).focus();
      fireEvent.keyDown(trigger(3), { key: 'ArrowRight' });
      expect(document.activeElement).toBe(trigger(0));
    });

    it('leaves every header in the tab sequence', () => {
      render(<Checkout />);
      for (const header of [0, 1, 2, 3]) {
        expect(trigger(header)).not.toHaveAttribute('tabindex');
      }
    });
  });

  describe('navigation modes', () => {
    it('renders a button, a link or neither, as the flow allows', () => {
      const { rerender } = render(<Checkout />);
      expect(trigger(0).tagName).toBe('BUTTON');

      rerender(<Checkout navigation="link" stepProps={{ 0: { href: '/cart' } }} />);
      expect(trigger(0).tagName).toBe('A');
      expect(trigger(0)).toHaveAttribute('href', '/cart');

      rerender(<Checkout navigation="none" />);
      expect(trigger(0).tagName).toBe('SPAN');
    });

    it('reads as a progress indicator when nothing can be pressed', () => {
      const onStepChange = vi.fn();
      render(<Checkout navigation="none" onStepChange={onStepChange} />);

      fireEvent.click(trigger(2));
      expect(onStepChange).not.toHaveBeenCalled();
    });
  });

  describe('the panel', () => {
    it('shows the current step and hides the rest, related without a tab role', () => {
      render(
        <Stepper defaultStep={1}>
          <StepperList>
            {NAMES.map((name) => (
              <StepperStep key={name} label={name}>
                <StepperPanel>{`Body of ${name}`}</StepperPanel>
              </StepperStep>
            ))}
          </StepperList>
        </Stepper>,
      );

      const panel = screen.getByRole('group');
      expect(panel).toHaveTextContent('Body of Address');
      expect(screen.queryByText('Body of Cart')).toBeNull();
      expect(panel).toHaveAttribute('aria-labelledby', trigger(1).id);
      expect(panel).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('composition', () => {
    it('hands an advance handler to the consumer button rather than shipping one', () => {
      const onClick = vi.fn();
      render(
        <Stepper>
          <StepperList>
            {NAMES.map((name) => (
              <StepperStep key={name} label={name} />
            ))}
          </StepperList>
          <StepperNext
            onClick={onClick}
            render={(props) => (
              <button {...props} type="button">
                Continue
              </button>
            )}
          />
        </Stepper>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      expect(onClick).toHaveBeenCalledOnce();
      expect(item(1)).toHaveAttribute('data-current', '');
    });

    it('exposes the arithmetic a consumer cannot express as a prop', () => {
      let seen: ReturnType<typeof useStepper> | undefined;
      function Probe() {
        seen = useStepper();
        return null;
      }
      render(
        <Stepper defaultStep={2}>
          <StepperList>
            {NAMES.map((name) => (
              <StepperStep key={name} label={name} />
            ))}
          </StepperList>
          <Probe />
        </Stepper>,
      );

      expect(seen?.count).toBe(4);
      expect(seen?.percent).toBeCloseTo((2 / 3) * 100);
      expect(seen?.canGoPrevious).toBe(true);
      expect(contract.advance.react).toBe('useStepper()');
    });

    it('takes the application defaults, and yields to an explicit prop', () => {
      const { rerender } = render(
        <StepperDefaultsProvider labelPlacement="bottom" orientation="vertical">
          <Checkout />
        </StepperDefaultsProvider>,
      );
      expect(root()).toHaveAttribute('data-orientation', 'vertical');
      expect(root()).toHaveAttribute('data-label-placement', 'bottom');

      rerender(
        <StepperDefaultsProvider labelPlacement="bottom" orientation="vertical">
          <Checkout orientation="horizontal" />
        </StepperDefaultsProvider>,
      );
      expect(root()).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('merges one message with the six it did not touch', () => {
      render(
        <Checkout
          defaultStep={1}
          messages={{ complete: 'done' }}
          stepProps={{ 0: { complete: true } }}
        />,
      );

      expect(trigger(0)).toHaveAccessibleName('Cart, Step 1 of 4, done');
      expect(trigger(1)).toHaveAccessibleName('Address, Step 2 of 4, current');
    });

    it('speaks the language in force, and lists the statuses the way it lists', () => {
      render(
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          <Checkout defaultStep={1} stepProps={{ 0: { complete: true } }} />
        </SlottedProvider>,
      );

      expect(screen.getByRole('list')).toHaveAccessibleName('Progresso');
      // language: pt-BR
      expect(trigger(0)).toHaveAccessibleName('Cart, Etapa 1 de 4 e concluída');
      // language: en-US
    });

    it('refuses to render a part outside the stepper it belongs to', () => {
      const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      expect(() => render(<StepperList />)).toThrow(/inside a Stepper/);
      quiet.mockRestore();
    });
  });
});
