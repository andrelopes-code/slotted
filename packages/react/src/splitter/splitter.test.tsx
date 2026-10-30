import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/splitter/contract.json';
import { Splitter } from './splitter';
import { SplitterDefaultsProvider } from './splitter-defaults';
import type { SplitterHandle, SplitterProps } from './splitter.types';

/**
 * jsdom performs no layout, so every rectangle it reports is nought. A
 * separator whose whole arithmetic is a fraction of a measured container
 * therefore cannot move at all here unless the container is given a size, and
 * a test that skipped this would be testing that nothing happens.
 */
function Workspace({ span = 800, ...props }: SplitterProps & { span?: number }) {
  const measure = (node: HTMLDivElement | null) => {
    if (node === null) return;
    node.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        width: span,
        height: span,
        top: 0,
        left: 0,
        right: span,
        bottom: span,
      }) as DOMRect;
  };

  return (
    <div ref={measure}>
      <aside data-testid="region">Contas</aside>
      <Splitter {...props} />
      <main>NF-e 20 483</main>
    </div>
  );
}

const bar = () => screen.getByRole('separator');

describe('anatomy', () => {
  it('renders the three parts the contract declares, and nothing else', () => {
    render(<Workspace />);

    expect(bar()).toHaveAttribute('data-ui', 'splitter');
    expect(bar()).toHaveAttribute('data-part', 'root');
    expect(bar().querySelectorAll('[data-part="line"]')).toHaveLength(2);
    expect(bar().querySelectorAll('[data-part="grip"]')).toHaveLength(1);
    expect(bar().children).toHaveLength(3);
  });

  it('hides its own picture from the accessibility tree', () => {
    render(<Workspace />);
    for (const child of bar().children) {
      expect(child).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('declares only the parts the contract declares', () => {
    render(<Workspace />);
    const rendered = new Set(
      [bar(), ...bar().querySelectorAll('[data-part]')].map((node) =>
        node.getAttribute('data-part'),
      ),
    );
    expect([...rendered].sort()).toEqual([...contract.members.splitter.parts].sort());
  });
});

describe('wiring', () => {
  it('is the focusable widget form of the separator role', () => {
    render(<Workspace />);
    expect(bar()).toHaveAttribute('tabindex', '0');
  });

  /**
   * `horizontal` is the attribute's own default on `role="separator"`, so the
   * family writes the departure and never the agreement — the rule `divider`
   * already follows.
   */
  it('writes aria-orientation for the vertical bar only', () => {
    const { rerender } = render(<Workspace orientation="vertical" />);
    expect(bar()).toHaveAttribute('aria-orientation', 'vertical');

    rerender(<Workspace orientation="horizontal" />);
    expect(bar()).not.toHaveAttribute('aria-orientation');
  });

  it('announces the fraction and its limits as the pattern asks, times a hundred', () => {
    render(<Workspace defaultValue={0.34} min={0.1} max={0.8} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '34');
    expect(bar()).toHaveAttribute('aria-valuemin', '10');
    expect(bar()).toHaveAttribute('aria-valuemax', '80');
  });

  /** The element it sizes and the element it announces are one element. */
  it('names the region it sizes, giving it an id when it has none', () => {
    render(<Workspace />);
    const region = screen.getByTestId('region');
    expect(region.id).not.toBe('');
    expect(bar()).toHaveAttribute('aria-controls', region.id);
  });

  it('keeps an id the consumer wrote', () => {
    render(
      <div>
        <aside id="contas" data-testid="region" />
        <Splitter />
      </div>,
    );
    expect(screen.getByTestId('region').id).toBe('contas');
  });
});

describe('the measure it publishes', () => {
  /**
   * This is what replaces the layout the family does not hold. A consumer
   * writing one rule against this property never holds the number in state.
   */
  it('writes the fraction on the region it sizes', () => {
    render(<Workspace defaultValue={0.34} />);
    expect(screen.getByTestId('region').style.getPropertyValue('--slotted-splitter-value')).toBe(
      '0.34',
    );
  });

  it('follows a controlled value', () => {
    const { rerender } = render(<Workspace value={0.2} />);
    expect(screen.getByTestId('region').style.getPropertyValue('--slotted-splitter-value')).toBe(
      '0.2',
    );

    rerender(<Workspace value={0.7} />);
    expect(screen.getByTestId('region').style.getPropertyValue('--slotted-splitter-value')).toBe(
      '0.7',
    );
  });

  it('takes the element `for` names over the previous sibling', () => {
    function Named() {
      const target = useRef<HTMLElement>(null);
      return (
        <div>
          <aside data-testid="sibling" />
          <section data-testid="named" ref={target} />
          <Splitter for={target} defaultValue={0.4} />
        </div>
      );
    }

    render(<Named />);
    expect(screen.getByTestId('named').style.getPropertyValue('--slotted-splitter-value')).toBe(
      '0.4',
    );
    expect(screen.getByTestId('sibling').style.getPropertyValue('--slotted-splitter-value')).toBe(
      '',
    );
  });
});

describe('the keyboard, against the pattern', () => {
  it('moves sixteen pixels on an arrow and sixty-four with Shift', () => {
    const onValueChange = vi.fn();
    render(<Workspace defaultValue={0.5} onValueChange={onValueChange} span={800} />);

    fireEvent.keyDown(bar(), { key: 'ArrowRight' });
    expect(onValueChange.mock.calls[0]?.[0]).toBeCloseTo(0.5 + 16 / 800);

    onValueChange.mockClear();
    fireEvent.keyDown(bar(), { key: 'ArrowLeft', shiftKey: true });
    expect(onValueChange.mock.calls[0]?.[0]).toBeCloseTo(0.52 - 64 / 800);
  });

  /**
   * "If the splitter is horizontal, it does not listen for Left Arrow or Right
   * Arrow so those keys can provide their normal browser scrolling functions."
   */
  it('leaves the cross axis to the page', () => {
    const onValueChange = vi.fn();
    render(<Workspace orientation="vertical" onValueChange={onValueChange} />);

    fireEvent.keyDown(bar(), { key: 'ArrowUp' });
    fireEvent.keyDown(bar(), { key: 'ArrowDown' });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('takes Home to the floor and End to the ceiling', () => {
    const onValueChange = vi.fn();
    render(<Workspace defaultValue={0.5} min={0.15} max={0.75} onValueChange={onValueChange} />);

    fireEvent.keyDown(bar(), { key: 'Home' });
    expect(onValueChange).toHaveBeenLastCalledWith(
      0.15,
      expect.objectContaining({ reason: 'keyboard' }),
    );

    fireEvent.keyDown(bar(), { key: 'End' });
    expect(onValueChange).toHaveBeenLastCalledWith(0.75, expect.anything());
  });

  /**
   * The pattern's own words: "If the primary pane is not collapsed, collapses
   * the pane. If the pane is collapsed, restores the splitter to its previous
   * position." It was the argument for holding panels, and a bar that owns the
   * value answers it without one.
   */
  it('collapses and restores on Enter', () => {
    const onValueChange = vi.fn();
    const onCollapsedChange = vi.fn();
    render(
      <Workspace
        collapsible
        defaultValue={0.42}
        onCollapsedChange={onCollapsedChange}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.keyDown(bar(), { key: 'Enter' });
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true, expect.anything());
    expect(onValueChange).toHaveBeenLastCalledWith(0, expect.anything());

    fireEvent.keyDown(bar(), { key: 'Enter' });
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false, expect.anything());
    expect(onValueChange).toHaveBeenLastCalledWith(0.42, expect.anything());
  });

  it('collapses to collapsedValue when one is given', () => {
    const onValueChange = vi.fn();
    render(
      <Workspace
        collapsible
        collapsedValue={0.06}
        defaultValue={0.4}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.keyDown(bar(), { key: 'Enter' });
    expect(onValueChange).toHaveBeenLastCalledWith(0.06, expect.anything());
  });

  it('does nothing on Enter when it is not collapsible', () => {
    const onCollapsedChange = vi.fn();
    render(<Workspace defaultValue={0.4} onCollapsedChange={onCollapsedChange} />);

    fireEvent.keyDown(bar(), { key: 'Enter' });
    expect(onCollapsedChange).not.toHaveBeenCalled();
  });

  it('marks a collapsible bar that is not collapsed', () => {
    render(<Workspace collapsible />);
    expect(bar()).toHaveAttribute('data-expanded');

    fireEvent.keyDown(bar(), { key: 'Enter' });
    expect(bar()).not.toHaveAttribute('data-expanded');
  });
});

describe('the request', () => {
  it('carries the reason, the previous value, and refuses when cancelled', () => {
    function Guarded() {
      const [value, setValue] = useState(0.5);
      return (
        <Workspace
          value={value}
          onValueChange={(next, request) => {
            if (next > 0.6) return request.cancel();
            setValue(next);
          }}
        />
      );
    }

    render(<Guarded />);
    fireEvent.keyDown(bar(), { key: 'End' });
    expect(bar()).toHaveAttribute('aria-valuenow', '50');

    fireEvent.keyDown(bar(), { key: 'Home' });
    expect(bar()).toHaveAttribute('aria-valuenow', '0');
  });

  it('names the reason a keyboard move carries', () => {
    const onValueChange = vi.fn();
    render(<Workspace onValueChange={onValueChange} />);

    fireEvent.keyDown(bar(), { key: 'Home' });
    expect(onValueChange.mock.calls[0]?.[1]).toMatchObject({ previous: 0.5, reason: 'keyboard' });
  });
});

describe('reset', () => {
  it('returns to defaultValue on a double click', () => {
    const onValueChange = vi.fn();
    render(<Workspace defaultValue={0.3} onValueChange={onValueChange} />);

    fireEvent.keyDown(bar(), { key: 'End' });
    fireEvent.doubleClick(bar());
    expect(onValueChange).toHaveBeenLastCalledWith(
      0.3,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });
});

describe('reset, inside the limits', () => {
  it('lands on max when defaultValue lies beyond it', () => {
    const onValueChange = vi.fn();
    render(<Workspace value={0.2} defaultValue={0.5} max={0.4} onValueChange={onValueChange} />);

    fireEvent.doubleClick(bar());
    expect(onValueChange).toHaveBeenLastCalledWith(
      0.4,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });
});

describe('the limits, held', () => {
  /** The contract's `extent.clamped`: the reported value is always the clamped one. */
  it('moves the value inside the limits when the limits move under it', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Workspace value={0.5} onValueChange={onValueChange} />);
    expect(onValueChange).not.toHaveBeenCalled();

    rerender(<Workspace value={0.5} max={0.3} onValueChange={onValueChange} />);
    expect(onValueChange).toHaveBeenLastCalledWith(
      0.3,
      expect.objectContaining({ reason: 'programmatic' }),
    );
  });

  it('moves the value inside the limits when the container shrinks under a length limit', () => {
    let notify: (() => void) | null = null;
    class ManualObserver {
      constructor(callback: () => void) {
        notify = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ManualObserver);
    // jsdom lays nothing out: a length is measured as the probe's box, which the stub gives.
    const create = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const element = create(tag);
      element.getBoundingClientRect = () => ({ width: 300, height: 0 }) as DOMRect;
      return element;
    }) as typeof document.createElement);
    try {
      const onValueChange = vi.fn();
      render(<Workspace value={0.5} min="300px" onValueChange={onValueChange} />);
      expect(onValueChange).not.toHaveBeenCalled();

      const workspace = bar().parentElement!;
      workspace.getBoundingClientRect = () =>
        ({
          x: 0,
          y: 0,
          width: 500,
          height: 500,
          top: 0,
          left: 0,
          right: 500,
          bottom: 500,
        }) as DOMRect;
      act(() => notify!());
      const [value, request] = onValueChange.mock.lastCall!;
      expect(value).toBeCloseTo(0.6, 5);
      expect(request).toEqual(expect.objectContaining({ reason: 'programmatic' }));
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    }
  });
});

describe('the drag', () => {
  function drag(from: number, to: number) {
    bar().setPointerCapture = () => undefined;
    fireEvent.pointerDown(bar(), { button: 0, clientX: from, clientY: 10 });
    bar().dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: to, clientY: 10 }));
    act(() => {
      bar().dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: to, clientY: 10 }));
    });
  }

  /**
   * The bar follows the hand from where it was taken: a bar grabbed twelve
   * pixels from the edge it marks does not leap twelve pixels on the first move.
   */
  it('keeps the point it was grabbed at under the pointer', () => {
    const onValueChange = vi.fn();
    render(<Workspace defaultValue={0.5} onValueChange={onValueChange} />);
    // 0.5 of 800 is 400: grabbed at 412, moved 100 to the right.
    drag(412, 512);
    expect(onValueChange.mock.lastCall![0]).toBeCloseTo(500 / 800, 5);
  });

  it('settles with the value the drag left it at, not the one it started from', () => {
    const onResizeEnd = vi.fn();
    render(<Workspace defaultValue={0.5} onResizeEnd={onResizeEnd} />);
    drag(400, 200);
    expect(onResizeEnd).toHaveBeenCalledWith(0.25);
  });
});

