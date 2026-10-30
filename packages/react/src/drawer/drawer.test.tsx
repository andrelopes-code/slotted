import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/drawer/contract.json';
import { SlottedProvider } from '../i18n';
import { Drawer } from './drawer';
import { DrawerDefaultsProvider } from './drawer-defaults';
import {
  DrawerActions,
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerResizer,
  DrawerTitle,
  DrawerTrigger,
} from './drawer-parts';
import type { DrawerChangeRequest, DrawerHandle, DrawerProps } from './drawer.types';

function Basic({ children, ...props }: Partial<DrawerProps>) {
  return (
    <Drawer {...props}>
      <DrawerTrigger>Open details</DrawerTrigger>
      <DrawerPanel>
        <DrawerHeader>
          <DrawerTitle>Invoice 4471</DrawerTitle>
          <DrawerActions />
          <DrawerDescription>Issued on 12 August.</DrawerDescription>
          <DrawerClose />
        </DrawerHeader>
        <DrawerBody>{children ?? <input aria-label="Note" />}</DrawerBody>
        <DrawerFooter>
          <button type="button">Cancel</button>
        </DrawerFooter>
        <DrawerResizer />
      </DrawerPanel>
    </Drawer>
  );
}

const layer = () => document.querySelector('[data-ui="drawer"]') as HTMLElement | null;
const panel = () => document.querySelector('[data-part="panel"]') as HTMLElement | null;
const separator = () => screen.getByRole('separator');
const trigger = () => screen.getByRole('button', { name: 'Open details' });

const press = (node: Element) => fireEvent.click(node, { detail: 1 });
const activateByKey = (node: Element) => fireEvent.click(node, { detail: 0 });
const escape = () =>
  fireEvent.keyDown(document, { key: 'Escape', bubbles: true, cancelable: true });

/**
 * jsdom lays nothing out, so every rectangle is zero and the extent arithmetic
 * has nothing to measure. The layer is given a size once, here, so the pointer
 * tests are about the family's own rules rather than about the environment.
 */
function measureLayerAs(width: number, height: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    bottom: height,
    height,
    left: 0,
    right: width,
    toJSON: () => ({}),
    top: 0,
    width,
    x: 0,
    y: 0,
  } as DOMRect);
}

/**
 * jsdom implements pointer events and not pointer *capture*, so a drag that
 * claims the pointer throws before the family's own rule is reached. The three
 * methods are filled in rather than guarded in the family: a guard would be
 * production code shaped by the test environment.
 */
beforeAll(() => {
  const element = Element.prototype as unknown as Record<string, unknown>;
  element['setPointerCapture'] ??= () => {};
  element['releasePointerCapture'] ??= () => {};
  element['hasPointerCapture'] ??= () => true;
});

