import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/slider/contract.json';
import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { Slider } from './slider';
import { SliderDefaultsProvider } from './slider-defaults';
import type { SliderHandle } from './slider.types';

const thumbs = () => screen.getAllByRole('slider') as HTMLInputElement[];
const thumb = (index = 0) => thumbs()[index] as HTMLInputElement;
const rootOf = (element: HTMLElement) => element.closest('[data-ui="slider"]') as HTMLElement;
const partOf = (part: string) =>
  rootOf(thumb()).querySelector(`[data-part="${part}"]`) as HTMLElement;

/** The stylesheet reads a percentage from a private property on the element. */
const positionOf = (element: HTMLElement) => element.style.getPropertyValue('--_position');

describe('Slider', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(<Slider className="page-volume" defaultValue={40} />);

    const root = rootOf(thumb());
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveAttribute('data-ui', 'slider');
    expect(root).toHaveAttribute('data-part', 'root');
    expect(root).toHaveClass('page-volume');

    for (const part of ['output', 'control', 'track', 'indicator', 'thumb', 'input', 'bubble']) {
      expect(root.querySelector(`[data-part="${part}"]`)).not.toBeNull();
    }
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(<Slider defaultValue={40} />);
    const root = rootOf(thumb());

    expect(root).toHaveAttribute('data-size', contract.members.slider.defaults.size);
    expect(root).toHaveAttribute('data-orientation', contract.members.slider.defaults.orientation);
    expect(root).toHaveAttribute('data-value-label', contract.members.slider.defaults.valueLabel);
  });

  /**
   * The role, the value set and the element's place in a form are the
   * platform's. Nothing here writes `role="slider"`.
   */
  it('holds the value in a native range input rather than in a role', () => {
    render(<Slider defaultValue={40} name="volume" />);

    expect(thumb().type).toBe('range');
    expect(thumb()).not.toHaveAttribute('role');
    expect(thumb()).toHaveAttribute('name', 'volume');
    expect(thumb().min).toBe('0');
    expect(thumb().max).toBe('100');
    expect(thumb().value).toBe('40');
  });

  it('renders one thumb per value and keeps the array’s order', () => {
    render(<Slider defaultValue={[20, 80]} thumbLabels={['Minimum', 'Maximum']} />);

    expect(thumbs()).toHaveLength(2);
    expect(thumb(0)).toHaveAccessibleName('Minimum');
    expect(thumb(1)).toHaveAccessibleName('Maximum');
  });

  /**
   * The APG's multi-thumb pattern requires the dependent sliders' announced
   * range to follow the neighbour's value, and an attribute is how a native
   * slider says it.
   */
  it('moves each thumb’s own bounds to its neighbour', () => {
    render(<Slider defaultValue={[20, 80]} minStepsBetween={2} step={5} />);

    expect(thumb(0).max).toBe('70');
    expect(thumb(1).min).toBe('30');
    expect(thumb(0).min).toBe('0');
    expect(thumb(1).max).toBe('100');
  });

  it('sorts a value set a consumer handed backwards', () => {
    render(<Slider defaultValue={[80, 20]} />);

    expect(thumbs().map((element) => element.value)).toEqual(['20', '80']);
  });

  describe('keyboard', () => {
    it('steps by one step on the arrows', () => {
      render(<Slider defaultValue={40} />);

      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });
      expect(thumb().value).toBe('41');
      fireEvent.keyDown(thumb(), { key: 'ArrowDown' });
      expect(thumb().value).toBe('40');
    });

    it('steps by the large amount on Shift and on the page keys', () => {
      render(<Slider defaultValue={40} largeStep={25} />);

      fireEvent.keyDown(thumb(), { key: 'ArrowUp', shiftKey: true });
      expect(thumb().value).toBe('65');
      fireEvent.keyDown(thumb(), { key: 'PageDown' });
      expect(thumb().value).toBe('40');
    });

    it('defaults the large amount to ten steps, as the sibling control does', () => {
      render(<Slider defaultValue={0} step={2} />);

      fireEvent.keyDown(thumb(), { key: 'PageUp' });
      expect(thumb().value).toBe('20');
    });

    /** Home and End reach the thumb's own bounds, which in a range is its neighbour. */
    it('reaches this thumb’s bounds rather than the scale’s', () => {
      render(<Slider defaultValue={[20, 80]} />);

      fireEvent.keyDown(thumb(0), { key: 'End' });
      expect(thumb(0).value).toBe('80');

      fireEvent.keyDown(thumb(1), { key: 'Home' });
      expect(thumb(1).value).toBe('80');
    });

    it('holds a thumb inside the scale', () => {
      render(<Slider defaultValue={99} />);

      fireEvent.keyDown(thumb(), { key: 'ArrowUp' });
      fireEvent.keyDown(thumb(), { key: 'ArrowUp' });
      expect(thumb().value).toBe('100');
    });

    it('answers no key while the control is read-only or disabled', () => {
      const { rerender } = render(<Slider defaultValue={40} readOnly />);
      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });
      expect(thumb().value).toBe('40');

      rerender(<Slider defaultValue={40} disabled />);
      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });
      expect(thumb().value).toBe('40');
    });

    /** The consumer's handler runs first and always, and can stop the family. */
    it('composes with the consumer’s own key handler', () => {
      const onKeyDown = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      render(<Slider defaultValue={40} onKeyDown={onKeyDown} />);

      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });

      expect(onKeyDown).toHaveBeenCalledOnce();
      expect(thumb().value).toBe('40');
    });
  });

  describe('state', () => {
    it('asks rather than moves when the consumer owns the value', () => {
      const onValueChange = vi.fn();
      render(<Slider onValueChange={onValueChange} value={40} />);

      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });

      expect(onValueChange).toHaveBeenCalledOnce();
      expect(onValueChange.mock.calls[0]?.[0]).toBe(41);
      expect(thumb().value).toBe('40');
    });

    it('carries the reason and lets the request be refused', () => {
      const onValueChange = vi.fn((_value, request) => request.cancel());
      render(<Slider defaultValue={40} onValueChange={onValueChange} />);

      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });

      expect(onValueChange.mock.calls[0]?.[1].reason).toBe('keyboard');
      expect(thumb().value).toBe('40');
    });

    it('hands an array back when it was given one, and a number when it was not', () => {
      const single = vi.fn();
      const { unmount } = render(<Slider defaultValue={40} onValueChange={single} />);
      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });
      expect(single.mock.calls[0]?.[0]).toBe(41);
      unmount();

      const range = vi.fn();
      render(<Slider defaultValue={[20, 80]} onValueChange={range} />);
      fireEvent.keyDown(thumb(0), { key: 'ArrowRight' });
      expect(range.mock.calls[0]?.[0]).toEqual([21, 80]);
    });

    /** A drag emits a hundred changes and one commit; a key press is both. */
    it('commits once per key press', () => {
      const onValueCommit = vi.fn();
      render(<Slider defaultValue={40} onValueCommit={onValueCommit} />);

      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });

      expect(onValueCommit).toHaveBeenCalledOnce();
      expect(onValueCommit.mock.calls[0]?.[1]).toBe('keyboard');
    });

    it('says nothing when the value would not change', () => {
      const onValueChange = vi.fn();
      render(<Slider defaultValue={100} onValueChange={onValueChange} />);

      fireEvent.keyDown(thumb(), { key: 'End' });

      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('follows a controlled value the consumer moved', () => {
      function Controlled() {
        const [value, setValue] = useState(10);
        return (
          <>
            <Slider onValueChange={(next) => setValue(next as number)} value={value} />
            <button onClick={() => setValue(70)} type="button">
              set
            </button>
          </>
        );
      }

      render(<Controlled />);
      fireEvent.click(screen.getByRole('button'));

      expect(thumb().value).toBe('70');
    });
  });

  describe('the field around it', () => {
    it('takes the identifier, the size and the shared states with nothing written', () => {
      render(
        <Field disabled invalid size="sm">
          <FieldLabel>Volume</FieldLabel>
          <Slider defaultValue={40} />
        </Field>,
      );

      const root = rootOf(thumb());
      expect(root).toHaveAttribute('data-size', 'sm');
      expect(root).toHaveAttribute('data-disabled', '');
      expect(root).toHaveAttribute('data-invalid', '');
      expect(thumb()).toBeDisabled();
      expect(thumb()).toHaveAccessibleName('Volume');
    });

    it('lets the control’s own state win over the field’s', () => {
      render(
        <Field disabled>
          <FieldLabel>Volume</FieldLabel>
          <Slider defaultValue={40} disabled={false} />
        </Field>,
      );

      expect(thumb()).not.toBeDisabled();
    });

    /**
     * `input[type=range]` is not in the list of types `readonly` applies to, so
     * the family answers the state itself and says so in the tree.
     */
    it('answers read-only where the platform cannot', () => {
      render(<Slider defaultValue={40} readOnly />);

      expect(thumb()).toHaveAttribute('aria-readonly', 'true');
      expect(thumb()).not.toHaveAttribute('readonly');
      expect(rootOf(thumb())).toHaveAttribute('data-readonly', '');
    });
  });

  describe('marks', () => {
    it('draws a tick per mark and marks the two at the ends of the scale', () => {
      render(<Slider defaultValue={50} marks={[0, 50, 100]} />);

      const marks = rootOf(thumb()).querySelectorAll('[data-part="mark"]');
      expect(marks).toHaveLength(3);
      expect(marks[0]).toHaveAttribute('data-edge', 'start');
      expect(marks[2]).toHaveAttribute('data-edge', 'end');
      expect(rootOf(thumb())).toHaveAttribute('data-marks', 'ticks');
    });

    it('says a scale is labelled only when a mark carries a label', () => {
      render(
        <Slider
          defaultValue={50}
          marks={[
            { value: 0, label: 'Low' },
            { value: 100, label: 'Alto' },
          ]}
        />,
      );

      expect(rootOf(thumb())).toHaveAttribute('data-marks', 'labelled');
    });

    /** The APG names `aria-valuetext` for exactly this. */
    it('announces a mark’s label in place of the number at that value', () => {
      render(
        <Slider
          defaultValue={50}
          marks={[
            { value: 0, label: 'Low' },
            { value: 50, label: 'Medium' },
          ]}
          step={50}
        />,
      );

      expect(thumb()).toHaveAttribute('aria-valuetext', 'Medium');

      fireEvent.keyDown(thumb(), { key: 'Home' });
      expect(thumb()).toHaveAttribute('aria-valuetext', 'Low');
    });
  });

  it('writes the value through Intl rather than as a bare number', () => {
    render(
      <Slider
        defaultValue={1480}
        format={{ currency: 'BRL', style: 'currency' }}
        locale="pt-BR"
        max={4000}
      />,
    );

    expect(thumb().getAttribute('aria-valuetext')).toContain('1.480');
    expect(partOf('output').textContent).toContain('1.480');
  });

  it('positions the fill and the thumbs from private properties', () => {
    render(<Slider defaultValue={[20, 80]} />);

    const [low, high] = Array.from(
      rootOf(thumb()).querySelectorAll('[data-part="thumb"]'),
    ) as HTMLElement[];
    expect(positionOf(low as HTMLElement)).toBe('20');
    expect(positionOf(high as HTMLElement)).toBe('80');

    const indicator = partOf('indicator');
    expect(indicator.style.getPropertyValue('--_start')).toBe('20');
    expect(indicator.style.getPropertyValue('--_end')).toBe('80');
  });

  it('fills outward from an origin a consumer names', () => {
    render(<Slider defaultValue={-6} max={10} min={-10} origin={0} />);

    const indicator = partOf('indicator');
    expect(indicator.style.getPropertyValue('--_start')).toBe('20');
    expect(indicator.style.getPropertyValue('--_end')).toBe('50');
  });

  it('withdraws the read-out and the bubble when the value is not a number to show', () => {
    render(<Slider defaultValue={40} valueLabel="none" />);

    expect(rootOf(thumb()).querySelector('[data-part="output"]')).toBeNull();
    expect(rootOf(thumb())).toHaveAttribute('data-value-label', 'none');
  });

  describe('composition', () => {
    it('lets an application set its defaults once', () => {
      render(
        <SliderDefaultsProvider orientation="vertical" size="lg" valueLabel="always">
          <Slider defaultValue={40} />
        </SliderDefaultsProvider>,
      );

      const root = rootOf(thumb());
      expect(root).toHaveAttribute('data-size', 'lg');
      expect(root).toHaveAttribute('data-orientation', 'vertical');
      expect(root).toHaveAttribute('data-value-label', 'always');
    });

    it('lets a prop win over the provider', () => {
      render(
        <SliderDefaultsProvider size="lg">
          <Slider defaultValue={40} size="sm" />
        </SliderDefaultsProvider>,
      );

      expect(rootOf(thumb())).toHaveAttribute('data-size', 'sm');
    });

    it('writes its value in the language in force, and an instance locale wins', () => {
      render(
        <SlottedProvider locale="de-DE">
          <Slider aria-label="Provider" defaultValue={1480} max={2000} />
          <Slider aria-label="Instance" defaultValue={1480} locale="en-US" max={2000} />
        </SlottedProvider>,
      );

      expect(screen.getByRole('slider', { name: 'Provider' })).toHaveAttribute(
        'aria-valuetext',
        '1.480',
      );
      expect(screen.getByRole('slider', { name: 'Instance' })).toHaveAttribute(
        'aria-valuetext',
        '1,480',
      );
    });

    it('renders the root into another element', () => {
      render(
        <Slider defaultValue={40} render={(props) => <section {...props} aria-label="Volume" />} />,
      );

      expect(rootOf(thumb()).tagName).toBe('SECTION');
    });

    it('reaches the first thumb through a ref and every thumb through the handle', () => {
      const ref = createRef<HTMLInputElement>();
      const handle = createRef<SliderHandle>();
      render(<Slider defaultValue={[20, 80]} handle={handle} ref={ref} />);

      expect(ref.current).toBe(thumb(0));

      handle.current?.focusThumb(1);
      expect(document.activeElement).toBe(thumb(1));
    });

    it('passes a native attribute through to every thumb', () => {
      render(<Slider data-testid="scale" defaultValue={[20, 80]} />);

      for (const element of thumbs()) expect(element).toHaveAttribute('data-testid', 'scale');
    });
  });
});
