import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/toggle-group/contract.json';
import { Field, FieldLabel } from '../field';
import { Toolbar } from '../toolbar';
import { ToggleGroup } from './toggle-group';
import { ToggleGroupDefaultsProvider } from './toggle-group-defaults';
import { ToggleGroupItem } from './toggle-group-parts';
import type { ToggleGroupProps } from './toggle-group.types';

const OPTIONS = ['day', 'week', 'month'];

const items = () => screen.getAllByRole('button') as HTMLButtonElement[];
const item = (index: number) => items()[index] as HTMLButtonElement;
const group = () => screen.getByRole('group');

function Range(props: Partial<ToggleGroupProps>) {
  return (
    <ToggleGroup aria-label="Chart range" {...props}>
      {OPTIONS.map((option) => (
        <ToggleGroupItem key={option} value={option}>
          {option}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

describe('ToggleGroup', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(<Range className="report-range" defaultValue={['week']} />);

    expect(group().tagName).toBe('DIV');
    expect(group()).toHaveAttribute('data-ui', contract.ui);
    expect(group()).toHaveAttribute('data-part', 'root');
    expect(group()).toHaveClass('report-range');

    expect(item(1).tagName).toBe('BUTTON');
    expect(item(1)).toHaveAttribute('data-part', 'item');
    expect(item(1).querySelector('[data-part="label"]')).toHaveTextContent('week');
  });

  /**
   * `aria-pressed` in both states, so the item is announced as a toggle rather
   * than as a button that happens to be pressed.
   */
  it('announces every item as a toggle, on and off alike', () => {
    render(<Range defaultValue={['week']} />);

    expect(item(0)).toHaveAttribute('aria-pressed', 'false');
    expect(item(1)).toHaveAttribute('aria-pressed', 'true');
    expect(item(1)).toHaveAttribute('data-pressed', '');
    expect(item(0)).not.toHaveAttribute('data-pressed');
    expect(item(0)).toHaveAttribute('type', 'button');
  });

  it('holds one value at a time, and moves it', () => {
    render(<Range defaultValue={['day']} />);

    fireEvent.click(item(2));

    expect(item(2)).toHaveAttribute('aria-pressed', 'true');
    expect(item(0)).toHaveAttribute('aria-pressed', 'false');
  });

  it('holds several at once when it is told to', () => {
    render(<Range defaultValue={['day']} multiple />);

    fireEvent.click(item(2));

    expect(item(0)).toHaveAttribute('aria-pressed', 'true');
    expect(item(2)).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(item(0));
    expect(item(0)).toHaveAttribute('aria-pressed', 'false');
  });

  it('empties when the last one on is pressed again, unless it may not', () => {
    const { rerender } = render(<Range defaultValue={['day']} />);
    fireEvent.click(item(0));
    expect(item(0)).toHaveAttribute('aria-pressed', 'false');

    rerender(<Range defaultValue={['day']} deselectable={false} />);
    fireEvent.click(item(0));
    expect(item(0)).toHaveAttribute('aria-pressed', 'true');
  });

  it('says why the value moved, what it was, and with which event', () => {
    const onValueChange = vi.fn();
    render(<Range defaultValue={['day']} onValueChange={onValueChange} />);

    fireEvent.click(item(1), { detail: 1 });
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(['week']);
    expect(onValueChange.mock.calls[0]?.[1].reason).toBe('pointer');
    expect(onValueChange.mock.calls[0]?.[1].previous).toEqual(['day']);

    fireEvent.click(item(2), { detail: 0 });
    expect(onValueChange.mock.calls[1]?.[1].reason).toBe('keyboard');
  });

  it('asks and waits while a consumer owns the value', () => {
    const onValueChange = vi.fn();
    render(<Range onValueChange={onValueChange} value={['day']} />);

    fireEvent.click(item(1));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(item(0)).toHaveAttribute('aria-pressed', 'true');
    expect(item(1)).toHaveAttribute('aria-pressed', 'false');
  });

  it('lets a consumer refuse a change before it commits', () => {
    render(
      <Range
        defaultValue={['day']}
        onValueChange={(_value, request) => {
          request.cancel();
        }}
      />,
    );

    fireEvent.click(item(1));

    expect(item(0)).toHaveAttribute('aria-pressed', 'true');
  });

  /**
   * The group holds one tab stop however many items it has, and the arrows
   * move focus between them. They never toggle: an item is a button, and the
   * Button pattern activates on `Space` and `Enter` alone.
   */
  it('holds one tab stop and moves focus with the arrows, without toggling', () => {
    render(<Range defaultValue={['day']} />);

    expect(item(0)).toHaveAttribute('tabindex', '0');
    expect(item(1)).toHaveAttribute('tabindex', '-1');

    item(0).focus();
    fireEvent.keyDown(item(0), { key: 'ArrowRight' });

    expect(document.activeElement).toBe(item(1));
    expect(item(1)).toHaveAttribute('tabindex', '0');
    expect(item(1)).toHaveAttribute('aria-pressed', 'false');
    expect(item(0)).toHaveAttribute('aria-pressed', 'true');
  });

  it('wraps at the ends, and stops wrapping when it is told to', () => {
    const { rerender } = render(<Range />);

    item(2).focus();
    fireEvent.keyDown(item(2), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(item(0));

    rerender(<Range loop={false} />);
    item(2).focus();
    fireEvent.keyDown(item(2), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(item(2));
  });

  it('moves to the first and last item with Home and End', () => {
    render(<Range />);

    item(1).focus();
    fireEvent.keyDown(item(1), { key: 'End' });
    expect(document.activeElement).toBe(item(2));

    fireEvent.keyDown(item(2), { key: 'Home' });
    expect(document.activeElement).toBe(item(0));
  });

  /** A horizontal group leaves the cross axis to the page's own scrolling. */
  it('leaves the cross axis alone in a horizontal group and takes it in a vertical one', () => {
    const { rerender } = render(<Range />);

    item(0).focus();
    fireEvent.keyDown(item(0), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(item(0));

    rerender(<Range orientation="vertical" />);
    item(0).focus();
    fireEvent.keyDown(item(0), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(item(1));
    expect(group()).toHaveAttribute('aria-orientation', 'vertical');
  });

  /**
   * `toolbar` deferred this capability here by name. A bar is one tab stop
   * with arrow navigation across every control it holds, so a group running a
   * second ring inside it would put two tab stops where the APG asks for one.
   */
  it('gives its keyboard up to the bar it is inside', async () => {
    render(
      <Toolbar aria-label="Formatting">
        <Range defaultValue={['day']} />
      </Toolbar>,
    );

    await vi.waitFor(() => {
      expect(item(0)).toHaveAttribute('tabindex', '0');
      expect(item(1)).toHaveAttribute('tabindex', '-1');
    });

    item(0).focus();
    fireEvent.keyDown(item(0), { key: 'ArrowRight' });
    /* The bar moved focus, and it did so across every control it holds. */
    expect(document.activeElement).toBe(item(1));
  });

  it('lets a consumer state the keyboard outright for a bar this library did not write', () => {
    render(<Range rovingFocus={false} />);

    expect(item(0)).not.toHaveAttribute('tabindex');
    expect(item(1)).not.toHaveAttribute('tabindex');
  });

  it('disables every item when the group is disabled, and one when it is not', () => {
    const { rerender } = render(<Range disabled />);
    for (const button of items()) expect(button.disabled).toBe(true);

    rerender(
      <ToggleGroup aria-label="Chart range">
        <ToggleGroupItem value="day">day</ToggleGroupItem>
        <ToggleGroupItem disabled value="week">
          week
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(item(0).disabled).toBe(false);
    expect(item(1).disabled).toBe(true);
    expect(item(1)).toHaveAttribute('data-disabled', '');
  });

  it('lets an application state its axes once, and one group outrank it', () => {
    const { rerender } = render(
      <ToggleGroupDefaultsProvider attached={false} size="sm" variant="ghost">
        <Range />
      </ToggleGroupDefaultsProvider>,
    );

    expect(group()).toHaveAttribute('data-size', 'sm');
    expect(group()).toHaveAttribute('data-variant', 'ghost');
    expect(group()).not.toHaveAttribute('data-attached');

    rerender(
      <ToggleGroupDefaultsProvider size="sm">
        <Range size="lg" />
      </ToggleGroupDefaultsProvider>,
    );
    expect(group()).toHaveAttribute('data-size', 'lg');
  });

  it('runs the consumer’s own handler before its own, and honours a refusal', () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    render(
      <ToggleGroup aria-label="Chart range" defaultValue={['day']}>
        <ToggleGroupItem value="day">day</ToggleGroupItem>
        <ToggleGroupItem onClick={onClick} value="week">
          week
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    fireEvent.click(item(1));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(item(1)).toHaveAttribute('aria-pressed', 'false');
  });

  it('hands the consumer the elements it wrote', () => {
    const root = createRef<HTMLDivElement>();
    const button = createRef<HTMLButtonElement>();
    render(
      <ToggleGroup aria-label="Chart range" ref={root}>
        <ToggleGroupItem ref={button} value="day">
          day
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(root.current).toBe(group());
    expect(button.current).toBe(item(0));
  });

  it('renders the root into another element without losing its identity', () => {
    render(
      <ToggleGroup aria-label="Chart range" render={(props) => <section {...props} />}>
        <ToggleGroupItem value="day">day</ToggleGroupItem>
      </ToggleGroup>,
    );

    const root = screen.getByRole('group');
    expect(root.tagName).toBe('SECTION');
    expect(root).toHaveAttribute('data-ui', contract.ui);
  });

  it('draws the mark an item was given, hidden from the reading order', () => {
    render(
      <ToggleGroup aria-label="Text style">
        <ToggleGroupItem aria-label="Bold" icon={<svg data-testid="bold" />} value="bold" />
      </ToggleGroup>,
    );

    const mark = screen.getByTestId('bold').parentElement as HTMLElement;
    expect(mark).toHaveAttribute('data-part', 'icon');
    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(item(0)).toHaveAccessibleName('Bold');
  });

  it('keeps a controlled value the consumer moves', () => {
    function Controlled() {
      const [value, setValue] = useState<readonly string[]>(['day']);
      return <Range onValueChange={setValue} value={value} />;
    }
    render(<Controlled />);

    fireEvent.click(item(2));

    expect(item(2)).toHaveAttribute('aria-pressed', 'true');
  });

  it('refuses to render an item outside a group', () => {
    const noise = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<ToggleGroupItem value="day">day</ToggleGroupItem>)).toThrow(
      /must be rendered inside a ToggleGroup/,
    );
    noise.mockRestore();
  });
});

/**
 * A short list of choices drawn as chips, the chosen one in ink: separate
 * items that wrap, never joined, inside a field named by its label.
 */
describe('the chips variant', () => {
  function Categories(props: Partial<ToggleGroupProps>) {
    return (
      <ToggleGroup {...props}>
        {['Home', 'Leisure', 'Health'].map((option) => (
          <ToggleGroupItem key={option} value={option}>
            {option}
          </ToggleGroupItem>
        ))}
        <ToggleGroupItem disabled value="Outros">
          Outros
        </ToggleGroupItem>
      </ToggleGroup>
    );
  }

  it('draws separate chips with one pressed, and never joins them', () => {
    render(<Categories aria-label="Categoria" defaultValue={['Leisure']} variant="chips" />);
    expect(group()).toHaveAttribute('data-variant', 'chips');
    expect(group()).not.toHaveAttribute('data-attached');
    expect(item(1)).toHaveAttribute('aria-pressed', 'true');
    expect(item(0)).toHaveAttribute('aria-pressed', 'false');
    expect(item(3)).toBeDisabled();
  });

  it('keeps one value at a time', () => {
    render(<Categories aria-label="Categoria" defaultValue={['Leisure']} variant="chips" />);
    fireEvent.click(item(0));
    expect(item(0)).toHaveAttribute('aria-pressed', 'true');
    expect(item(1)).toHaveAttribute('aria-pressed', 'false');
  });

  it('is named by the label of the field around it', () => {
    render(
      <Field>
        <FieldLabel>Categoria</FieldLabel>
        <Categories variant="chips" />
      </Field>,
    );
    expect(group()).toHaveAccessibleName('Categoria');
  });
});
