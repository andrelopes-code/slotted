import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/tooltip/contract.json';
import { IconButton } from '../button';
import { Tooltip } from './tooltip';
import { TooltipDefaultsProvider } from './tooltip-defaults';
import { TooltipArrow, TooltipContent, TooltipLayer, TooltipTrigger } from './tooltip-parts';
import type { TooltipHandle, TooltipProps } from './tooltip.types';

function Basic({
  label = 'Save draft',
  hint = 'Saves without publishing',
  ...props
}: Partial<TooltipProps> & { label?: string; hint?: string }) {
  return (
    <Tooltip {...props}>
      <TooltipTrigger>{label}</TooltipTrigger>
      <TooltipLayer>
        <TooltipContent>{hint}</TooltipContent>
        <TooltipArrow />
      </TooltipLayer>
    </Tooltip>
  );
}

const layer = () => document.querySelector('[data-ui="tooltip"]');
const trigger = () => screen.getByRole('button');
const hint = () => document.querySelector('[role="tooltip"]');

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

/** Hover has to be two events: the family listens for the pointer, not the mouse. */
function hover(element: Element) {
  fireEvent.pointerEnter(element, { pointerType: 'mouse' });
}
function unhover(element: Element) {
  fireEvent.pointerLeave(element, { pointerType: 'mouse' });
}

