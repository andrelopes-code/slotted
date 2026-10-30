import { fireEvent, render, screen } from '@testing-library/react';
import { Profiler, useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/accordion/contract.json';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '../collapsible';
import { Accordion } from './accordion';
import { AccordionDefaultsProvider } from './accordion-defaults';
import type { AccordionHandle, AccordionProps } from './accordion.types';

const SECTIONS = [
  { title: 'Delivery', value: 'delivery' },
  { title: 'Payment', value: 'payment' },
  { title: 'Invoice', value: 'invoice' },
];

function Basic({
  sections = SECTIONS,
  ...props
}: Partial<AccordionProps> & { sections?: typeof SECTIONS }) {
  return (
    <Accordion {...props}>
      {sections.map((section) => (
        <Collapsible key={section.value} value={section.value}>
          <CollapsibleHeader>
            <CollapsibleTrigger>{section.title}</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>panel {section.value}</CollapsiblePanel>
        </Collapsible>
      ))}
    </Accordion>
  );
}

const root = () => document.querySelector('[data-ui="accordion"]') as HTMLElement;
const triggers = () => screen.getAllByRole('button');
const items = () => [...document.querySelectorAll('[data-ui="collapsible"]')];
const openValues = () =>
  items()
    .filter((item) => item.hasAttribute('data-open'))
    .map((item) => item.getAttribute('data-value'));
const press = (element: HTMLElement, key: string) => fireEvent.keyDown(element, { key });

describe('Accordion', () => {
  it('renders its one part and holds the items as their own family', () => {
    render(<Basic />);

    expect(contract.members.accordion.parts).toEqual(['root']);
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(items()).toHaveLength(3);
    expect(root()).not.toHaveAttribute('role');
  });

  it('opens one panel at a time by default and closes the one that was', () => {
    const onValueChange = vi.fn();
    render(<Basic defaultValue={['delivery']} onValueChange={onValueChange} />);

    fireEvent.click(triggers()[1] as HTMLElement, { detail: 1 });

    expect(openValues()).toEqual(['payment']);
    expect(onValueChange).toHaveBeenLastCalledWith(
      ['payment'],
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('keeps every open panel while several may be open', () => {
    render(<Basic multiple defaultValue={['delivery']} />);

    fireEvent.click(triggers()[1] as HTMLElement);

    expect(openValues()).toEqual(['delivery', 'payment']);
  });

  it('empties the set when the last open panel is closed', () => {
    render(<Basic defaultValue={['delivery']} />);

    fireEvent.click(triggers()[0] as HTMLElement);

    expect(openValues()).toEqual([]);
  });

  /**
   * "If the accordion panel associated with an accordion header is visible, and
   * if the accordion does not permit the panel to be collapsed, the header
   * button element has aria-disabled set to true."
   */
  describe('requireOpen', () => {
    it('marks the header it refuses to let close, and refuses it', () => {
      render(<Basic requireOpen defaultValue={['delivery']} />);

      expect(triggers()[0]).toHaveAttribute('aria-disabled', 'true');
      expect(triggers()[1]).not.toHaveAttribute('aria-disabled');

      fireEvent.click(triggers()[0] as HTMLElement);
      expect(openValues()).toEqual(['delivery']);
    });

    it('still moves the one open panel to another header', () => {
      render(<Basic requireOpen defaultValue={['delivery']} />);

      fireEvent.click(triggers()[2] as HTMLElement);

      expect(openValues()).toEqual(['invoice']);
      expect(triggers()[2]).toHaveAttribute('aria-disabled', 'true');
    });
  });

  /**
   * The pattern's own sentence: "all focusable elements in the accordion are
   * included in the page Tab sequence". `w3c/aria-practices#3434` removed the
   * roving alternative, so the arrows are additive and write no tabindex.
   */
  describe('keyboard', () => {
    it('leaves every header in the page tab sequence', () => {
      render(<Basic />);
      for (const header of triggers()) expect(header).not.toHaveAttribute('tabindex');
    });

    it('moves focus with the arrows and opens nothing', () => {
      render(<Basic />);

      (triggers()[0] as HTMLElement).focus();
      press(triggers()[0] as HTMLElement, 'ArrowDown');

      expect(document.activeElement).toBe(triggers()[1]);
      expect(openValues()).toEqual([]);
    });

    it('wraps at the ends, and clamps when looping is off', () => {
      const { unmount } = render(<Basic />);
      press(triggers()[2] as HTMLElement, 'ArrowDown');
      expect(document.activeElement).toBe(triggers()[0]);
      unmount();

      render(<Basic loop={false} />);
      (triggers()[2] as HTMLElement).focus();
      press(triggers()[2] as HTMLElement, 'ArrowDown');
      expect(document.activeElement).toBe(triggers()[2]);
    });

    it('reaches the first and last header', () => {
      render(<Basic />);

      press(triggers()[1] as HTMLElement, 'End');
      expect(document.activeElement).toBe(triggers()[2]);

      press(triggers()[2] as HTMLElement, 'Home');
      expect(document.activeElement).toBe(triggers()[0]);
    });

    /** A nested set is two accordions, and neither arrows into the other. */
    it('keeps a nested set out of the outer arrow ring', () => {
      render(
        <Accordion>
          <Collapsible value="outer" defaultOpen>
            <CollapsibleHeader>
              <CollapsibleTrigger>Externo</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>
              <Accordion>
                <Collapsible value="inner">
                  <CollapsibleHeader>
                    <CollapsibleTrigger>Inner</CollapsibleTrigger>
                  </CollapsibleHeader>
                  <CollapsiblePanel>content</CollapsiblePanel>
                </Collapsible>
              </Accordion>
            </CollapsiblePanel>
          </Collapsible>
        </Accordion>,
      );

      const outer = screen.getByRole('button', { name: 'Externo' });
      outer.focus();
      press(outer, 'ArrowDown');

      /* The outer set holds one header, so the wrap lands back on it rather
         than reaching down into the inner set. */
      expect(document.activeElement).toBe(outer);
    });
  });

  it('hands each item the variant the set maps onto it', () => {
    for (const [variant, expected] of Object.entries(contract.variantMapping)) {
      if (variant === 'reason') continue;
      const { unmount } = render(<Basic variant={variant as never} />);
      expect(root()).toHaveAttribute('data-variant', variant);
      expect(items()[0]).toHaveAttribute('data-variant', expected as string);
      unmount();
    }
  });

  it('reaches every item with the set disabled', () => {
    render(<Basic disabled />);

    expect(root()).toHaveAttribute('data-disabled');
    for (const header of triggers()) expect(header).toBeDisabled();
  });

  it('stays where the consumer puts it while controlled', () => {
    const onValueChange = vi.fn();
    render(<Basic value={['delivery']} onValueChange={onValueChange} />);

    fireEvent.click(triggers()[1] as HTMLElement);

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(openValues()).toEqual(['delivery']);
  });

  it('emits no request when the value would not move', () => {
    const onValueChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState<readonly string[]>(['delivery']);
      return (
        <Basic
          value={value}
          onValueChange={(next, request) => {
            onValueChange(next, request);
            setValue(next);
          }}
        />
      );
    }
    render(<Controlled />);

    fireEvent.click(triggers()[0] as HTMLElement);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    fireEvent.click(triggers()[0] as HTMLElement);
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  describe('the imperative pair', () => {
    function WithHandle({ ...props }: Partial<AccordionProps>) {
      const handle = useRef<AccordionHandle>(null);
      return (
        <>
          <button type="button" onClick={() => handle.current?.openAll()}>
            open all
          </button>
          <button type="button" onClick={() => handle.current?.closeAll()}>
            close all
          </button>
          <Basic handle={handle} {...props} />
        </>
      );
    }

    it('opens and closes every panel, with the reason programmatic', () => {
      const onValueChange = vi.fn();
      render(<WithHandle multiple onValueChange={onValueChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'open all' }));
      expect(openValues()).toEqual(['delivery', 'payment', 'invoice']);
      expect(onValueChange).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ reason: 'programmatic' }),
      );

      fireEvent.click(screen.getByRole('button', { name: 'close all' }));
      expect(openValues()).toEqual([]);
    });

    it('leaves one open when the set may not empty', () => {
      render(<WithHandle multiple requireOpen defaultValue={['delivery', 'payment']} />);

      fireEvent.click(screen.getByRole('button', { name: 'close all' }));

      expect(openValues()).toEqual(['delivery']);
    });

    it('opens only the first while one panel may be open', () => {
      render(<WithHandle />);

      fireEvent.click(screen.getByRole('button', { name: 'open all' }));

      expect(openValues()).toEqual(['delivery']);
    });
  });

  it("lets the consumer's own value win over the provider", () => {
    render(
      <AccordionDefaultsProvider size="sm" variant="separated">
        <Basic size="lg" />
      </AccordionDefaultsProvider>,
    );

    expect(root()).toHaveAttribute('data-size', 'lg');
    expect(root()).toHaveAttribute('data-variant', 'separated');
  });

  it('substitutes the rendered element of the set', () => {
    render(<Basic render={(props) => <section {...props} />} />);
    expect(document.querySelector('section[data-ui="accordion"]')).not.toBeNull();
  });

  it('hands the heading level to every item', () => {
    render(<Basic headingLevel="2" />);
    expect(document.querySelectorAll('h2[data-part="header"]')).toHaveLength(3);
  });
});

const OPERATIONS = Array.from({ length: 50 }, (_unused, index) => `operation-${index}`);

function Operations({ onCommit }: { onCommit?: () => void }) {
  return (
    <Profiler id="operations" onRender={() => onCommit?.()}>
      <Accordion mount="active">
        {OPERATIONS.map((operation) => (
          <Collapsible key={operation} value={operation}>
            <CollapsibleHeader>
              <CollapsibleTrigger>{operation}</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>
              <p>{operation}</p>
            </CollapsiblePanel>
          </Collapsible>
        ))}
      </Accordion>
    </Profiler>
  );
}

/**
 * A page listing one disclosure per API operation paid about seven
 * milliseconds per closed item. Three causes, each removed: the accordion and
 * every panel held their own element in state, so attaching it rendered the
 * whole set a second and a third time; and the arrow engine read every
 * trigger's computed style as it was created and again on the mutation the
 * mount caused. In jsdom the median mount went from 184–495 ms to 78–87 ms;
 * the time is not asserted, because a loaded machine moves it past any bound.
 */
describe('Accordion, the cost of fifty closed items', () => {
  it('mounts them in one commit and reads no computed style', () => {
    let commits = 0;
    const styles = vi.spyOn(window, 'getComputedStyle');
    const { unmount } = render(<Operations onCommit={() => (commits += 1)} />);

    expect(commits).toBe(1);
    expect(styles).not.toHaveBeenCalled();
    expect(document.querySelectorAll('[data-part="content"]')).toHaveLength(0);
    styles.mockRestore();
    unmount();
  });
});
