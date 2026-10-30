import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/popover/contract.json';
import { SlottedProvider } from '../i18n';
import { Popover } from './popover';
import { PopoverDefaultsProvider } from './popover-defaults';
import {
  PopoverAnchor,
  PopoverArrow,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
} from './popover-parts';
import type { PopoverHandle, PopoverProps } from './popover.types';

function Basic({ label = 'Filters', ...props }: Partial<PopoverProps> & { label?: string }) {
  return (
    <Popover {...props}>
      <PopoverTrigger>{label}</PopoverTrigger>
      <PopoverLayer>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Filter invoices</PopoverTitle>
            <PopoverDescription>Applies to the current view only.</PopoverDescription>
            <PopoverClose />
          </PopoverHeader>
          <PopoverBody>
            <input aria-label="Search" />
          </PopoverBody>
          <PopoverFooter>
            <button type="button">Apply</button>
          </PopoverFooter>
        </PopoverContent>
        <PopoverArrow />
      </PopoverLayer>
    </Popover>
  );
}

const layer = () => document.querySelector('[data-ui="popover"]');
const panel = () => document.querySelector('[role="dialog"]') as HTMLElement | null;
const trigger = () => screen.getByRole('button', { name: 'Filters' });
const guards = () => document.querySelectorAll('[data-part="focus-guard"]');