describe('Tooltip', () => {
  it('renders the anatomy the contract declares, and nothing before it opens', async () => {
    render(<Basic defaultOpen />);

    await waitFor(() => expect(layer()).not.toBeNull());
    expect(layer()?.getAttribute('data-part')).toBe('root');
    expect(hint()?.getAttribute('data-part')).toBe('content');
    expect(document.querySelector('[data-part="arrow"]')).not.toBeNull();
    expect(contract.members.tooltip.parts).toEqual(['root', 'content', 'arrow']);
  });

  /**
   * `mount="active"` is the default, so a tooltip nobody has hovered costs a
   * trigger and nothing else. The layer is what carries the portal, the
   * positioner and the layer stack, and none of them exist until it does.
   */
  /**
   * The stylesheet selects the arrow as a direct child of the layer, so an
   * arrow written inside the content is an unstyled div — which is what the
   * first rendered reference page showed, and no offline test could see.
   */
  it('keeps the arrow beside the content rather than inside it', async () => {
    render(<Basic defaultOpen />);
    await waitFor(() => expect(layer()).not.toBeNull());

    const arrow = document.querySelector('[data-part="arrow"]');
    expect(arrow?.parentElement).toBe(layer());
  });

  it('builds no layer at all until it is opened', () => {
    render(<Basic />);
    expect(layer()).toBeNull();
  });

  it('waits the open delay on hover, and closes after the close delay', async () => {
    render(<Basic openDelay={600} closeDelay={150} />);

    hover(trigger());
    expect(layer()).toBeNull();

    act(() => void vi.advanceTimersByTime(599));
    expect(layer()).toBeNull();

    act(() => void vi.advanceTimersByTime(1));
    await waitFor(() => expect(layer()).not.toBeNull());

    unhover(trigger());
    act(() => void vi.advanceTimersByTime(149));
    expect(layer()).not.toBeNull();

    act(() => void vi.advanceTimersByTime(1));
    await waitFor(() => expect(layer()).toBeNull());
  });

  /**
   * A delay a reader cannot shorten by moving faster is a delay for nothing, so
   * keyboard focus opens in the same task.
   */
  it('opens instantly on keyboard focus and closes when focus leaves', async () => {
    render(<Basic openDelay={600} />);

    const button = trigger();
    button.focus();
    fireEvent.focus(button);
    await waitFor(() => expect(layer()).not.toBeNull());

    fireEvent.blur(button);
    await waitFor(() => expect(layer()).toBeNull());
  });

  /**
   * The window that stops a row of icon buttons charging the warmup once per
   * button. It lives on the provider, because a value held per tooltip could
   * not say what "the next one" is.
   */
  it('opens the next tooltip in the group instantly', async () => {
    render(
      <TooltipDefaultsProvider groupDelay={400} openDelay={600}>
        <Basic label="First" hint="One" />
        <Basic label="Second" hint="Two" />
      </TooltipDefaultsProvider>,
    );

    const [first, second] = screen.getAllByRole('button');
    hover(first as HTMLElement);
    act(() => void vi.advanceTimersByTime(600));
    await waitFor(() => expect(document.body.textContent).toContain('One'));

    unhover(first as HTMLElement);
    act(() => void vi.advanceTimersByTime(150));
    await waitFor(() => expect(document.body.textContent).not.toContain('One'));

    hover(second as HTMLElement);
    await waitFor(() => expect(document.body.textContent).toContain('Two'));
  });

  it('writes aria-describedby while open, and aria-labelledby under describes="label"', async () => {
    const { rerender } = render(<Basic defaultOpen />);
    await waitFor(() => expect(hint()).not.toBeNull());
    expect(trigger().getAttribute('aria-describedby')).toBe(hint()?.id);
    expect(trigger().getAttribute('aria-labelledby')).toBeNull();

    rerender(<Basic defaultOpen describes="label" />);
    await waitFor(() => expect(trigger().getAttribute('aria-labelledby')).toBe(hint()?.id));
    expect(trigger().getAttribute('aria-describedby')).toBeNull();
  });

  /**
   * The hint over a name cut by its box, and nothing over a name that fits. The
   * measurement is taken when the hint would open rather than watched, so the
   * same trigger answers differently after its column is dragged wider.
   */
  it('opens over a cut name alone under whenClipped', async () => {
    function measure(element: Element, { client, scroll }: { client: number; scroll: number }) {
      Object.defineProperty(element, 'clientWidth', { configurable: true, value: client });
      Object.defineProperty(element, 'scrollWidth', { configurable: true, value: scroll });
    }

    render(<Basic openDelay={0} whenClipped />);
    /* jsdom does not expand the `overflow` shorthand, so the axis is written. */
    trigger().style.overflowX = 'hidden';

    measure(trigger(), { client: 120, scroll: 120 });
    hover(trigger());
    expect(layer()).toBeNull();

    measure(trigger(), { client: 48, scroll: 120 });
    hover(trigger());
    await waitFor(() => expect(hint()?.textContent).toBe('Saves without publishing'));
  });

  /**
   * A hint that repeats words the trigger already carries — the full name of a
   * column whose header is clipped — is read twice under either reference.
   */
  it('references nothing and hides the hint under describes="none"', async () => {
    render(<Basic defaultOpen describes="none" />);
    await waitFor(() => expect(hint()).not.toBeNull());
    expect(trigger().getAttribute('aria-describedby')).toBeNull();
    expect(trigger().getAttribute('aria-labelledby')).toBeNull();
    expect(hint()?.getAttribute('aria-hidden')).toBe('true');
  });

  /**
   * Under `label` the layer is the trigger's accessible name, so it has to be
   * in the document before anyone opens it. Anything else is a button silently
   * announced as "button".
   */
  it('keeps the layer mounted while it is the accessible name', () => {
    render(<Basic describes="label" mount="active" />);
    expect(hint()).not.toBeNull();
    expect(layer()?.hasAttribute('data-open')).toBe(false);
    expect(trigger().getAttribute('aria-labelledby')).toBe(hint()?.id);
  });

  it('carries every reason the contract declares, and cancels a request', async () => {
    const seen: string[] = [];
    render(
      <Basic
        defaultOpen
        onOpenChange={(_open, request) => {
          seen.push(request.reason);
          if (request.reason === 'escape') request.cancel();
        }}
      />,
    );
    await waitFor(() => expect(layer()).not.toBeNull());

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(seen).toContain('escape');
    expect(layer()).not.toBeNull();

    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(layer()).toBeNull());
    expect(seen).toContain('pointer');
    expect(contract.stateModel.open.reasons).toContain('escape');
  });

  /**
   * A press on the trigger is not an outside press: the trigger is registered
   * as a branch of the layer, so the family closes on it deliberately with the
   * reason `pointer` rather than by accident with `outsidePress`.
   */
  it('never reports outsidePress, which is not in its vocabulary', async () => {
    const onOpenChange = vi.fn();
    render(<Basic defaultOpen onOpenChange={onOpenChange} />);
    await waitFor(() => expect(layer()).not.toBeNull());

    fireEvent.pointerDown(trigger(), { pointerType: 'mouse' });
    expect(onOpenChange).toHaveBeenCalled();
    for (const call of onOpenChange.mock.calls) {
      expect(call[1].reason).not.toBe('outsidePress');
    }
    expect(contract.stateModel.open.reasons).not.toContain('outsidePress');
  });

  it('stays where a controlled consumer put it', async () => {
    function Controlled() {
      const [open] = useState(true);
      return <Basic open={open} />;
    }
    render(<Controlled />);
    await waitFor(() => expect(layer()).not.toBeNull());

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(layer()).not.toBeNull());
  });

  it('never opens while it is disabled', () => {
    render(<Basic defaultOpen disabled />);
    expect(layer()).toBeNull();
    expect(trigger().hasAttribute('data-open')).toBe(false);
  });

  /**
   * A rail hint is disabled while the navigation is expanded and enabled in the
   * rail. A hover while disabled has to leave nothing behind, or every hint
   * hovered in the expanded navigation appears at once when it collapses.
   */
  it('keeps no open state from a hover while disabled, once it is enabled again', async () => {
    const { rerender } = render(<Basic disabled openDelay={600} closeDelay={150} />);

    hover(trigger());
    act(() => void vi.advanceTimersByTime(600));
    unhover(trigger());
    act(() => void vi.advanceTimersByTime(150));

    rerender(<Basic openDelay={600} closeDelay={150} />);
    await act(async () => {});
    expect(layer()).toBeNull();
    expect(trigger().hasAttribute('data-open')).toBe(false);
  });

  it('drops its own open state when it becomes disabled', async () => {
    const { rerender } = render(<Basic defaultOpen />);
    await waitFor(() => expect(layer()).not.toBeNull());

    rerender(<Basic defaultOpen disabled />);
    rerender(<Basic defaultOpen />);
    await act(async () => {});
    expect(trigger().hasAttribute('data-open')).toBe(false);
  });

  it('opens and closes from the handle, without a delay', async () => {
    function WithHandle() {
      const handle = useRef<TooltipHandle>(null);
      return (
        <>
          <button type="button" onClick={() => handle.current?.open()}>
            open it
          </button>
          <Basic ref={handle} openDelay={600} />
        </>
      );
    }
    render(<WithHandle />);

    fireEvent.click(screen.getByText('open it'));
    await waitFor(() => expect(layer()).not.toBeNull());
  });

  it('runs the consumer own handler beside the family one', () => {
    const own = vi.fn();
    render(
      <Tooltip>
        <TooltipTrigger onPointerEnter={own}>Save</TooltipTrigger>
        <TooltipLayer>
          <TooltipContent>Hint</TooltipContent>
        </TooltipLayer>
      </Tooltip>,
    );
    hover(trigger());
    expect(own).toHaveBeenCalledTimes(1);
  });

  /**
   * The icon-only button is the most common tooltip trigger, and under
   * describes="label" its only name is the tooltip. IconButton requires a name
   * at the type level, so the trigger's props have to state the reference they
   * carry: the composition below is checked by `tsc` as well as here.
   */
  it('names an IconButton under describes="label", with no aria-label written', () => {
    render(
      <Tooltip describes="label">
        <TooltipTrigger
          render={(props) => (
            <IconButton {...props}>
              <svg />
            </IconButton>
          )}
        />
        <TooltipLayer>
          <TooltipContent>Copy tracking number</TooltipContent>
        </TooltipLayer>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Copy tracking number' })).toBeInTheDocument();
  });

  it('keeps an aria-labelledby the consumer wrote on the trigger', () => {
    render(
      <Tooltip>
        <TooltipTrigger aria-labelledby="own-name">Copy</TooltipTrigger>
        <TooltipLayer>
          <TooltipContent>Copies the order number</TooltipContent>
        </TooltipLayer>
      </Tooltip>,
    );
    expect(trigger().getAttribute('aria-labelledby')).toBe('own-name');
  });

  it('renders the trigger into an element the consumer supplies', () => {
    render(
      <Tooltip>
        <TooltipTrigger
          render={({ ref, ...props }) => (
            <a href="#anchor" {...props} ref={ref as Ref<HTMLAnchorElement>}>
              A link
            </a>
          )}
        />
        <TooltipLayer>
          <TooltipContent>Hint</TooltipContent>
        </TooltipLayer>
      </Tooltip>,
    );
    expect(screen.getByRole('link').getAttribute('href')).toBe('#anchor');
  });

  it('takes its defaults from the provider, and the consumer still wins', async () => {
    render(
      <TooltipDefaultsProvider size="sm" variant="surface">
        <Basic defaultOpen />
        <Basic defaultOpen variant="inverse" label="Second" hint="Two" />
      </TooltipDefaultsProvider>,
    );
    await waitFor(() => expect(document.querySelectorAll('[data-ui="tooltip"]')).toHaveLength(2));

    const layers = [...document.querySelectorAll('[data-ui="tooltip"]')];
    expect(layers[0]?.getAttribute('data-variant')).toBe('surface');
    expect(layers[0]?.getAttribute('data-size')).toBe('sm');
    expect(layers[1]?.getAttribute('data-variant')).toBe('inverse');
  });
});