describe('disabled', () => {
  it('keeps the tab stop and the announcement, and refuses to move', () => {
    const onValueChange = vi.fn();
    render(<Workspace disabled defaultValue={0.4} onValueChange={onValueChange} />);

    expect(bar()).toHaveAttribute('tabindex', '0');
    expect(bar()).toHaveAttribute('aria-disabled', 'true');
    expect(bar()).toHaveAttribute('aria-valuenow', '40');
    expect(bar()).toHaveAttribute('data-disabled');

    fireEvent.keyDown(bar(), { key: 'Home' });
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('composition', () => {
  it('runs the consumer’s handler, and lets it refuse the family’s', () => {
    const onKeyDown = vi.fn((event: React.KeyboardEvent) => event.preventDefault());
    const onValueChange = vi.fn();
    render(<Workspace onKeyDown={onKeyDown} onValueChange={onValueChange} />);

    fireEvent.keyDown(bar(), { key: 'Home' });
    expect(onKeyDown).toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('substitutes the rendered element', () => {
    render(
      <div>
        <aside />
        <Splitter render={(props) => <section {...props} />} />
      </div>,
    );
    expect(bar().tagName).toBe('SECTION');
    /* The picture travels with the element: the bar's children are the bar. */
    expect(bar().querySelectorAll('[data-part="line"]')).toHaveLength(2);
  });

  it('passes native attributes through to the element that owns them', () => {
    render(<Workspace aria-label="Largura das contas" data-testid="separator" />);
    expect(bar()).toHaveAttribute('aria-label', 'Largura das contas');
    expect(bar()).toHaveAttribute('data-testid', 'separator');
  });
});

describe('defaults set once', () => {
  it('lets an application state the floor for every bar in it', () => {
    render(
      <SplitterDefaultsProvider min={0.25}>
        <Workspace />
      </SplitterDefaultsProvider>,
    );
    expect(bar()).toHaveAttribute('aria-valuemin', '25');
  });

  it('lets a bar that states its own win', () => {
    render(
      <SplitterDefaultsProvider min={0.25}>
        <Workspace min={0.05} />
      </SplitterDefaultsProvider>,
    );
    expect(bar()).toHaveAttribute('aria-valuemin', '5');
  });
});

describe('the handle', () => {
  it('collapses, expands and resets from code', () => {
    const onValueChange = vi.fn();

    function Controlled() {
      const handle = useRef<SplitterHandle>(null);
      return (
        <>
          <button onClick={() => handle.current?.collapse()}>collapse</button>
          <button onClick={() => handle.current?.expand()}>expand</button>
          <button onClick={() => handle.current?.reset()}>reset</button>
          <Workspace collapsible defaultValue={0.38} onValueChange={onValueChange} ref={handle} />
        </>
      );
    }

    render(<Controlled />);

    fireEvent.click(screen.getByText('collapse'));
    expect(onValueChange).toHaveBeenLastCalledWith(
      0,
      expect.objectContaining({ reason: 'programmatic' }),
    );

    fireEvent.click(screen.getByText('expand'));
    expect(onValueChange).toHaveBeenLastCalledWith(0.38, expect.anything());

    fireEvent.keyDown(bar(), { key: 'End' });
    fireEvent.click(screen.getByText('reset'));
    expect(onValueChange).toHaveBeenLastCalledWith(0.38, expect.anything());
  });

  it('gives the bar itself', () => {
    function Reached() {
      const handle = useRef<SplitterHandle>(null);
      return (
        <>
          <button onClick={() => handle.current?.focus()}>focus</button>
          <Workspace ref={handle} />
        </>
      );
    }

    render(<Reached />);
    fireEvent.click(screen.getByText('focus'));
    expect(document.activeElement).toBe(bar());
  });
});