describe('Drawer', () => {
  it('renders the anatomy the contract declares', () => {
    render(<Basic defaultOpen />);

    const parts = [...document.querySelectorAll('[data-part]')].map((node) =>
      node.getAttribute('data-part'),
    );
    for (const part of contract.members.drawer.parts) {
      expect(parts, `${part} is declared and never rendered`).toContain(part);
    }
    expect(layer()?.dataset['ui']).toBe('drawer');
  });

  it('draws the close as the x glyph, and draws nothing over content the consumer wrote', () => {
    const { unmount } = render(<Basic defaultOpen />);
    const close = () => document.querySelector('[data-part="close"]') as HTMLElement;
    const glyph = close().querySelector('[data-ui="icon"] > svg[data-part="glyph"]');
    expect(glyph).toHaveAttribute('data-glyph', 'x');
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    unmount();

    render(
      <Drawer defaultOpen>
        <DrawerPanel>
          <DrawerHeader>
            <DrawerTitle>Own mark</DrawerTitle>
            <DrawerClose>Done</DrawerClose>
          </DrawerHeader>
        </DrawerPanel>
      </Drawer>,
    );
    expect(close().querySelector('svg')).toBeNull();
    expect(close()).toHaveTextContent('Done');
  });

  it('writes every axis the stylesheet keys on', () => {
    render(<Basic defaultOpen mount="eager" side="bottom" size="lg" />);

    const root = layer() as HTMLElement;
    expect(root.dataset['mode']).toBe('overlay');
    expect(root.dataset['side']).toBe('bottom');
    expect(root.dataset['size']).toBe('lg');
    expect(root.dataset['mount']).toBe('eager');
    expect(root.hasAttribute('data-modal')).toBe(true);
  });

  /* ------------------------------------------------------------- opening - */

  it('opens from the trigger and tells a pointer from a key', () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);

    press(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'pointer' }),
    );

    activateByKey(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  /** An inline drawer is a disclosure; an overlay one is a popup as well. */
  it('promises a popup only where there is one', () => {
    const { rerender } = render(<Basic defaultOpen />);
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');

    rerender(<Basic defaultOpen mode="inline" />);
    expect(trigger().hasAttribute('aria-haspopup')).toBe(false);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('names the panel from the trigger, and the title from the panel', () => {
    render(<Basic defaultOpen />);

    expect(trigger().getAttribute('aria-controls')).toBe(panel()?.id);
    expect(panel()?.getAttribute('aria-labelledby')).toBe(screen.getByText('Invoice 4471').id);
    expect(panel()?.getAttribute('aria-describedby')).toBe(
      screen.getByText('Issued on 12 August.').id,
    );
  });

  /** A reference to an id nothing carries is worse than no name at all. */
  it('writes no labelling for a part that was not rendered', () => {
    render(
      <Drawer defaultOpen>
        <DrawerPanel aria-label="Filters">
          <DrawerBody>Nothing else</DrawerBody>
        </DrawerPanel>
      </Drawer>,
    );

    expect(panel()?.hasAttribute('aria-labelledby')).toBe(false);
    expect(panel()?.hasAttribute('aria-describedby')).toBe(false);
    expect(panel()?.getAttribute('aria-label')).toBe('Filters');
  });

  /* -------------------------------------------------------------- closing - */

  it('names the close in the language in force, and lays its own messages over it', () => {
    const drawer = (messages?: { close: string }) => (
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Drawer defaultOpen messages={messages}>
          <DrawerPanel>
            <DrawerHeader>
              <DrawerTitle>Invoice</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
          </DrawerPanel>
        </Drawer>
      </SlottedProvider>
    );
    const { rerender } = render(drawer());
    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
    // language: en-US

    rerender(drawer({ close: 'Close invoice' }));
    expect(screen.getByRole('button', { name: 'Close invoice' })).toBeInTheDocument();
  });

  it('closes from the close button, carrying dismiss and its value', () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <DrawerPanel>
          <DrawerHeader>
            <DrawerTitle>Invoice</DrawerTitle>
            <DrawerClose value="dismissed" />
          </DrawerHeader>
        </DrawerPanel>
      </Drawer>,
    );

    press(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'dismiss', result: 'dismissed' }),
    );
  });

  it('closes on Escape, carrying escape', () => {
    const onOpenChange = vi.fn();
    render(<Basic defaultOpen onOpenChange={onOpenChange} />);

    escape();
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'escape' }));
  });

  /**
   * Where the platform has `CloseWatcher`, the way back reaches the drawer
   * through a watcher and the history is left alone (`@slotted/core/dismissable-layer`).
   */
  describe('with a close watcher', () => {
    const watchers: { onclose: ((event: Event) => void) | null; destroyed: boolean }[] = [];

    afterEach(() => {
      watchers.length = 0;
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    function stubCloseWatcher() {
      vi.stubGlobal(
        'CloseWatcher',
        class {
          onclose: ((event: Event) => void) | null = null;
          destroyed = false;
          constructor() {
            watchers.push(this);
          }
          destroy() {
            this.destroyed = true;
          }
        },
      );
    }

    it('closes on the watcher, carrying back, and pushes no history entry', () => {
      stubCloseWatcher();
      const push = vi.spyOn(history, 'pushState');
      const onOpenChange = vi.fn();
      render(<Basic defaultOpen onOpenChange={onOpenChange} />);

      act(() => watchers[0]?.onclose?.(new Event('close')));

      expect(push).not.toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'back' }));
    });

    it('destroys the watcher on close and never steps the history back', async () => {
      stubCloseWatcher();
      const back = vi.spyOn(history, 'back');
      const { rerender } = render(<Basic open />);

      rerender(<Basic open={false} />);
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

      expect(watchers[0]?.destroyed).toBe(true);
      expect(back).not.toHaveBeenCalled();
    });
  });

  it('refuses Escape when the policy says so', () => {
    const onOpenChange = vi.fn();
    render(<Basic defaultOpen escape="none" onOpenChange={onOpenChange} />);

    escape();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  /** DR1. The scrim is inside the layer's node; the panel is what a press is inside of. */
  it('closes on a press on the scrim, and not on one that began in the panel', () => {
    const onOpenChange = vi.fn();
    render(<Basic defaultOpen onOpenChange={onOpenChange} />);
    const scrim = document.querySelector('[data-part="backdrop"]') as HTMLElement;

    fireEvent.pointerDown(screen.getByRole('dialog'));
    fireEvent.click(scrim);
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.pointerDown(scrim);
    fireEvent.click(scrim);
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'outsidePress' }),
    );
  });

  /**
   * One cancellable request covers every way out. Angular Material's
   * `disableClose` refuses two of the four sources and cannot refuse the third;
   * Ant needs two booleans and still cannot refuse the close button.
   */
  it('lets one guard refuse every source', () => {
    function Guarded() {
      const [open, setOpen] = useState(true);
      return (
        <Drawer
          onOpenChange={(next, request: DrawerChangeRequest) => {
            if (!next) return request.cancel();
            setOpen(next);
          }}
          open={open}
        >
          <DrawerPanel>
            <DrawerHeader>
              <DrawerTitle>Saving</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
          </DrawerPanel>
        </Drawer>
      );
    }

    render(<Guarded />);
    escape();
    expect(layer()).not.toBeNull();

    press(screen.getByRole('button', { name: 'Close' }));
    expect(layer()).not.toBeNull();
  });

  it('runs the consumer’s own handler first, and lets it refuse', () => {
    const onOpenChange = vi.fn();
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <Drawer onOpenChange={onOpenChange}>
        <DrawerTrigger onClick={onClick}>Open details</DrawerTrigger>
        <DrawerPanel />
      </Drawer>,
    );

    press(trigger());
    expect(onClick).toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  /* --------------------------------------------------------------- modes - */

  /**
   * An inline drawer is a region of the page: nothing is inert, nothing is
   * contained, and `role="dialog"` on it would be the claim the APG calls
   * severe. It also never leaves the document, because its own measure is what
   * opens and closes.
   */
  it('is a dialog only where the background is out of reach', () => {
    const { rerender } = render(<Basic defaultOpen />);
    expect(panel()?.getAttribute('role')).toBe('dialog');
    expect(panel()?.getAttribute('aria-modal')).toBe('true');

    rerender(<Basic defaultOpen mode="inline" />);
    expect(panel()?.hasAttribute('role')).toBe(false);
    expect(panel()?.hasAttribute('aria-modal')).toBe(false);
    expect(layer()?.dataset['mode']).toBe('inline');
  });

  /**
   * `mode` is an axis rather than two components so that an application can
   * switch it at a breakpoint without the panel's subtree being destroyed: its
   * uncontrolled fields, its scroll position and its focus survive the switch
   * (contract `mode.reason`).
   */
  /**
   * An inline panel writes no role (contract `wiring.role`), and a name on a
   * generic element names nothing: the consumer's landmark around it carries
   * the name. React registered the title in an effect, so the server wrote no
   * `aria-labelledby` and the client did, and Angular wrote it at once. A panel
   * the consumer gives a role is named by the title again.
   */
  it('names an inline panel only when the consumer gives it a role', () => {
    render(<Basic defaultOpen mode="inline" />);
    expect(panel()).not.toHaveAttribute('aria-labelledby');
    expect(panel()).not.toHaveAttribute('role');

    render(
      <Drawer defaultOpen mode="inline">
        <DrawerPanel role="complementary">
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
          </DrawerHeader>
        </DrawerPanel>
      </Drawer>,
    );
    const complementary = screen.getByRole('complementary');
    const title = screen.getByText('Filters');
    expect(complementary).toHaveAttribute('aria-labelledby', title.id);
  });

  it('keeps the panel’s content across a switch of mode', () => {
    const { rerender } = render(<Basic defaultOpen mode="inline" />);
    const note = screen.getByRole('textbox', { name: 'Note' }) as HTMLInputElement;
    fireEvent.change(note, { target: { value: 'Dock 4' } });

    rerender(<Basic defaultOpen mode="overlay" />);
    expect(layer()?.dataset['mode']).toBe('overlay');
    expect(screen.getByRole('textbox', { name: 'Note' })).toBe(note);
    expect(note.value).toBe('Dock 4');

    rerender(<Basic defaultOpen mode="inline" />);
    expect(layer()?.dataset['mode']).toBe('inline');
    expect(screen.getByRole('textbox', { name: 'Note' })).toBe(note);
    expect(note.value).toBe('Dock 4');
  });

  /**
   * An inline drawer's measure is a fraction of the consumer's layout. The
   * layer is rendered through `display: contents` boxes, which lay nothing
   * out, so the box measured is the first ancestor past them.
   */
  it('measures an inline drawer against the consumer’s layout', () => {
    const measure = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const width = this.classList.contains('layout') ? 1000 : 0;
        return {
          bottom: 600,
          height: 600,
          left: 0,
          right: width,
          top: 0,
          width,
          x: 0,
          y: 0,
        } as DOMRect;
      });
    render(
      <div className="layout">
        <Drawer defaultOpen extent={0.4} mode="inline" side="start">
          <DrawerPanel>
            <DrawerBody>Status</DrawerBody>
          </DrawerPanel>
        </Drawer>
      </div>,
    );

    expect(layer()?.style.getPropertyValue('--slotted-drawer-extent')).toBe('400px');
    measure.mockRestore();
  });

  it('keeps an inline drawer in the document and makes it inert when closed', () => {
    render(<Basic mode="inline" />);

    expect(layer()).not.toBeNull();
    expect(layer()?.hasAttribute('inert')).toBe(true);
    expect(layer()?.hasAttribute('data-open')).toBe(false);
  });

  it('drops an active overlay layer when it closes', () => {
    const { rerender } = render(<Basic defaultOpen />);
    expect(layer()).not.toBeNull();

    rerender(<Basic open={false} />);
    /* Gone, or on its way out — `presence` decides which, and neither is open. */
    expect(layer()?.hasAttribute('data-open') ?? false).toBe(false);
  });

  /**
   * The scrim belongs to the layer, not to the dismissal policy. `modal`
   * decides what happens to the page *behind* it — inert, the scroll lock,
   * focus containment — and never what is painted. Tying the two cost a
   * reference page: a demonstration that stands open must not be modal, and
   * with the scrim gated on modality every still picture lost the scrim that
   * is half of it.
   */
  it('paints the scrim wherever there is a layer, modal or not', () => {
    const { rerender } = render(<Basic defaultOpen />);
    expect(document.querySelector('[data-part="backdrop"]')).not.toBeNull();

    rerender(<Basic defaultOpen modal={false} />);
    expect(document.querySelector('[data-part="backdrop"]')).not.toBeNull();
    expect(document.querySelector('[data-part="panel"]')?.hasAttribute('aria-modal')).toBe(false);
  });

  it('paints no scrim where there is no layer', () => {
    render(<Basic defaultOpen mode="inline" />);
    expect(document.querySelector('[data-part="backdrop"]')).toBeNull();
  });

  /* ------------------------------------------------------------- resizing - */

  it('wires the separator to the pane it sizes, both ways', () => {
    render(<Basic defaultOpen />);

    const bar = separator();
    expect(bar.getAttribute('aria-orientation')).toBe('vertical');
    expect(bar.getAttribute('aria-controls')).toBe(panel()?.id);
    expect(bar.getAttribute('aria-labelledby')).toBe(screen.getByText('Invoice 4471').id);
    expect(bar.tabIndex).toBe(0);
  });

  it('reports the measure as the range the pattern calls typical', () => {
    render(<Basic defaultExtent={0.4} defaultOpen />);

    const bar = separator();
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.getAttribute('aria-valuemin')).toBe('20');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('turns the block axis around for a sheet', () => {
    render(<Basic defaultOpen side="bottom" />);
    expect(separator().getAttribute('aria-orientation')).toBe('horizontal');
  });

  /**
   * The arrows name a direction on the screen, which is the Window Splitter
   * pattern's own reading. `ArrowLeft` grows an `end`-side panel and shrinks a
   * `start`-side one, because the same key moves the separator the same way and
   * the panels are on opposite edges.
   */
  it('moves the separator by the screen rather than by the anchor', () => {
    measureLayerAs(1600, 800);
    const onExtentChange = vi.fn();
    /* Controlled and never moved, so each press is measured from the same
       place rather than from wherever the one before it landed. */
    const { rerender } = render(
      <Basic defaultOpen extent={0.4} onExtentChange={onExtentChange} side="end" />,
    );

    fireEvent.keyDown(separator(), { key: 'ArrowLeft' });
    expect(onExtentChange).toHaveBeenLastCalledWith(
      expect.closeTo(0.4 + 16 / 1600, 5),
      expect.objectContaining({ reason: 'keyboard' }),
    );

    rerender(<Basic defaultOpen extent={0.4} onExtentChange={onExtentChange} side="start" />);
    fireEvent.keyDown(separator(), { key: 'ArrowLeft' });
    expect(onExtentChange).toHaveBeenLastCalledWith(
      expect.closeTo(0.4 - 16 / 1600, 5),
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  /**
   * A distance and not a proportion. Sixteen pixels is an adjustment at every
   * layer width; five per cent of a sixteen-hundred-pixel layer is eighty, and
   * a reader placing an edge against the words beside it cannot use eighty.
   */
  it('moves by sixteen pixels, and by sixty-four with Shift', () => {
    measureLayerAs(1600, 800);
    const onExtentChange = vi.fn();
    const { rerender } = render(
      <Basic defaultOpen extent={0.5} onExtentChange={onExtentChange} side="end" />,
    );

    fireEvent.keyDown(separator(), { key: 'ArrowLeft' });
    expect(onExtentChange).toHaveBeenLastCalledWith(
      expect.closeTo(0.5 + 16 / 1600, 5),
      expect.anything(),
    );

    fireEvent.keyDown(separator(), { key: 'ArrowLeft', shiftKey: true });
    expect(onExtentChange).toHaveBeenLastCalledWith(
      expect.closeTo(0.5 + 64 / 1600, 5),
      expect.anything(),
    );

    /* A block side measures against the block axis, so the same press is a
       different fraction of a layer that is not square. */
    rerender(<Basic defaultOpen extent={0.5} onExtentChange={onExtentChange} side="bottom" />);
    fireEvent.keyDown(separator(), { key: 'ArrowUp' });
    expect(onExtentChange).toHaveBeenLastCalledWith(
      expect.closeTo(0.5 + 16 / 800, 5),
      expect.anything(),
    );
  });

  /**
   * Back to the measure the size step gives it, which is what `undefined`
   * means for this state and what every desktop pane divider answers a double
   * click with.
   */
  it('restores the default measure on a double click', () => {
    measureLayerAs(1600, 800);
    const onExtentChange = vi.fn();
    render(<Basic defaultExtent={0.5} defaultOpen onExtentChange={onExtentChange} />);

    fireEvent.keyDown(separator(), { key: 'End' });
    expect(separator().getAttribute('aria-valuenow')).toBe('100');

    fireEvent.doubleClick(separator());
    expect(onExtentChange).toHaveBeenLastCalledWith(
      0.5,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(separator().getAttribute('aria-valuenow')).toBe('50');
  });

  it('restores to the size step itself when the consumer named no measure', () => {
    measureLayerAs(1600, 800);
    const onExtentChange = vi.fn();
    render(<Basic defaultOpen onExtentChange={onExtentChange} />);

    fireEvent.keyDown(separator(), { key: 'End' });
    expect(separator().getAttribute('aria-valuenow')).toBe('100');

    fireEvent.doubleClick(separator());
    expect(onExtentChange).toHaveBeenLastCalledWith(
      undefined,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  /**
   * The cursor has to survive the pointer leaving the separator — capture
   * keeps the events coming and the cursor is decided by what is under the
   * pointer — and a drag across the page must not select the text under it.
   */
  it('holds the cursor and suspends selection for the life of a drag', () => {
    measureLayerAs(1000, 800);
    render(<Basic defaultOpen side="end" />);

    fireEvent.pointerDown(separator(), { button: 0, clientX: 600, pointerId: 1 });
    fireEvent.pointerMove(separator(), { clientX: 580, pointerId: 1 });
    expect(document.body.style.cursor).toBe('col-resize');
    expect(document.documentElement.style.userSelect).toBe('none');

    fireEvent.pointerUp(separator(), { pointerId: 1 });
    expect(document.body.style.cursor).toBe('');
    expect(document.documentElement.style.userSelect).toBe('');
  });

  it('takes Home and End to the ends of the range', () => {
    const onExtentChange = vi.fn();
    render(<Basic defaultExtent={0.5} defaultOpen onExtentChange={onExtentChange} />);

    fireEvent.keyDown(separator(), { key: 'End' });
    expect(onExtentChange).toHaveBeenLastCalledWith(1, expect.anything());

    fireEvent.keyDown(separator(), { key: 'Home' });
    expect(onExtentChange).toHaveBeenLastCalledWith(0.2, expect.anything());
  });

  /**
   * The pattern says `Enter` collapses the pane and restores it. It does not
   * close the drawer, because Escape already means that and a reader pressing
   * Enter on a separator expects the separator to still be there.
   */
  it('collapses and restores on Enter without closing', () => {
    function Controlled() {
      const [extent, setExtent] = useState<number | undefined>(0.6);
      return <Basic defaultOpen extent={extent} onExtentChange={setExtent} />;
    }

    render(<Controlled />);
    fireEvent.keyDown(separator(), { key: 'Enter' });
    expect(separator().getAttribute('aria-valuenow')).toBe('20');
    expect(layer()).not.toBeNull();

    fireEvent.keyDown(separator(), { key: 'Enter' });
    expect(separator().getAttribute('aria-valuenow')).toBe('60');
  });

  /** A snap point is a stop of the same separator, reachable by arrow. */
  it('moves between snap points rather than by the step', () => {
    const onExtentChange = vi.fn();
    render(
      <Basic
        defaultExtent={0.25}
        defaultOpen
        onExtentChange={onExtentChange}
        side="bottom"
        snapPoints={[0.25, 0.5, 1]}
      />,
    );

    fireEvent.keyDown(separator(), { key: 'ArrowUp' });
    expect(onExtentChange).toHaveBeenLastCalledWith(0.5, expect.anything());
  });

  it('takes its limits from the first and last stop', () => {
    render(<Basic defaultOpen snapPoints={[0.3, 0.6, 0.9]} />);

    expect(separator().getAttribute('aria-valuemin')).toBe('30');
    expect(separator().getAttribute('aria-valuemax')).toBe('90');
  });

  it('follows the pointer while it is down, and says so in the DOM', () => {
    measureLayerAs(1000, 800);
    const onExtentChange = vi.fn();
    render(<Basic defaultExtent={0.3} defaultOpen onExtentChange={onExtentChange} side="end" />);

    const bar = separator();
    /* The press alone moves nothing: the panel follows the pointer from the
       offset it was grabbed at, so a press that does not move is a tap. */
    fireEvent.pointerDown(bar, { button: 0, clientX: 700, clientY: 0, pointerId: 1 });
    expect(onExtentChange).not.toHaveBeenCalled();
    fireEvent.pointerMove(bar, { clientX: 650, clientY: 0, pointerId: 1 });
    expect(layer()?.hasAttribute('data-dragging')).toBe(true);
    expect(onExtentChange).toHaveBeenLastCalledWith(
      expect.closeTo(0.35, 5),
      expect.objectContaining({ reason: 'pointer' }),
    );

    fireEvent.pointerUp(bar, { pointerId: 1 });
    expect(layer()?.hasAttribute('data-dragging')).toBe(false);
    vi.restoreAllMocks();
  });

  /**
   * One rule on release: a measure below the floor asks to close, carrying
   * `pointer`. MUI's `SwipeableDrawer` and Vaul's dismiss gesture both do this,
   * expressed here as a consequence of the resize rather than as a second
   * mechanism.
   */
  it('asks to close when a drag is released below the floor', () => {
    measureLayerAs(1000, 800);
    const onOpenChange = vi.fn();
    render(<Basic defaultExtent={0.3} defaultOpen onOpenChange={onOpenChange} side="end" />);

    const bar = separator();
    fireEvent.pointerDown(bar, { button: 0, clientX: 700, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(bar, { clientX: 950, clientY: 0, pointerId: 1 });
    fireEvent.pointerUp(bar, { pointerId: 1 });

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'pointer' }),
    );
    vi.restoreAllMocks();
  });

  /**
   * The separator resizes as it moves, so a close by it left the measure where
   * the hand let go, under the floor, and the next open started there.
   */
  it('gives back the measure it had when a drag closes it, so it reopens at its own', () => {
    measureLayerAs(1000, 800);
    const onExtentChange = vi.fn();
    render(<Basic defaultExtent={0.3} defaultOpen onExtentChange={onExtentChange} side="end" />);

    const bar = separator();
    fireEvent.pointerDown(bar, { button: 0, clientX: 700, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(bar, { clientX: 950, clientY: 0, pointerId: 1 });
    fireEvent.pointerUp(bar, { pointerId: 1 });

    expect(onExtentChange).toHaveBeenLastCalledWith(
      0.3,
      expect.objectContaining({ reason: 'pointer' }),
    );
    vi.restoreAllMocks();
  });

  /* --------------------------------------------------------------- state - */

  it('reads a controlled value and never moves it itself', () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} open={false} />);

    press(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(document.querySelector('[data-part="panel"]')).toBeNull();
  });

  it('holds its own value when the consumer owns nothing', () => {
    render(<Basic />);
    press(trigger());
    expect(panel()).not.toBeNull();
  });

  it('carries the loading state to the row that is waiting', () => {
    render(<Basic defaultOpen loading />);

    expect(layer()?.hasAttribute('data-loading')).toBe(true);
    expect(document.querySelector('[data-part="body"]')?.getAttribute('aria-busy')).toBe('true');
    /* And nothing is disabled: a drawer a reader cannot leave is worse. */
    expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled();
  });

  /* -------------------------------------------------------- composition - */

  it('lets an application set the axes once', () => {
    render(
      <DrawerDefaultsProvider mode="inline" side="start" size="xl">
        <Basic defaultOpen />
      </DrawerDefaultsProvider>,
    );

    expect(layer()?.dataset['side']).toBe('start');
    expect(layer()?.dataset['size']).toBe('xl');
    expect(layer()?.dataset['mode']).toBe('inline');
  });

  it('lets an explicit value win over the provider', () => {
    render(
      <DrawerDefaultsProvider size="xl">
        <Basic defaultOpen size="sm" />
      </DrawerDefaultsProvider>,
    );

    expect(layer()?.dataset['size']).toBe('sm');
  });

  /** `render` substitutes the panel, which is how an inline drawer is a nav. */
  it('substitutes the element a part renders', () => {
    render(
      <Drawer defaultOpen mode="inline">
        <DrawerPanel render={(props) => <nav {...props} aria-label="Sections" />}>
          <DrawerBody>Sections</DrawerBody>
        </DrawerPanel>
      </Drawer>,
    );

    const nav = screen.getByRole('navigation', { name: 'Sections' });
    expect(nav.dataset['part']).toBe('panel');
  });

  it('gives the consumer the three actions they cannot write declaratively', () => {
    const handle = { current: null as DrawerHandle | null };
    const onOpenChange = vi.fn();

    render(<Basic onOpenChange={onOpenChange} ref={handle} />);

    act(() => handle.current?.open());
    expect(onOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'programmatic' }),
    );

    act(() => handle.current?.close('saved'));
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'programmatic', result: 'saved' }),
    );
  });

  it('throws for a part written outside the family', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<DrawerTitle>Loose</DrawerTitle>)).toThrow(/inside Drawer/);
    quiet.mockRestore();
  });

  /**
   * A render while the drawer is open is not an opening. The layer effect used
   * to depend on the whole context object, whose identity changes on every
   * render, so each one tore the focus scope down and entered it again: focus
   * jumped back to the first control, and the element to return to was read
   * again from inside the panel.
   */
  it('keeps focus across a render while open, and gives it back to the trigger on close', () => {
    function Rerendering() {
      const [count, setCount] = useState(0);
      /* `loading` changes the context and nothing about the layer, as the
         measured rest does in a browser once the panel has laid out. */
      return (
        <Drawer loading={count > 0}>
          <DrawerTrigger>Open details</DrawerTrigger>
          <DrawerPanel>
            <DrawerBody>
              <button type="button">First</button>
              <button type="button" onClick={() => setCount(count + 1)}>
                Clicked {count}
              </button>
            </DrawerBody>
          </DrawerPanel>
        </Drawer>
      );
    }
    render(<Rerendering />);
    trigger().focus();
    press(trigger());
    const second = screen.getByRole('button', { name: /Clicked/ });
    second.focus();
    press(second);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Clicked 1' }));
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    expect(document.activeElement).toBe(trigger());
  });

  /**
   * A click does not focus a button in Safari, and jsdom follows it, so a
   * drawer opened from its trigger has `body` as the element that held focus.
   * Giving focus back to that is giving it back to nowhere.
   */
  it('gives focus back to the trigger when nothing held it on opening', () => {
    render(<Basic />);
    (document.activeElement as HTMLElement | null)?.blur();
    press(trigger());
    expect(panel()).not.toBeNull();
    press(screen.getByRole('button', { name: 'Close' }));
    expect(document.activeElement).toBe(trigger());
  });

  /** The body's padding is the consumer's to drop, for content that brings its own inset. */
  it('drops the body inset when told', () => {
    render(
      <Drawer defaultOpen>
        <DrawerPanel>
          <DrawerBody inset="none">Edge to edge</DrawerBody>
        </DrawerPanel>
      </Drawer>,
    );
    expect(document.querySelector('[data-part="body"]')).toHaveAttribute('data-inset', 'none');
  });
});