describe('Popover', () => {
  it('renders every part the contract declares', async () => {
    render(<Basic defaultOpen />);
    await waitFor(() => expect(layer()).not.toBeNull());

    const present = contract.members.popover.parts.filter(
      (part) => document.querySelector(`[data-part="${part}"]`) !== null,
    );
    expect(present).toEqual(contract.members.popover.parts);
  });

  /**
   * The stylesheet selects the arrow as a direct child of the layer, so an
   * arrow written inside the panel is an unstyled div — which is exactly what
   * the first rendered reference page showed, and no offline test could see.
   */
  it('keeps the arrow beside the panel rather than inside it', async () => {
    render(<Basic defaultOpen />);
    await waitFor(() => expect(layer()).not.toBeNull());

    const arrow = document.querySelector('[data-part="arrow"]');
    expect(arrow?.parentElement).toBe(layer());
  });

  /**
   * The consumer's explicit value wins, as `frameworks.md` requires of every
   * family: `hover-card` writes `presentation` on a card nothing can enter.
   */
  it('lets the consumer\u2019s role win over dialog', async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverLayer>
          <PopoverContent role="presentation">Preview</PopoverContent>
        </PopoverLayer>
      </Popover>,
    );
    await waitFor(() => expect(layer()).not.toBeNull());
    expect(document.querySelector('[data-part="content"]')?.getAttribute('role')).toBe(
      'presentation',
    );
  });

  it('builds nothing until it is opened', () => {
    render(<Basic />);
    expect(layer()).toBeNull();
  });

  it('opens and closes from the trigger, and says so on it', async () => {
    render(<Basic />);
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');

    fireEvent.click(trigger());
    await waitFor(() => expect(layer()).not.toBeNull());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(panel()?.id);

    fireEvent.click(trigger());
    await waitFor(() => expect(layer()).toBeNull());
  });

  /**
   * An `aria-controls` naming an id that is not in the document references
   * nothing, so the trigger names the panel only while the panel exists.
   */
  it('names the panel in aria-controls only while the panel exists', async () => {
    render(<Basic />);
    expect(trigger().hasAttribute('aria-controls')).toBe(false);

    fireEvent.click(trigger());
    await waitFor(() => expect(panel()).not.toBeNull());
    expect(trigger().getAttribute('aria-controls')).toBe(panel()?.id);

    fireEvent.click(trigger());
    await waitFor(() => expect(layer()).toBeNull());
    expect(trigger().hasAttribute('aria-controls')).toBe(false);
  });

  /**
   * The layer's padding is the gap around the panel, so a layer aligned to
   * the anchor's start edge would leave the panel one gap inside it. The layer
   * moves out by its own padding, and the panel's edge meets the anchor's.
   * In jsdom every rectangle is empty, so `left` is that offset alone.
   */
  it.each([
    ['start', '-8px'],
    ['center', '0px'],
    ['end', '8px'],
  ] as const)('lines the panel up with the anchor under align="%s"', async (align, left) => {
    render(
      <Popover align={align} defaultOpen flip={false} shift={false}>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverLayer style={{ padding: '8px' }}>
          <PopoverContent aria-label="Filters">
            <PopoverBody>Unpaid invoices.</PopoverBody>
          </PopoverContent>
        </PopoverLayer>
      </Popover>,
    );
    await waitFor(() => expect((layer() as HTMLElement | null)?.style.left).toBe(left));
  });

  it('draws no arrow when arrow is off', async () => {
    render(<Basic arrow={false} defaultOpen />);
    await waitFor(() => expect(layer()).not.toBeNull());
    expect(document.querySelector('[data-part="arrow"]')).toBeNull();
  });

  /**
   * A dialog with no accessible name is one a reader cannot identify, and a
   * name the family invented would be worse than none.
   */
  it('names the panel from its title and describes it from its description', async () => {
    render(<Basic defaultOpen />);
    await waitFor(() => expect(panel()).not.toBeNull());

    const title = document.querySelector('[data-part="title"]');
    const description = document.querySelector('[data-part="description"]');
    expect(panel()?.getAttribute('aria-labelledby')).toBe(title?.id);
    expect(panel()?.getAttribute('aria-describedby')).toBe(description?.id);
    expect(panel()?.getAttribute('aria-modal')).toBeNull();
  });

  it('writes no aria-labelledby when there is no title', async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverLayer>
          <PopoverContent aria-label="Filters">
            <PopoverBody>Nothing but a body.</PopoverBody>
          </PopoverContent>
        </PopoverLayer>
      </Popover>,
    );
    await waitFor(() => expect(panel()).not.toBeNull());
    expect(panel()?.getAttribute('aria-labelledby')).toBeNull();
    expect(panel()?.getAttribute('aria-label')).toBe('Filters');
  });

  it('takes the focus on open and gives it back to the trigger on close', async () => {
    render(<Basic />);
    fireEvent.click(trigger());
    await waitFor(() => expect(document.activeElement).toBe(panel()));

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(layer()).toBeNull());
    expect(document.activeElement).toBe(trigger());
  });

  it('focuses what initialFocus names instead', async () => {
    render(<Basic initialFocus="input" />);
    fireEvent.click(trigger());
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Search')));
  });

  it('leaves the focus alone when autoFocus is off', async () => {
    render(<Basic autoFocus={false} />);
    trigger().focus();
    fireEvent.click(trigger());
    await waitFor(() => expect(layer()).not.toBeNull());
    expect(document.activeElement).toBe(trigger());
  });

  /**
   * The question every surveyed library leaves open. Focus reaching a guard
   * arrived by Tab at the edge of a layer at the end of the document, so the
   * family closes and puts focus back where the reading order continues.
   */
  it('closes and returns focus when Tab reaches the edge of the layer', async () => {
    render(<Basic defaultOpen />);
    await waitFor(() => expect(guards()).toHaveLength(2));

    const trailing = guards()[1] as HTMLElement;
    fireEvent.focus(trailing);
    await waitFor(() => expect(layer()).toBeNull());
    expect(document.activeElement).toBe(trigger());
    expect(contract.focus.guards.emits).toBe('keyboard');
  });

  it('carries a reason for every way it closes, and can be refused', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(layer()).toBeNull());
    expect(seen).toContain('dismiss');
  });

  it('closes on a press outside, and not on one inside', async () => {
    const onOpenChange = vi.fn();
    render(<Basic defaultOpen onOpenChange={onOpenChange} />);
    await waitFor(() => expect(layer()).not.toBeNull());

    fireEvent.pointerDown(panel() as HTMLElement);
    expect(layer()).not.toBeNull();

    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(layer()).toBeNull());
    expect(onOpenChange.mock.calls.at(-1)?.[1].reason).toBe('outsidePress');
  });

  it('measures the anchor rather than the trigger when one is given', async () => {
    render(
      <Popover defaultOpen>
        <PopoverAnchor data-testid="row">
          <PopoverTrigger>Actions</PopoverTrigger>
        </PopoverAnchor>
        <PopoverLayer>
          <PopoverContent aria-label="Row actions">
            <PopoverBody>Duplicate, archive, delete.</PopoverBody>
          </PopoverContent>
        </PopoverLayer>
      </Popover>,
    );
    await waitFor(() => expect(layer()).not.toBeNull());
    expect(screen.getByTestId('row')).not.toBeNull();
  });

  /**
   * The anchor's `render` hands a callback ref, as the trigger's does, so the
   * consumer's own element — a table row here — takes it without a cast. A
   * press on that row is a press inside the layer.
   */
  it('anchors to the consumer’s own element through render', async () => {
    render(
      <table>
        <tbody>
          <Popover defaultOpen>
            <PopoverAnchor
              render={(props) => (
                <tr {...props} data-testid="row">
                  <td>
                    <PopoverTrigger>Tracking</PopoverTrigger>
                  </td>
                </tr>
              )}
            />
            <PopoverLayer>
              <PopoverContent aria-label="Shipment">
                <PopoverBody>Federal Shipping, FS-4471-0921.</PopoverBody>
              </PopoverContent>
            </PopoverLayer>
          </Popover>
        </tbody>
      </table>,
    );
    await waitFor(() => expect(layer()).not.toBeNull());

    fireEvent.pointerDown(screen.getByTestId('row'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(layer()).not.toBeNull();
  });

  /**
   * A portalled layer is drawn only once the portal root is known. Drawn in
   * place first, it lands for one commit wherever the Popover was written —
   * a `div` inside a `tbody`, which the HTML parser forbids.
   */
  it('never draws a portalled layer where the Popover is written', async () => {
    const placed: Element[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element && node.matches('[data-ui="popover"]')) placed.push(node);
        }
      }
    });
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <td>
              <Popover>
                <PopoverTrigger>Tracking</PopoverTrigger>
                <PopoverLayer>
                  <PopoverContent aria-label="Shipment">
                    <PopoverBody>Federal Shipping, FS-4471-0921.</PopoverBody>
                  </PopoverContent>
                </PopoverLayer>
              </Popover>
            </td>
          </tr>
        </tbody>
      </table>,
    );
    observer.observe(container, { childList: true, subtree: true });

    fireEvent.click(screen.getByRole('button', { name: 'Tracking' }));
    await waitFor(() => expect(layer()).not.toBeNull());
    observer.disconnect();
    expect(placed).toEqual([]);
    expect(container.contains(layer())).toBe(false);
  });

  it('never opens while it is disabled', () => {
    render(<Basic defaultOpen disabled />);
    expect(layer()).toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('opens and closes from the handle', async () => {
    function WithHandle() {
      const handle = useRef<PopoverHandle>(null);
      return (
        <>
          <button type="button" onClick={() => handle.current?.open()}>
            open it
          </button>
          <Basic ref={handle} />
        </>
      );
    }
    render(<WithHandle />);
    fireEvent.click(screen.getByText('open it'));
    await waitFor(() => expect(layer()).not.toBeNull());
  });

  it('takes the size from the provider, and the close label from the language in force', async () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <PopoverDefaultsProvider size="lg">
          <Basic defaultOpen />
        </PopoverDefaultsProvider>
      </SlottedProvider>,
    );
    await waitFor(() => expect(layer()).not.toBeNull());
    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Fechar' })).not.toBeNull();
    // language: en-US
    expect(layer()?.getAttribute('data-size')).toBe('lg');
  });

  it('lays its own messages over the catalog', async () => {
    render(<Basic defaultOpen messages={{ close: 'Close the filters' }} />);
    await waitFor(() => expect(layer()).not.toBeNull());
    expect(screen.getByRole('button', { name: 'Close the filters' })).not.toBeNull();
  });

  /**
   * The catalog's word names a close control that shows none of its own. A
   * button that says "Done" is announced "Done": an `aria-label` would replace
   * the text a sighted reader sees with a word they do not.
   */
  it('writes the catalog label only on a close control with no text', async () => {
    const onOpenChange = vi.fn();
    render(
      <Popover defaultOpen onOpenChange={onOpenChange}>
        <PopoverTrigger>Assign</PopoverTrigger>
        <PopoverLayer>
          <PopoverContent aria-label="Assign">
            <PopoverClose>Done</PopoverClose>
            <PopoverClose data-testid="icon">
              <svg aria-hidden="true" />
            </PopoverClose>
            <PopoverClose aria-label="Dismiss the panel" data-testid="named">
              Done
            </PopoverClose>
          </PopoverContent>
        </PopoverLayer>
      </Popover>,
    );
    await waitFor(() => expect(layer()).not.toBeNull());

    const [text, icon, named] = [...document.querySelectorAll('[data-part="close"]')];
    expect(text).not.toHaveAttribute('aria-label');
    expect(text).toHaveAccessibleName('Done');
    expect(icon).toHaveAttribute('aria-label', 'Close');
    expect(named).toHaveAttribute('aria-label', 'Dismiss the panel');

    fireEvent.click(text as HTMLElement);
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'dismiss' }),
    );
  });

  it('runs the consumer own handler beside the family one', () => {
    const own = vi.fn();
    render(
      <Popover>
        <PopoverTrigger onClick={own}>Filters</PopoverTrigger>
        <PopoverLayer>
          <PopoverContent aria-label="Filters">
            <PopoverBody>Body</PopoverBody>
          </PopoverContent>
        </PopoverLayer>
      </Popover>,
    );
    fireEvent.click(trigger());
    expect(own).toHaveBeenCalledTimes(1);
  });
});
