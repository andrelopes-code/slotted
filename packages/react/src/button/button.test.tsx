import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { SlottedProvider } from '../i18n';
import { Kbd } from '../kbd';
import { Button } from './button';
import { ButtonDefaultsProvider } from './button-defaults';

const defaults = contract.members.button.defaults;
/** The family stylesheet as written; jsdom applies no layered sheet, so its rules are matched by hand. */
const stylesheet = readFileSync(
  join(import.meta.dirname, '../../../styles/src/button/button.css'),
  'utf8',
);

describe('Button', () => {
  it('is the platform’s own button, carrying the family identity', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });

    expect(button.localName).toBe(contract.members.button.nativeElement);
    expect(button).toHaveAttribute('data-ui', contract.ui);
    expect(button).toHaveAttribute('data-part', 'root');
    expect(button).toHaveAttribute('type', defaults.type);
    expect(button).toHaveAttribute('data-tone', defaults.tone);
    expect(button).toHaveAttribute('data-variant', defaults.variant);
    expect(button).toHaveAttribute('data-size', defaults.size);
  });

  /**
   * A field trigger — a command launcher, an entry with its shortcut — sets
   * its label at the start and its end slot at the inline end. Centred
   * together, the two read as one word.
   */
  it('spreads the label and the end slot to opposite edges under justify between', () => {
    render(
      <Button fullWidth justify="between" end={<Kbd>N</Kbd>}>
        New
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-justify', 'between');
    const spread = [
      ...stylesheet
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .matchAll(/([^{}]+)\{[^{}]*justify-content:\s*space-between/g),
    ].map(([, selector]) => selector!.trim());
    expect(spread.some((selector) => button.matches(selector))).toBe(true);

    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute(
      'data-justify',
      defaults.justify,
    );
  });

  it('never announces itself as a toggle', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed');
  });

  it('forwards native attributes, events and the element itself', () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button form="settings" name="save" onClick={onClick} ref={ref} type="submit">
        Save
      </Button>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(ref.current?.name).toBe('save');
    expect(ref.current?.type).toBe('submit');
    expect(ref.current?.getAttribute('form')).toBe('settings');
  });

  it('renders the label part alone when there is no icon beside it', () => {
    render(<Button>Label</Button>);
    const parts = [...screen.getByRole('button').querySelectorAll('[data-part]')].map((part) =>
      part.getAttribute('data-part'),
    );

    expect(parts).toEqual(['label']);
  });

  it('renders start and end in the reading order the contract names', () => {
    render(
      <Button end="E" start="S">
        Label
      </Button>,
    );
    const parts = [...screen.getByRole('button').querySelectorAll('[data-part]')].map((part) =>
      part.getAttribute('data-part'),
    );

    expect(parts).toEqual(['start', 'label', 'end']);
  });

  it('leaves the disabled state to the platform', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });

    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-disabled', '');
    expect(onClick).not.toHaveBeenCalled();
  });

  /**
   * The name has to survive the wait. Hiding the label with `visibility` or
   * unmounting it would take it out of the accessibility tree, and the control
   * would be announced as unnamed exactly while it is working.
   */
  it('keeps its accessible name and its label while it waits', () => {
    render(<Button loading>Save changes</Button>);
    const button = screen.getByRole('button', { name: /Save changes/ });

    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-loading', '');
    expect(button.querySelector('[data-part="label"]')?.textContent).toBe('Save changes');
  });

  /**
   * A waiting control keeps its place in the tab sequence. Focus has to survive
   * an action the person just started, or the keyboard lands somewhere else
   * mid-task — which is why the refusal is `aria-disabled` and a blocked
   * activation rather than the attribute that removes the control.
   */
  it('stays focusable while it waits', () => {
    render(<Button loading>Save changes</Button>);
    const button = screen.getByRole('button', { name: /Save changes/ });

    expect(button).not.toBeDisabled();
    button.focus();
    expect(button).toHaveFocus();
  });

  it('refuses activation while it waits, before any handler the consumer attached', () => {
    const onClick = vi.fn();
    const onClickCapture = vi.fn();
    render(
      <Button loading onClick={onClick} onClickCapture={onClickCapture}>
        Save
      </Button>,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
    expect(onClickCapture).not.toHaveBeenCalled();
  });

  /**
   * The wait is announced by a named progress bar rather than by `aria-busy`,
   * which is not reliably announced on a button. The label stays at zero
   * opacity, so the two names combine and the person hears which action they
   * are waiting for.
   */
  it('announces the wait as a named progress bar', () => {
    const { rerender } = render(<Button>Save</Button>);
    expect(screen.queryByRole('progressbar')).toBeNull();

    rerender(
      <Button loading messages={{ loading: 'Saving' }}>
        Save
      </Button>,
    );
    const indicator = screen.getByRole('progressbar', { name: 'Saving' });

    expect(indicator).toHaveAttribute('data-part', 'indicator');
    /* The ring is the shared spinner, drawn once for every family that waits. */
    expect(indicator).toHaveAttribute('data-ui', 'spinner');
    expect(indicator).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByRole('button', { name: /Save/ })).toContainElement(indicator);
  });

  it('names the ring in the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Button loading>Save</Button>
      </SlottedProvider>,
    );

    expect(screen.getByRole('progressbar', { name: 'Carregando' })).toBeInTheDocument();
  });

  /**
   * The ring takes the first visual slot the control has, because that box was
   * already the size of it. The glyph fades under it rather than leaving, so
   * the control cannot change size and the label stays readable.
   */
  it('gives the ring the icon’s own box when the control has one', () => {
    render(
      <Button loading start={<svg data-testid="glyph" />}>
        Save
      </Button>,
    );
    const start = screen.getByRole('button').querySelector('[data-part="start"]');

    expect(start?.querySelector('[data-part="indicator"]')).not.toBeNull();
    expect(start?.querySelector('[data-testid="glyph"]')).not.toBeNull();
    expect(screen.getByRole('button').querySelector(':scope > [data-part="indicator"]')).toBeNull();
  });

  it('centres the ring over the label when the control has no visual slot', () => {
    render(<Button loading>Save</Button>);
    const root = screen.getByRole('button');

    expect(root.querySelector(':scope > [data-part="indicator"]')).not.toBeNull();
  });

  /**
   * The action is refused from the first millisecond; only the picture waits.
   * A spinner shown for ninety of them is a flash rather than a status.
   */
  it('delays the ring without letting the action through', async () => {
    vi.useFakeTimers();
    try {
      const onClick = vi.fn();
      render(
        <Button loading loadingDelay={300} onClick={onClick}>
          Save
        </Button>,
      );

      expect(screen.queryByRole('progressbar')).toBeNull();
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.getByRole('progressbar')).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  /**
   * Being unavailable and being unreachable are two decisions. A disabled
   * control in a toolbar that leaves the tab sequence takes its tooltip and
   * its explanation with it.
   */
  it('can be unavailable and still reachable by keyboard', () => {
    const onClick = vi.fn();
    render(
      <Button disabled focusableWhenDisabled onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button');

    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-disabled', '');
    button.focus();
    expect(button).toHaveFocus();

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  /** The consumer's own element, rendered with the root's own props. */
  it('hands the root props to a render function', () => {
    render(
      <Button render={(rootProps) => <button {...rootProps} data-analytics="save" />}>Save</Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });

    expect(button).toHaveAttribute('data-analytics', 'save');
    expect(button).toHaveAttribute('data-ui', 'button');
    expect(button).toHaveAttribute('data-part', 'root');
  });

  it('writes each declared axis and no state it is not in', () => {
    render(
      <Button fullWidth size="lg" tone="danger" variant="ghost">
        Delete
      </Button>,
    );
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('data-tone', 'danger');
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-size', 'lg');
    expect(button).toHaveAttribute('data-full-width', '');
    expect(button).not.toHaveAttribute('data-loading');
    expect(button).not.toHaveAttribute('data-disabled');
    expect(button).not.toHaveAttribute('data-shape');
  });

  it('keeps an explicit consumer value over the one it would derive', () => {
    render(
      <Button aria-busy="true" aria-label="Save the document">
        Save
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Save the document' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  /**
   * An application decides once, and an axis it leaves unset keeps each member
   * the default it was designed with. A button that states an axis itself
   * always wins: an explicit value is never overridden by context.
   */
  it('takes an application’s defaults, and yields to an explicit value', () => {
    render(
      <ButtonDefaultsProvider size="sm" tone="success">
        <Button>Inherits</Button>
        <Button tone="danger">States its own</Button>
      </ButtonDefaultsProvider>,
    );
    const [inherited, explicit] = screen.getAllByRole('button');

    expect(inherited).toHaveAttribute('data-size', 'sm');
    expect(inherited).toHaveAttribute('data-tone', 'success');
    expect(inherited).toHaveAttribute('data-variant', defaults.variant);
    expect(explicit).toHaveAttribute('data-tone', 'danger');
    expect(explicit).toHaveAttribute('data-size', 'sm');
  });
});
