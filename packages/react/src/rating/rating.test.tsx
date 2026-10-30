import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render as renderUi, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/rating/contract.json';
import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { Rating } from './rating';
import { RatingProvider } from './rating-defaults';
import { RatingDisplay } from './rating-display';
import { RatingSummary } from './rating-summary';
import type { RatingHandle, RatingProps } from './rating.types';

const radios = () => screen.getAllByRole('radio') as HTMLInputElement[];
const radio = (value: number) =>
  radios().find((input) => Number(input.value) === value) as HTMLInputElement;
const group = () => screen.getByRole('radiogroup');
const part = (root: Element, name: string) =>
  root.querySelector(`[data-part="${name}"]`) as HTMLElement;

/** The family's own sentences are asserted in Brazilian Portuguese, the language the page is in. */
function Portuguese({ children }: { children?: ReactNode }) {
  return (
    <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
      {children}
    </SlottedProvider>
  );
}

const render = (ui: ReactElement) => renderUi(ui, { wrapper: Portuguese });

function Score(props: Partial<RatingProps>) {
  return <Rating aria-label="Rating" {...props} />;
}

/** Lays the row out as five symbols of 20 pixels from x = 100, which jsdom does not. */
function layRow() {
  const row = part(group(), 'symbols');
  row.getBoundingClientRect = () =>
    ({
      x: 100,
      y: 0,
      left: 100,
      top: 0,
      width: 100,
      height: 20,
      right: 200,
      bottom: 20,
    }) as DOMRect;
  return row;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Rating messages', () => {
  it('speaks English with no provider, and the language in force under one', () => {
    renderUi(<RatingDisplay count={0} value={3} />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Rated 3 out of 5, 0 ratings');
  });

  // language: pt-BR
  /** CLDR files nought under `one` in Portuguese; "0 avaliação" is not how a page in Brazil reads. */
  // language: en-US
  it('takes the exact branch before the plural rule', () => {
    render(<RatingDisplay count={0} value={0} />);
    // language: pt-BR
    expect(screen.getByRole('img')).toHaveAccessibleName('Avaliação 0 de 5, 0 avaliações');
    // language: en-US
  });
});