/**
 * The gesture the family was reported as ignoring. A flick is short by
 * definition, so the distance rule — released below the floor — cannot see one:
 * a reader who threw a sheet twenty pixels and let go got twenty pixels of
 * movement back.
 */
/**
 * `fireEvent` cannot set `timeStamp`: it is readonly on `Event`, and jsdom
 * fills it from the real clock — so two moves dispatched in the same tick are
 * a violent flick, which is correct in a browser and useless in a test. The
 * event is built and stamped by hand instead.
 */
function stamped(
  kind: 'pointerDown' | 'pointerMove' | 'pointerUp',
  target: Element,
  init: { clientY: number; pointerId: number },
  at: number,
) {
  const event = createEvent[kind](target, init);
  Object.defineProperty(event, 'timeStamp', { value: at });
  fireEvent(target, event);
}

/**
 * The gesture the family was reported as ignoring. A flick is short by
 * definition, so the distance rule — released below the floor — cannot see one:
 * a reader who threw a sheet twenty pixels and let go got twenty pixels of
 * movement back.
 */
describe('a sheet dismissed by velocity', () => {
  function sheet(onOpenChange = vi.fn(), onExtentChange = vi.fn()) {
    render(
      <Drawer
        defaultExtent={0.5}
        defaultOpen
        onExtentChange={onExtentChange}
        onOpenChange={onOpenChange}
        side="top"
      >
        <DrawerPanel>
          <DrawerResizer />
          <DrawerHeader>
            <DrawerTitle>Filter invoices</DrawerTitle>
          </DrawerHeader>
        </DrawerPanel>
      </Drawer>,
    );
    const resizer = screen.getByRole('separator');
    const layer = resizer.closest("[data-ui='drawer']") as HTMLElement;
    layer.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        width: 400,
        height: 800,
        top: 0,
        left: 0,
        right: 400,
        bottom: 800,
      }) as DOMRect;
    resizer.setPointerCapture = () => {};
    resizer.hasPointerCapture = () => true;
    resizer.releasePointerCapture = () => {};

    const drag = (moves: readonly (readonly [number, number])[]) => {
      stamped('pointerDown', resizer, { clientY: 400, pointerId: 1 }, 0);
      /* Written for a panel on the bottom edge and mirrored onto the top one:
         a bottom sheet is moved by the layer's scroll, not by its separator. */
      for (const [clientY, at] of moves) {
        stamped('pointerMove', resizer, { clientY: 800 - clientY, pointerId: 1 }, at);
      }
      const [lastY, lastAt] = moves[moves.length - 1] as readonly [number, number];
      stamped('pointerUp', resizer, { clientY: 800 - lastY, pointerId: 1 }, lastAt);
    };

    return { drag, onOpenChange, resizer };
  }

  /** Forty pixels in forty milliseconds, and never near the floor. */
  it('closes on a flick that never reaches the floor', () => {
    const { drag, onOpenChange } = sheet();
    drag([
      [420, 20],
      [440, 40],
    ]);
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  /**
   * The other half of the rule, and the reason velocity is a threshold rather
   * than a direction: the same forty pixels over a second and a half is an
   * adjustment, and closing on it would make a sheet impossible to resize.
   */
  it('leaves a slow drag of the same distance open', () => {
    const { drag, onOpenChange } = sheet();
    drag([
      [420, 700],
      [440, 1400],
    ]);
    expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything());
  });

  /** A flick the consumer refuses leaves the panel where the floor is, open. */
  it('lets the consumer refuse a flick', () => {
    const onOpenChange = vi.fn((_next: boolean, request: { cancel(): void }) => request.cancel());
    const { drag } = sheet(onOpenChange as never);
    /* Two moves, because one is a position and not a gesture: `extentVelocity`
       answers nought for a single sample, which is what a pointer stream that
       delivered one event before the release has to fall back to. */
    drag([
      [420, 20],
      [440, 40],
    ]);
    expect(onOpenChange).toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  /**
   * A close by the hand asked for the floor as well, and the next open started
   * there: a sheet opened at 50% came back at 20% after one flick.
   */
  it('gives back the measure it had when a flick closes it, so it reopens at its own', async () => {
    const onExtentChange = vi.fn();
    const { drag } = sheet(vi.fn(), onExtentChange);
    drag([
      [420, 20],
      [440, 40],
    ]);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(onExtentChange).toHaveBeenLastCalledWith(
      0.5,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('puts a refused flick on the floor, a frame later', async () => {
    const onExtentChange = vi.fn();
    const onOpenChange = vi.fn((_next: boolean, request: { cancel(): void }) => request.cancel());
    const { drag } = sheet(onOpenChange as never, onExtentChange);
    drag([
      [420, 20],
      [440, 40],
    ]);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(onExtentChange).toHaveBeenCalledWith(
      0.2,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });
});

/**
 * The reopening of 2026-09-25: a sheet from the bottom measures its content,
 * moves under a touch on its body, walks its stops on a tap of the grabber and
 * leaves the page undimmed below `scrimFrom`.
 */
describe('a bottom sheet', () => {
  /**
   * A sheet is moved by the layer's own scroll, which jsdom neither lays out
   * nor scrolls: the layer is 800 pixels tall and the panel's body 400, and a gesture
   * is where the scroll comes to rest, a `scroll` and then a `scrollend`.
   */
  const sizes = {
    clientHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight'),
    offsetHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight'),
  };
  afterEach(() => {
    for (const [name, descriptor] of Object.entries(sizes)) {
      if (descriptor !== undefined) Object.defineProperty(HTMLElement.prototype, name, descriptor);
    }
  });

  function sheet(props: Partial<DrawerProps> = {}) {
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => 800,
    });
    /* The panel's content is its body, 400 pixels of it. */
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return this.dataset['part'] === 'body' ? 400 : 0;
      },
    });
    const onOpenChange = vi.fn();
    const onExtentChange = vi.fn();
    render(
      <Drawer
        defaultOpen
        onExtentChange={onExtentChange}
        onOpenChange={onOpenChange}
        side="bottom"
        {...props}
      >
        <DrawerPanel>
          <DrawerResizer />
          <DrawerHeader>
            <DrawerTitle>Filter invoices</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>Period, status and owner.</DrawerBody>
        </DrawerPanel>
      </Drawer>,
    );
    const layer = document.querySelector("[data-ui='drawer']") as HTMLElement;
    const panel = layer.querySelector("[data-part='panel']") as HTMLElement;
    return { layer, onExtentChange, onOpenChange, panel };
  }

  async function settleAt(layer: HTMLElement, top: number) {
    await act(async () => {
      layer.scrollTop = top;
      layer.dispatchEvent(new Event('scroll'));
      layer.dispatchEvent(new Event('scrollend'));
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
  }

  it('measures its content on a block side and takes a step on an inline one', () => {
    render(<Basic defaultOpen side="bottom" />);
    expect(layer()?.dataset['size']).toBe('content');
    expect(layer()?.dataset['drag']).toBe('panel');
  });

  it('lays its stops out as snap points, the close among them', () => {
    const { layer } = sheet({ size: 'md', snapPoints: [0.5, 0.9] });
    const stops = [...layer.querySelectorAll<HTMLElement>("[data-part='stop']")];
    expect(stops.map((stop) => stop.style.insetBlockStart)).toEqual(['0px', '400px', '720px']);
  });

  it('closes when its scroll comes to rest out of sight', async () => {
    const { layer, onOpenChange } = sheet();
    await settleAt(layer, 0);
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('asks for nothing when its scroll comes back to rest on its content', async () => {
    const { layer, onExtentChange, onOpenChange } = sheet();
    await settleAt(layer, 400);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onExtentChange).not.toHaveBeenCalled();
  });

  it('asks for the stop its scroll comes to rest on', async () => {
    const { layer, onExtentChange } = sheet({ size: 'md', snapPoints: [0.5, 0.9] });
    await settleAt(layer, 720);
    expect(onExtentChange).toHaveBeenLastCalledWith(
      0.9,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('leaves the body alone when it is told to', () => {
    const { layer } = sheet({ drag: 'resizer' });
    /* The stylesheet keys the body's own scroll and the panel's touch-action on it. */
    expect(layer.dataset['drag']).toBe('resizer');
  });

  it('walks its stops on a tap of the grabber', () => {
    const { onExtentChange } = sheet({ defaultExtent: 0.5, size: 'md', snapPoints: [0.5, 0.9] });
    const bar = screen.getByRole('separator');
    bar.setPointerCapture = () => {};
    bar.hasPointerCapture = () => true;
    bar.releasePointerCapture = () => {};
    fireEvent.pointerDown(bar, { button: 0, clientY: 400, pointerId: 1 });
    fireEvent.pointerUp(bar, { clientY: 400, pointerId: 1 });
    expect(onExtentChange).toHaveBeenLastCalledWith(
      0.9,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  /** From the content stop, `extent` is `undefined`, and the lowest stop is still a move. */
  it('walks from the content stop back to the lowest snap point', () => {
    /* The content stop is the panel's 400 of the layer's 800. */
    const { onExtentChange } = sheet({ snapPoints: [0.3] });
    const bar = screen.getByRole('separator');
    bar.setPointerCapture = () => {};
    bar.hasPointerCapture = () => true;
    bar.releasePointerCapture = () => {};
    fireEvent.pointerDown(bar, { button: 0, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(bar, { clientY: 100, pointerId: 1 });
    expect(onExtentChange).toHaveBeenLastCalledWith(
      0.3,
      expect.objectContaining({ previous: undefined, reason: 'pointer' }),
    );
  });

  it('leaves the page undimmed below scrimFrom', () => {
    const { layer } = sheet({ defaultExtent: 0.3, scrimFrom: 0.5, size: 'md' });
    expect(layer).toHaveAttribute('data-undimmed');
  });
});
