import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/toggle/contract.json';
import { Toolbar } from '../toolbar';
import { Toggle } from './toggle';
import { ToggleDefaultsProvider } from './toggle-defaults';

const control = () => screen.getByRole('button') as HTMLButtonElement;

describe('Toggle', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(
      <Toggle className="wrap" icon={<svg />}>
        Wrap
      </Toggle>,
    );

    expect(control().tagName).toBe('BUTTON');
    expect(control()).toHaveAttribute('data-ui', contract.ui);
    expect(control()).toHaveAttribute('data-part', 'root');
    expect(control()).toHaveClass('wrap');
    expect(control()).toHaveAttribute('type', 'button');
    expect(control().querySelector('[data-part="icon"]')).toHaveAttribute('aria-hidden', 'true');
    expect(control().querySelector('[data-part="label"]')).toHaveTextContent('Wrap');
  });

  /**
   * `aria-pressed` in both states, so the control is announced as a toggle
   * rather than as a button that happens to be pressed — and the label stays.
   */
  it('announces itself as a toggle in both states and keeps its label', () => {
    render(<Toggle>Wrap</Toggle>);

    expect(control()).toHaveAttribute('aria-pressed', 'false');
    expect(control()).not.toHaveAttribute('data-pressed');
    fireEvent.click(control());
    expect(control()).toHaveAttribute('aria-pressed', 'true');
    expect(control()).toHaveAttribute('data-pressed', '');
    expect(control()).toHaveTextContent('Wrap');
  });

  it('starts from defaultPressed and moves on its own when uncontrolled', () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle defaultPressed onPressedChange={onPressedChange}>
        Wrap
      </Toggle>,
    );

    expect(control()).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(control(), { detail: 1 });
    expect(control()).toHaveAttribute('aria-pressed', 'false');
    expect(onPressedChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ previous: true, reason: 'pointer' }),
    );
  });

  it('asks and waits when controlled', () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle onPressedChange={onPressedChange} pressed={false}>
        Wrap
      </Toggle>,
    );

    fireEvent.click(control(), { detail: 1 });
    expect(onPressedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(control()).toHaveAttribute('aria-pressed', 'false');
  });

  it('follows the consumer’s next value in controlled mode', () => {
    function Owner() {
      const [pressed, setPressed] = useState(false);
      return (
        <Toggle onPressedChange={setPressed} pressed={pressed}>
          Wrap
        </Toggle>
      );
    }
    render(<Owner />);

    fireEvent.click(control());
    expect(control()).toHaveAttribute('aria-pressed', 'true');
  });

  /** A click the keyboard synthesises carries no detail, and the reason says so. */
  it('tells a keyboard activation from a pointer one', () => {
    const onPressedChange = vi.fn();
    render(<Toggle onPressedChange={onPressedChange}>Wrap</Toggle>);

    fireEvent.click(control(), { detail: 0 });
    expect(onPressedChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'keyboard' }),
    );
    fireEvent.click(control(), { detail: 1 });
    expect(onPressedChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('runs the consumer’s handler first and moves nothing when it prevents default', () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle onClick={(event) => event.preventDefault()} onPressedChange={onPressedChange}>
        Wrap
      </Toggle>,
    );

    fireEvent.click(control());
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(control()).toHaveAttribute('aria-pressed', 'false');
  });

  it('is disabled natively, and says so in the DOM', () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle disabled onPressedChange={onPressedChange}>
        Wrap
      </Toggle>,
    );

    expect(control()).toBeDisabled();
    expect(control()).toHaveAttribute('data-disabled', '');
    fireEvent.click(control());
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it('resolves size and variant from the prop, then the provider, then the contract', () => {
    const { rerender } = render(<Toggle>Wrap</Toggle>);
    expect(control()).toHaveAttribute('data-size', contract.members.toggle.defaults.size);
    expect(control()).toHaveAttribute('data-variant', contract.members.toggle.defaults.variant);

    rerender(
      <ToggleDefaultsProvider size="sm" variant="ghost">
        <Toggle>Wrap</Toggle>
      </ToggleDefaultsProvider>,
    );
    expect(control()).toHaveAttribute('data-size', 'sm');
    expect(control()).toHaveAttribute('data-variant', 'ghost');

    rerender(
      <ToggleDefaultsProvider size="sm" variant="ghost">
        <Toggle size="lg" variant="outline">
          Wrap
        </Toggle>
      </ToggleDefaultsProvider>,
    );
    expect(control()).toHaveAttribute('data-size', 'lg');
    expect(control()).toHaveAttribute('data-variant', 'outline');
  });

  it('draws square with the consumer’s name when it has no words', () => {
    render(<Toggle aria-label="Bold" icon={<svg />} />);

    expect(control()).toHaveAccessibleName('Bold');
    expect(control().querySelector('[data-part="label"]')).toBeNull();
  });

  it('reaches the native element and passes native attributes through', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Toggle data-testid="wrap" name="wrap" ref={ref} type="submit" value="on">
        Wrap
      </Toggle>,
    );

    expect(ref.current).toBe(control());
    expect(control()).toHaveAttribute('name', 'wrap');
    expect(control()).toHaveAttribute('value', 'on');
    expect(control()).toHaveAttribute('type', 'submit');
  });

  it('renders the consumer’s own element through render and keeps the wiring', () => {
    render(<Toggle render={(props) => <button {...props} data-testid="own" type="button" />} />);

    const own = screen.getByTestId('own');
    expect(own).toHaveAttribute('data-ui', 'toggle');
    expect(own).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(own);
    expect(own).toHaveAttribute('aria-pressed', 'true');
  });

  /** Inside a bar the toggle is one of its controls: the bar owns the tab stop. */
  it('is one control of a toolbar and writes no keyboard of its own', async () => {
    render(
      <Toolbar aria-label="Editor">
        <Toggle aria-label="Bold" icon={<svg />} />
        <Toggle aria-label="Italic" icon={<svg />} />
      </Toolbar>,
    );

    const [bold, italic] = screen.getAllByRole('button') as [HTMLButtonElement, HTMLButtonElement];
    await vi.waitFor(() => {
      expect(bold).toHaveAttribute('tabindex', '0');
      expect(italic).toHaveAttribute('tabindex', '-1');
    });

    bold.focus();
    fireEvent.keyDown(bold, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(italic);
  });

  it('declares in the contract every state it writes', () => {
    expect(contract.stateModel.pressed).toEqual({
      controlled: 'pressed',
      uncontrolled: 'defaultPressed',
      request: 'onPressedChange',
      reasons: ['pointer', 'keyboard'],
    });
    expect(contract.stateAttributes).toEqual({
      pressed: 'data-pressed',
      disabled: 'data-disabled',
    });
  });
});