describe('Rating', () => {
  it('draws the harness anatomy: a radio group of items, each a radio, a symbol and a fill', () => {
    render(<Score className="page-score" defaultValue={4} />);

    expect(group().tagName).toBe('DIV');
    expect(group()).toHaveAttribute('data-ui', contract.ui);
    expect(group()).toHaveAttribute('data-part', 'root');
    expect(group()).toHaveAttribute('data-max', '5');
    expect(group()).toHaveClass('page-score');

    const row = part(group(), 'symbols');
    const items = [...row.children];
    expect(items).toHaveLength(5);
    for (const [index, item] of items.entries()) {
      expect(item).toHaveAttribute('data-part', 'item');
      const input = item.querySelector(':scope > input') as HTMLInputElement;
      expect(input).toHaveAttribute('data-part', 'input');
      expect(input).toHaveAttribute('type', 'radio');
      expect(input).toHaveAttribute('value', String(index + 1));
      for (const name of ['symbol', 'fill']) {
        const layer = item.querySelector(`:scope > [data-part="${name}"]`) as HTMLElement;
        const icon = layer.querySelector(':scope > [data-ui="icon"]');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(icon?.querySelector('svg[data-glyph]')).toHaveAttribute('data-glyph', 'star');
      }
    }
    expect(items[3]).toHaveAttribute('data-checked', '');
    expect(items[2]).not.toHaveAttribute('data-checked');
    expect(radio(4)).toBeChecked();
  });

  it('writes the contract’s defaults on every axis', () => {
    render(<Rating aria-label="Rating" />);
    const defaults = contract.members.rating.defaults;
    expect(group()).toHaveAttribute('data-size', defaults.size);
    expect(group()).toHaveAttribute('data-tone', defaults.tone);
    expect(radios()).toHaveLength(defaults.max);
    expect(group()).not.toHaveAttribute('data-step');
    expect(group()).toHaveAttribute('role', contract.rootRole.rating);
  });

  it('names every radio with the item label, in the locale’s digits', () => {
    render(<Score step={0.5} />);
    expect(radio(3.5)).toHaveAccessibleName('3,5 de 5');
    expect(radio(4)).toHaveAccessibleName('4 de 5');
    expect(contract.itemLabel.message).toBe('itemLabel');
  });

  it('puts two radios in each item at half steps, the half one first', () => {
    render(<Score defaultValue={3.5} step={0.5} />);

    expect(group()).toHaveAttribute('data-step', '0.5');
    expect(radios()).toHaveLength(10);
    const item = radio(3.5).parentElement as HTMLElement;
    const [half, whole] = [...item.querySelectorAll('input')];
    expect(half).toHaveAttribute(contract.halfAttribute, '');
    expect(half).toHaveAttribute('value', '3.5');
    expect(whole).not.toHaveAttribute(contract.halfAttribute);
    expect(whole).toHaveAttribute('value', '4');
    expect(item).toHaveAttribute('data-checked', '');
    expect(half).toBeChecked();
  });

  it('groups its radios by one generated name, or the consumer’s', () => {
    const { rerender } = render(<Rating aria-label="Rating" />);
    const names = new Set(radios().map((input) => input.name));
    expect(names.size).toBe(1);
    expect([...names][0]).toMatch(/^slotted-rating-/);
    expect(contract.generatesName).toBe(true);

    rerender(<Rating aria-label="Rating" form="review" name="score" />);
    for (const input of radios()) {
      expect(input).toHaveAttribute('name', 'score');
      expect(input).toHaveAttribute('form', 'review');
    }
  });

  it('asks before it moves, with the pointer as the reason', () => {
    const onValueChange = vi.fn();
    render(<Score onValueChange={onValueChange} />);

    fireEvent.click(radio(3), { detail: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith(
      3,
      expect.objectContaining({ previous: null, reason: 'pointer', value: 3 }),
    );
    expect(radio(3)).toBeChecked();
    expect(radio(3).parentElement).toHaveAttribute('data-checked', '');
  });

  it('empties the value when the checked radio is pressed again, with the reason clear', () => {
    const onValueChange = vi.fn();
    render(<Score defaultValue={3} onValueChange={onValueChange} />);

    fireEvent.click(radio(3), { detail: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ previous: 3, reason: 'clear' }),
    );
    expect(radios().some((input) => input.checked)).toBe(false);
  });

  it('keeps the value when the checked radio is pressed and clearing is off', () => {
    const onValueChange = vi.fn();
    render(<Score clearable={false} defaultValue={3} onValueChange={onValueChange} />);

    fireEvent.click(radio(3), { detail: 1 });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(radio(3)).toBeChecked();
  });

  it('emits nothing when the value asked for is the value held', () => {
    const onValueChange = vi.fn();
    render(<Score defaultValue={3} onValueChange={onValueChange} />);
    fireEvent.keyDown(radio(3), { key: 'ArrowRight' });
    fireEvent.keyDown(radio(4), { key: 'End' });
    fireEvent.keyDown(radio(5), { key: 'End' });
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it('keeps the value a controlled rating was given until the consumer moves it', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Score onValueChange={onValueChange} value={2} />);

    fireEvent.click(radio(4), { detail: 1 });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(radio(2)).toBeChecked();
    expect(radio(4)).not.toBeChecked();

    rerender(<Score onValueChange={onValueChange} value={null} />);
    expect(radios().some((input) => input.checked)).toBe(false);
  });

  it('answers a controlled consumer that moves the value', () => {
    function Controlled() {
      const [value, setValue] = useState<number | null>(1);
      return <Score onValueChange={setValue} value={value} />;
    }
    render(<Controlled />);
    fireEvent.click(radio(5), { detail: 1 });
    expect(radio(5)).toBeChecked();
    fireEvent.click(radio(5), { detail: 1 });
    expect(radio(5)).not.toBeChecked();
  });

  it('commits nothing when the request is cancelled', () => {
    render(<Score defaultValue={2} onValueChange={(_value, request) => request.cancel()} />);
    fireEvent.click(radio(4), { detail: 1 });
    expect(radio(2)).toBeChecked();
    fireEvent.keyDown(radio(2), { key: 'ArrowRight' });
    expect(radio(2)).toBeChecked();
  });

  it('puts the value on the grid of the scale', () => {
    const { rerender } = render(<Score defaultValue={7} />);
    expect(radio(5)).toBeChecked();
    rerender(<Score value={3.2} />);
    expect(radio(4)).toBeChecked();
    rerender(<Score value={Number.NaN} />);
    expect(radios().some((input) => input.checked)).toBe(false);
  });

  describe('keyboard', () => {
    it('moves one step with the arrows, stops at both ends, and follows the value with focus', () => {
      const onValueChange = vi.fn();
      render(<Score defaultValue={4} onValueChange={onValueChange} />);

      radio(4).focus();
      fireEvent.keyDown(radio(4), { key: 'ArrowRight' });
      expect(onValueChange).toHaveBeenLastCalledWith(
        5,
        expect.objectContaining({ reason: 'keyboard' }),
      );
      expect(radio(5)).toBeChecked();
      expect(radio(5)).toHaveFocus();

      fireEvent.keyDown(radio(5), { key: 'ArrowUp' });
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(contract.wraps).toBe(false);

      fireEvent.keyDown(radio(5), { key: 'Home' });
      expect(radio(1)).toBeChecked();
      expect(radio(1)).toHaveFocus();
      fireEvent.keyDown(radio(1), { key: 'ArrowLeft' });
      fireEvent.keyDown(radio(1), { key: 'ArrowDown' });
      expect(radio(1)).toBeChecked();

      fireEvent.keyDown(radio(1), { key: 'End' });
      expect(radio(5)).toBeChecked();
    });

    it('reverses the inline arrows in a right-to-left document', () => {
      render(
        <div dir="rtl">
          <Score defaultValue={3} />
        </div>,
      );
      fireEvent.keyDown(radio(3), { key: 'ArrowLeft' });
      expect(radio(4)).toBeChecked();
      fireEvent.keyDown(radio(4), { key: 'ArrowUp' });
      expect(radio(5)).toBeChecked();
    });

    it('steps by halves at half steps', () => {
      render(<Score defaultValue={3} step={0.5} />);
      fireEvent.keyDown(radio(3), { key: 'ArrowRight' });
      expect(radio(3.5)).toBeChecked();
      expect(radio(3.5)).toHaveFocus();
    });

    it('clears with Backspace and Delete, keeping focus where it was', () => {
      const onValueChange = vi.fn();
      render(<Score defaultValue={3} onValueChange={onValueChange} />);
      radio(3).focus();

      fireEvent.keyDown(radio(3), { key: 'Backspace' });
      expect(onValueChange).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ reason: 'clear' }),
      );
      expect(radios().some((input) => input.checked)).toBe(false);
      expect(radio(3)).toHaveFocus();
    });

    it('leaves Backspace and Delete to the platform when clearing is off', () => {
      const onValueChange = vi.fn();
      render(<Score clearable={false} defaultValue={3} onValueChange={onValueChange} />);
      const event = fireEvent.keyDown(radio(3), { key: 'Delete' });
      expect(event).toBe(true);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('runs the consumer’s own key handler, and lets it take the key', () => {
      const onKeyDown = vi.fn((event: { preventDefault(): void; key: string }) => {
        if (event.key === 'End') event.preventDefault();
      });
      render(<Score defaultValue={2} onKeyDown={onKeyDown} />);

      fireEvent.keyDown(radio(2), { key: 'ArrowRight' });
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(radio(3)).toBeChecked();

      fireEvent.keyDown(radio(3), { key: 'End' });
      expect(radio(3)).toBeChecked();
    });

    it('treats a click the keyboard synthesised as the keyboard', () => {
      const onValueChange = vi.fn();
      render(<Score onValueChange={onValueChange} />);
      fireEvent.click(radio(2), { detail: 0 });
      expect(onValueChange).toHaveBeenLastCalledWith(
        2,
        expect.objectContaining({ reason: 'keyboard' }),
      );
    });
  });

  describe('read-only and disabled', () => {
    it('refuses every change while read-only, and stays reachable', () => {
      const onValueChange = vi.fn();
      render(<Score defaultValue={4} onValueChange={onValueChange} readOnly />);

      const click = fireEvent.click(radio(2), { detail: 1 });
      expect(click).toBe(false);
      fireEvent.keyDown(radio(4), { key: 'ArrowLeft' });
      fireEvent.keyDown(radio(4), { key: 'Backspace' });
      expect(onValueChange).not.toHaveBeenCalled();
      expect(radio(4)).toBeChecked();
      expect(group()).toHaveAttribute('aria-readonly', 'true');
      expect(group()).toHaveAttribute('data-readonly', '');
      expect(radio(2)).not.toBeDisabled();
    });

    it('disables every radio through the platform', () => {
      render(<Score defaultValue={2} disabled />);
      for (const input of radios()) expect(input).toBeDisabled();
      expect(group()).toHaveAttribute('data-disabled', '');
    });

    it('writes required and invalid on the group, never on the radios', () => {
      render(<Score invalid required />);
      expect(group()).toHaveAttribute('aria-required', 'true');
      expect(group()).toHaveAttribute('aria-invalid', 'true');
      expect(group()).toHaveAttribute('data-invalid', '');
      expect(radio(1)).not.toHaveAttribute('required');
      expect(contract.requiredAttribute).toBe('aria-required');
    });
  });

  describe('pointer', () => {
    it('previews the value under the pointer and says nothing it owns has moved', () => {
      const onPreviewChange = vi.fn();
      const onValueChange = vi.fn();
      render(
        <Score
          caption={({ preview, value }) => `${preview ?? value ?? 'nada'}`}
          defaultValue={2}
          onPreviewChange={onPreviewChange}
          onValueChange={onValueChange}
        />,
      );
      const caption = group().querySelector(':scope > [data-part="value"]') as HTMLElement;
      expect(caption).toHaveAttribute('aria-hidden', 'true');
      expect(caption).toHaveTextContent('2');

      fireEvent.pointerOver(radio(4), { pointerType: 'mouse' });
      expect(onPreviewChange).toHaveBeenLastCalledWith(4);
      expect(caption).toHaveTextContent('4');

      fireEvent.pointerLeave(group(), { pointerType: 'mouse' });
      expect(onPreviewChange).toHaveBeenLastCalledWith(null);
      expect(caption).toHaveTextContent('2');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('previews nothing while read-only', () => {
      const onPreviewChange = vi.fn();
      render(<Score onPreviewChange={onPreviewChange} readOnly />);
      fireEvent.pointerOver(radio(4), { pointerType: 'mouse' });
      expect(onPreviewChange).not.toHaveBeenCalled();
    });

    it('scrubs the value with a finger dragged along the row, only when it changes', () => {
      const onValueChange = vi.fn();
      render(<Score onValueChange={onValueChange} />);
      const row = layRow();
      const capture = vi.fn();
      row.setPointerCapture = capture;
      row.hasPointerCapture = () => true;
      row.releasePointerCapture = () => undefined;

      fireEvent.pointerDown(radio(1), { pointerId: 7, pointerType: 'touch', clientX: 105 });
      expect(group()).toHaveAttribute('data-dragging', '');

      fireEvent.pointerMove(row, { pointerId: 7, pointerType: 'touch', clientX: 155 });
      expect(onValueChange).toHaveBeenLastCalledWith(
        3,
        expect.objectContaining({ reason: 'pointer' }),
      );
      expect(capture).toHaveBeenCalledWith(7);
      fireEvent.pointerMove(row, { pointerId: 7, pointerType: 'touch', clientX: 158 });
      expect(onValueChange).toHaveBeenCalledTimes(1);
      fireEvent.pointerMove(row, { pointerId: 7, pointerType: 'touch', clientX: 400 });
      expect(onValueChange).toHaveBeenLastCalledWith(5, expect.anything());
      expect(radio(5)).toBeChecked();

      fireEvent.pointerUp(row, { pointerId: 7, pointerType: 'touch', clientX: 400 });
      expect(group()).not.toHaveAttribute('data-dragging');
    });

    it('does not scrub with a mouse', () => {
      const onValueChange = vi.fn();
      render(<Score onValueChange={onValueChange} />);
      const row = layRow();

      fireEvent.pointerDown(radio(1), { pointerId: 1, pointerType: 'mouse', clientX: 105 });
      fireEvent.pointerMove(row, { pointerId: 1, pointerType: 'mouse', clientX: 190 });
      expect(onValueChange).not.toHaveBeenCalled();
      expect(group()).not.toHaveAttribute('data-dragging');
    });

    it('does not scrub while read-only', () => {
      const onValueChange = vi.fn();
      render(<Score onValueChange={onValueChange} readOnly />);
      const row = layRow();
      fireEvent.pointerDown(radio(1), { pointerId: 2, pointerType: 'pen', clientX: 105 });
      fireEvent.pointerMove(row, { pointerId: 2, pointerType: 'pen', clientX: 190 });
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('takes its state and name from the field around it', () => {
      render(
        <Field disabled invalid required size="lg">
          <FieldLabel>Nota</FieldLabel>
          <Rating />
        </Field>,
      );
      expect(group()).toHaveAttribute('aria-invalid', 'true');
      expect(group()).toHaveAttribute('aria-required', 'true');
      expect(group()).toHaveAttribute('data-size', 'lg');
      expect(group()).toHaveAccessibleName('Nota');
      expect(radio(1)).toBeDisabled();
    });

    it('lets a provider decide the defaults once, and the instance win', () => {
      render(
        <RatingProvider clearable={false} max={10} size="lg" tone="danger">
          <Rating
            aria-label="Um"
            defaultValue={2}
            messages={{ itemLabel: '{value} pontos de {max}' }}
          />
          <Rating aria-label="Dois" max={3} size="sm" tone="accent" />
        </RatingProvider>,
      );
      const [first, second] = screen.getAllByRole('radiogroup') as [HTMLElement, HTMLElement];
      expect(first).toHaveAttribute('data-size', 'lg');
      expect(first).toHaveAttribute('data-tone', 'danger');
      expect(first.querySelectorAll('input')).toHaveLength(10);
      expect(first.querySelector('input')).toHaveAccessibleName('1 pontos de 10');
      expect(second).toHaveAttribute('data-size', 'sm');
      expect(second).toHaveAttribute('data-tone', 'accent');
      expect(second.querySelectorAll('input')).toHaveLength(3);

      fireEvent.click(first.querySelectorAll('input')[1] as HTMLInputElement, { detail: 1 });
      expect(first.querySelectorAll('input')[1]).toBeChecked();
    });

    it('moves focus to the checked radio through its handle, or to the first', () => {
      const handle = createRef<RatingHandle>();
      const { rerender } = render(<Score defaultValue={3} handle={handle} />);
      handle.current?.focus();
      expect(radio(3)).toHaveFocus();

      rerender(<Score handle={handle} key="empty" />);
      handle.current?.focus();
      expect(radio(1)).toHaveFocus();
    });

    it('reaches the root with ref, and substitutes it with render', () => {
      const ref = createRef<HTMLDivElement>();
      const { rerender } = render(<Score ref={ref} />);
      expect(ref.current).toBe(group());

      rerender(<Score render={(props) => <fieldset {...props} />} />);
      expect(group().tagName).toBe('FIELDSET');
    });

    it('replaces the symbol with renderSymbol, in the symbol and in the fill', () => {
      render(
        <Score
          defaultValue={2}
          renderSymbol={({ fill, index }) => <b data-testid={`s${index}`}>{fill}</b>}
        />,
      );
      expect(screen.getAllByTestId('s1')).toHaveLength(2);
      expect(screen.getAllByTestId('s1')[0]).toHaveTextContent('1');
      expect(screen.getAllByTestId('s2')[0]).toHaveTextContent('0');
    });
  });
});

describe('RatingDisplay', () => {
  const display = () => screen.getByRole('img');

  it('draws each symbol lit by its own fraction, and names the value', () => {
    render(<RatingDisplay count={1284} locale="pt-BR" value={4.6} />);

    expect(display()).toHaveAttribute('data-ui', 'rating');
    expect(display()).toHaveAttribute('data-part', 'root');
    expect(display()).toHaveAttribute('data-size', contract.members.ratingDisplay.defaults.size);
    expect(display()).toHaveAttribute('data-tone', contract.members.ratingDisplay.defaults.tone);
    // language: pt-BR
    expect(display()).toHaveAccessibleName('Avaliação 4,6 de 5, 1.284 avaliações');
    // language: en-US

    const items = [...part(display(), 'symbols').children] as HTMLElement[];
    expect(items.map((item) => item.style.getPropertyValue(contract.fillProperty))).toEqual([
      '1',
      '1',
      '1',
      '1',
      '0.6',
    ]);
    expect(items[0]?.querySelector('input')).toBeNull();
    expect(part(items[0] as HTMLElement, 'fill')).not.toBeNull();
    expect(part(display(), 'value')).toHaveTextContent('4,6');
    expect(part(display(), 'value')).toHaveAttribute('aria-hidden', 'true');
    expect(part(display(), 'count')).toHaveTextContent('(1.284)');
  });

  it('names the value without a count, and hides the number on request', () => {
    render(<RatingDisplay locale="pt-BR" showValue={false} value={3.5} />);
    // language: pt-BR
    expect(display()).toHaveAccessibleName('Avaliação 3,5 de 5');
    // language: en-US
    expect(part(display(), 'value')).toBeNull();
    expect(part(display(), 'count')).toBeNull();
  });

  it('draws one star in the compact variant', () => {
    render(<RatingDisplay count={87} locale="pt-BR" value={3.2} variant="compact" />);
    expect(display()).toHaveAttribute('data-variant', 'compact');
    expect(part(display(), 'symbols').children).toHaveLength(1);
    expect(part(display(), 'value')).toHaveTextContent('3,2');
  });

  it('draws a bar per level against the largest in the histogram variant', () => {
    render(
      <RatingDisplay
        count={8}
        distribution={[3, 0, 1, 0, 4]}
        locale="pt-BR"
        value={3.25}
        variant="histogram"
      />,
    );
    const bars = [...part(display(), 'histogram').children] as HTMLElement[];
    expect(part(display(), 'histogram')).toHaveAttribute('aria-hidden', 'true');
    expect(bars.map((bar) => bar.getAttribute('data-part'))).toEqual(Array(5).fill('bar'));
    expect(bars.map((bar) => bar.style.getPropertyValue(contract.shareProperty))).toEqual([
      '0.75',
      '0',
      '0.25',
      '0',
      '1',
    ]);
    expect(part(display(), 'symbols').children).toHaveLength(1);
    expect(part(display(), 'count')).toHaveTextContent('8');
  });

  it('writes the count in the singular when there is one rating', () => {
    render(<RatingDisplay count={1} locale="pt-BR" value={5} />);
    // language: pt-BR
    expect(display()).toHaveAccessibleName('Avaliação 5 de 5, 1 avaliação');
    // language: en-US
  });

  it('clamps a value outside the scale', () => {
    render(<RatingDisplay locale="pt-BR" value={9} />);
    // language: pt-BR
    expect(display()).toHaveAccessibleName('Avaliação 5 de 5');
    // language: en-US
  });

  it('takes the provider’s defaults and lets the instance win', () => {
    render(
      <RatingProvider max={10} size="lg" tone="success">
        <RatingDisplay tone="accent" value={7} />
      </RatingProvider>,
    );
    expect(display()).toHaveAttribute('data-size', 'lg');
    expect(display()).toHaveAttribute('data-tone', 'accent');
    // language: pt-BR
    expect(display()).toHaveAccessibleName('Avaliação 7 de 10');
    // language: en-US
    expect(part(display(), 'symbols').children).toHaveLength(10);
  });
});

describe('RatingSummary', () => {
  const STRONG = [9, 18, 47, 158, 1052];
  const region = () => screen.getByRole('region');

  it('draws the bars variant: the aggregate, then one level per star, highest first', () => {
    render(<RatingSummary aria-label="Customer ratings" counts={STRONG} locale="pt-BR" />);

    expect(region().tagName).toBe('SECTION');
    expect(region()).toHaveAttribute('data-variant', 'summary');
    expect(region()).toHaveAttribute('data-size', contract.members.ratingSummary.defaults.size);
    expect(region()).toHaveAttribute('data-tone', contract.members.ratingSummary.defaults.tone);

    const aggregate = part(region(), 'aggregate');
    expect([...aggregate.children].map((child) => child.getAttribute('data-part'))).toEqual([
      'value',
      'scale',
      'root',
      'count',
    ]);
    expect(part(aggregate, 'value')).toHaveTextContent('4,7');
    expect(part(aggregate, 'scale')).toHaveTextContent('de 5');
    // language: pt-BR
    expect(part(aggregate, 'count')).toHaveTextContent('Com base em 1.284 avaliações');
    // language: en-US
    const stars = screen.getByRole('img');
    expect(stars).toHaveAttribute('data-size', 'sm');
    // language: pt-BR
    expect(stars).toHaveAccessibleName('Avaliação 4,7 de 5');
    // language: en-US
    expect(part(region(), 'insight')).toBeNull();

    const distribution = part(region(), 'distribution');
    expect(distribution.tagName).toBe('UL');
    // language: pt-BR
    expect(distribution).toHaveAccessibleName('Distribuição por estrelas');
    // language: en-US
    const levels = [...distribution.querySelectorAll('li > [data-part="level"]')] as HTMLElement[];
    expect(levels).toHaveLength(5);
    expect(levels[0]).toHaveAttribute('role', 'group');
    // language: pt-BR
    expect(levels[0]).toHaveAccessibleName('5 estrelas: 1.052 avaliações, 82%');
    // language: en-US
    expect(part(levels[0] as HTMLElement, 'level-label')).toHaveTextContent('5');
    expect(
      part(levels[0] as HTMLElement, 'level-label').querySelector('svg[data-glyph="star"]'),
    ).not.toBeNull();
    expect(part(levels[0] as HTMLElement, 'track')).toHaveAttribute('aria-hidden', 'true');
    expect(
      part(levels[0] as HTMLElement, 'indicator').style.getPropertyValue(contract.shareProperty),
    ).toBe('0.8193');
    expect(part(levels[0] as HTMLElement, 'level-count')).toHaveTextContent('1.052');
    expect(part(levels[4] as HTMLElement, 'level-count')).toHaveTextContent('9');
  });

  it('names each level with plurals and a whole percent', () => {
    render(<RatingSummary aria-label="Few" counts={[1, 0, 1, 0, 6]} locale="pt-BR" />);
    const levels = [...region().querySelectorAll('[data-part="level"]')];
    // language: pt-BR
    expect(levels[4]).toHaveAccessibleName('1 estrela: 1 avaliação, 13%');
    expect(levels[0]).toHaveAccessibleName('5 estrelas: 6 avaliações, 75%');
    // language: en-US
  });

  it('writes no figure and no scale when nothing has been rated', () => {
    render(<RatingSummary aria-label="No ratings" counts={[0, 0, 0, 0, 0]} locale="pt-BR" />);
    const aggregate = part(region(), 'aggregate');
    expect(part(aggregate, 'value')).toBeNull();
    expect(part(aggregate, 'scale')).toBeNull();
    // language: pt-BR
    expect(part(aggregate, 'count')).toHaveTextContent('Ainda sem avaliações');
    expect(screen.getByRole('img')).toHaveAccessibleName('Avaliação 0 de 5');
    // language: en-US
  });

  it('filters by level with pressed buttons, disabled where nobody rated', () => {
    const onSelectedLevelsChange = vi.fn();
    render(
      <RatingSummary
        aria-label="Filtrar"
        counts={[3, 0, 1, 0, 4]}
        filterable
        locale="pt-BR"
        onSelectedLevelsChange={onSelectedLevelsChange}
      />,
    );
    const five = screen.getByRole('button', { name: /^5 estrelas/ });
    const four = screen.getByRole('button', { name: /^4 estrelas/ });
    expect(five).toHaveAttribute('aria-pressed', 'false');
    expect(four).toBeDisabled();

    fireEvent.click(five, { detail: 1 });
    expect(onSelectedLevelsChange).toHaveBeenLastCalledWith(
      [5],
      expect.objectContaining({ reason: 'pointer', previous: [] }),
    );
    expect(five).toHaveAttribute('aria-pressed', 'true');
    expect(five).toHaveAttribute('data-pressed', '');

    fireEvent.click(screen.getByRole('button', { name: /^1 estrela:/ }), { detail: 0 });
    expect(onSelectedLevelsChange).toHaveBeenLastCalledWith(
      [1, 5],
      expect.objectContaining({ reason: 'keyboard' }),
    );

    fireEvent.click(five, { detail: 1 });
    expect(five).toHaveAttribute('aria-pressed', 'false');
    expect(five).not.toHaveAttribute('data-pressed');
  });

  it('keeps controlled levels until the consumer moves them, and cancels on request', () => {
    const onSelectedLevelsChange = vi.fn();
    const { rerender } = render(
      <RatingSummary
        aria-label="Filtrar"
        counts={STRONG}
        filterable
        locale="pt-BR"
        onSelectedLevelsChange={onSelectedLevelsChange}
        selectedLevels={[5]}
      />,
    );
    const four = () => screen.getByRole('button', { name: /^4 estrelas/ });
    fireEvent.click(four(), { detail: 1 });
    expect(onSelectedLevelsChange).toHaveBeenCalledWith([4, 5], expect.anything());
    expect(four()).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <RatingSummary
        aria-label="Filtrar"
        counts={STRONG}
        filterable
        locale="pt-BR"
        onSelectedLevelsChange={onSelectedLevelsChange}
        selectedLevels={[4, 5]}
      />,
    );
    expect(four()).toHaveAttribute('aria-pressed', 'true');
  });

  it('commits nothing when an uncontrolled request is cancelled', () => {
    render(
      <RatingSummary
        counts={STRONG}
        defaultSelectedLevels={[2]}
        filterable
        locale="pt-BR"
        onSelectedLevelsChange={(_levels, request) => request.cancel()}
      />,
    );
    const two = screen.getByRole('button', { name: /^2 estrelas/ });
    expect(two).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(two, { detail: 1 });
    expect(two).toHaveAttribute('aria-pressed', 'true');
  });

  it('draws the spectrum: columns over an axis, the mean, its interval and a conclusion', () => {
    render(<RatingSummary aria-label="Resumo" counts={STRONG} locale="pt-BR" variant="spectrum" />);
    expect(region()).toHaveAttribute('data-variant', 'spectrum');
    const [mean, low, high] = contract.meanProperties as [string, string, string];
    expect(Number(region().style.getPropertyValue(mean))).toBeCloseTo(4.734, 2);
    expect(Number(region().style.getPropertyValue(low))).toBeLessThan(
      Number(region().style.getPropertyValue(mean)),
    );
    expect(Number(region().style.getPropertyValue(high))).toBeGreaterThan(
      Number(region().style.getPropertyValue(mean)),
    );

    const aggregate = part(region(), 'aggregate');
    expect([...aggregate.children].map((child) => child.getAttribute('data-part'))).toEqual([
      'value',
      'scale',
      'insight',
      'count',
    ]);
    expect(part(aggregate, 'insight')).toHaveTextContent(PT_BR.rating.consensus as string);
    expect(part(aggregate, 'insight')).toHaveAttribute(
      'data-tone',
      contract.insight.tone.consensus,
    );
    // language: pt-BR
    expect(part(aggregate, 'count')).toHaveTextContent('1.284 avaliações · margem de ± 0,04');
    // language: en-US

    const columns = [...part(region(), 'columns').children] as HTMLElement[];
    expect(columns.map((column) => column.getAttribute('data-part'))).toEqual(
      Array(5).fill('column'),
    );
    // language: pt-BR
    expect(columns[0]).toHaveAccessibleName('1 estrela: 9 avaliações, 1%');
    // language: en-US
    expect(columns[4]?.style.getPropertyValue(contract.shareProperty)).toBe('1');
    expect(columns[0]?.style.getPropertyValue(contract.shareProperty)).toBe('0.0086');
    expect(part(columns[0] as HTMLElement, 'bar')).not.toBeNull();
    expect(part(region(), 'interval')).toHaveAttribute('aria-hidden', 'true');
    expect(part(region(), 'mean-label')).toHaveTextContent('4,7');

    const ticks = [...part(region(), 'axis').children] as HTMLElement[];
    expect(part(region(), 'axis')).toHaveAttribute('aria-hidden', 'true');
    expect(ticks).toHaveLength(5);
    expect(part(ticks[4] as HTMLElement, 'tick-label')).toHaveTextContent('5');
    expect(part(ticks[4] as HTMLElement, 'tick-share')).toHaveTextContent('82%');

    const buckets = [...part(region(), 'sentiment').children] as HTMLElement[];
    expect(buckets.map((bucket) => bucket.getAttribute('data-tone'))).toEqual([
      'success',
      'secondary',
      'danger',
    ]);
    expect(buckets[0]).toHaveTextContent('94% positivas');
    expect(buckets[0]?.querySelector('strong')).toHaveTextContent('94%');
    expect(part(buckets[0] as HTMLElement, 'swatch')).toHaveAttribute('aria-hidden', 'true');
  });

  it('says the mean is uncertain when the margin is half a star or more', () => {
    render(
      <RatingSummary
        aria-label="Resumo"
        counts={[3, 0, 1, 0, 4]}
        locale="pt-BR"
        variant="spectrum"
      />,
    );
    // language: pt-BR
    expect(part(region(), 'insight')).toHaveTextContent('Opiniões divididas');
    // language: en-US
    expect(part(region(), 'insight')).toHaveAttribute('data-tone', 'warning');
    expect(part(region(), 'count')).toHaveTextContent(
      // language: pt-BR
      '8 avaliações · média incerta, entre 2,0 e 4,5',
      // language: en-US
    );
    /* CLDR files nought under `one` in Portuguese; the exact branch answers first. */
    const columns = [...part(region(), 'columns').children] as HTMLElement[];
    // language: pt-BR
    expect(columns[1]).toHaveAccessibleName('2 estrelas: 0 avaliações, 0%');
    // language: en-US
  });

  it('shows the conclusion only in the spectrum', () => {
    render(<RatingSummary aria-label="Resumo" counts={STRONG} locale="pt-BR" />);
    expect(part(region(), 'insight')).toBeNull();
    expect(contract.insight.shownIn).toBe('spectrum');
  });

  it('draws no mean, interval or buckets in a spectrum nobody rated', () => {
    render(
      <RatingSummary
        aria-label="Resumo"
        counts={[0, 0, 0, 0, 0]}
        locale="pt-BR"
        variant="spectrum"
      />,
    );
    for (const name of [
      'mean',
      'mean-label',
      'interval',
      'sentiment',
      'bucket',
      'value',
      'scale',
    ]) {
      expect(part(region(), name)).toBeNull();
    }
    for (const property of contract.meanProperties) {
      expect(region().style.getPropertyValue(property)).toBe('');
    }
    expect(part(region(), 'axis').children).toHaveLength(5);
  });

  it('hides the conclusion on request and when nothing has been rated', () => {
    const { rerender } = render(
      <RatingSummary aria-label="Resumo" counts={STRONG} showInsight={false} variant="spectrum" />,
    );
    expect(part(region(), 'insight')).toBeNull();
    rerender(
      <RatingSummary
        aria-label="Resumo"
        counts={[0, 0, 0, 0, 0]}
        locale="pt-BR"
        variant="spectrum"
      />,
    );
    expect(part(region(), 'insight')).toBeNull();
    expect(part(region(), 'value')).toBeNull();
    // language: pt-BR
    expect(part(region(), 'count')).toHaveTextContent('Ainda sem avaliações');
    // language: en-US
  });

  it('draws spectrum columns as pressed buttons when it filters', () => {
    render(
      <RatingSummary
        counts={[3, 0, 1, 0, 4]}
        defaultSelectedLevels={[1]}
        filterable
        locale="pt-BR"
        variant="spectrum"
      />,
    );
    const one = screen.getByRole('button', { name: /^1 estrela:/ });
    expect(one).toHaveAttribute('data-part', 'column');
    expect(one).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^2 estrelas/ })).toBeDisabled();
  });

  it('reads the provider’s thresholds and its own messages', () => {
    render(
      <RatingProvider insightThresholds={{ few: 5000 }}>
        <RatingSummary
          aria-label="Resumo"
          counts={STRONG}
          messages={{ few: 'Amostra pequena' }}
          variant="spectrum"
        />
      </RatingProvider>,
    );
    expect(part(region(), 'insight')).toHaveTextContent('Amostra pequena');
    expect(part(region(), 'insight')).toHaveAttribute('data-tone', contract.insight.tone.few);
  });
});
