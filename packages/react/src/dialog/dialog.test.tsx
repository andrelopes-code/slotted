import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/dialog/contract.json';
import { SlottedProvider } from '../i18n';
import { AlertDialog, Dialog } from './dialog';
import { DialogDefaultsProvider } from './dialog-defaults';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogIcon,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog-parts';
import type { DialogChangeRequest, DialogHandle, DialogProps } from './dialog.types';

function Basic({ children, ...props }: Partial<DialogProps>) {
  return (
    <Dialog {...props}>
      <DialogTrigger>Edit project</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>Names are visible to everyone.</DialogDescription>
          <DialogClose />
        </DialogHeader>
        <DialogBody>{children ?? <input aria-label="Name" />}</DialogBody>
        <DialogFooter>
          <button type="button">Cancel</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Confirm(props: Partial<React.ComponentProps<typeof AlertDialog>>) {
  return (
    <AlertDialog {...props}>
      <DialogTrigger>Delete</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <AlertDialogIcon />
          <DialogTitle>Delete this project?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogBody>The project and its 42 documents are removed for everyone.</DialogBody>
        <DialogFooter>
          <AlertDialogCancel>Keep project</AlertDialogCancel>
          <AlertDialogAction>Delete project</AlertDialogAction>
        </DialogFooter>
      </DialogContent>
    </AlertDialog>
  );
}

const layer = () => document.querySelector('[data-ui="dialog"]') as HTMLElement | null;
const panel = () => document.querySelector('[data-part="content"]') as HTMLElement | null;
const trigger = () => screen.getByRole('button', { name: /edit project|delete$/i });

const press = (node: Element) => fireEvent.click(node, { detail: 1 });
const activateByKey = (node: Element) => fireEvent.click(node, { detail: 0 });
const escape = () =>
  fireEvent.keyDown(document, { key: 'Escape', bubbles: true, cancelable: true });

describe('Dialog', () => {
  it('renders the anatomy the contract declares', () => {
    render(<Basic defaultOpen fullscreenToggle />);

    const parts = [...document.querySelectorAll('[data-part]')].map((node) =>
      node.getAttribute('data-part'),
    );
    for (const part of contract.members.dialog.parts) {
      expect(parts, `${part} is declared and never rendered`).toContain(part);
    }
    expect(layer()?.dataset['ui']).toBe('dialog');
  });

  /**
   * The reader's own control for taking the layer. `fullScreen` is the other
   * question — the responsive rule the consumer set in advance — and the two
   * are one hyphen apart in the DOM on purpose: `data-full-screen` carries the
   * axis, `data-fullscreen` carries what was pressed.
   */
  describe('the full-screen toggle', () => {
    const toggle = () => document.querySelector('[data-part="fullscreen"]') as HTMLButtonElement;

    it('is withdrawn until the layer asks for one', () => {
      render(<Basic defaultOpen />);
      expect(toggle()).toBeNull();
      expect(contract.members.dialog.defaults.fullscreenToggle).toBe(false);
    });

    it('takes the layer on a press and gives it back on the next one', () => {
      render(<Basic defaultOpen fullscreenToggle />);

      expect(toggle()).toHaveAttribute('aria-pressed', 'false');
      expect(layer()).not.toHaveAttribute('data-fullscreen');

      press(toggle());
      expect(layer()).toHaveAttribute('data-fullscreen', '');
      expect(toggle()).toHaveAttribute('aria-pressed', 'true');
      /* The axis is untouched: the reader pressed a control, not a prop. */
      expect(layer()).toHaveAttribute('data-full-screen', 'narrow');

      press(toggle());
      expect(layer()).not.toHaveAttribute('data-fullscreen');
    });

    it('draws the close as the x glyph, and draws nothing over content the consumer wrote', () => {
      const { unmount } = render(<Basic defaultOpen />);
      const close = () => document.querySelector('[data-part="close"]') as HTMLElement;
      expect(close().querySelector('[data-ui="icon"] > svg[data-glyph]')).toHaveAttribute(
        'data-glyph',
        'x',
      );
      unmount();

      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Own mark</DialogTitle>
              <DialogClose>Done</DialogClose>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );
      expect(close().querySelector('svg')).toBeNull();
      expect(close()).toHaveTextContent('Done');
    });

    it('draws what the press does next: maximize at rest, minimize once pressed', () => {
      render(<Basic defaultOpen fullscreenToggle />);
      const glyph = () => toggle().querySelector('[data-ui="icon"] > svg[data-glyph]');

      expect(glyph()).toHaveAttribute('data-glyph', 'maximize');
      press(toggle());
      expect(glyph()).toHaveAttribute('data-glyph', 'minimize');
    });

    it('stands in the corner beside the close, and not in place of it', () => {
      render(<Basic defaultOpen fullscreenToggle />);

      const header = document.querySelector('[data-part="header"]') as HTMLElement;
      const corner = [...header.children].map((node) => node.getAttribute('data-part'));
      expect(corner).toContain('close');
      expect(corner).toContain('fullscreen');
      expect(toggle().tagName).toBe('BUTTON');
      expect(toggle()).toHaveAccessibleName('Full screen');
    });

    it('names the corner controls in the language in force, and lays its own messages over it', () => {
      render(
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          <Basic defaultOpen fullscreenToggle messages={{ close: 'Close window' }} />
        </SlottedProvider>,
      );

      expect(toggle()).toHaveAccessibleName('Tela cheia');
      expect(screen.getByRole('button', { name: 'Close window' })).toBeInTheDocument();
    });

    it('carries the reason, and the keyboard says so', () => {
      const onFullscreenChange = vi.fn();
      render(<Basic defaultOpen fullscreenToggle onFullscreenChange={onFullscreenChange} />);

      activateByKey(toggle());
      expect(onFullscreenChange).toHaveBeenCalledWith(
        true,
        expect.objectContaining({ previous: false, reason: 'keyboard', value: true }),
      );
    });

    it('never moves state the consumer owns', () => {
      const onFullscreenChange = vi.fn();
      render(
        <Basic
          defaultOpen
          fullscreen={false}
          fullscreenToggle
          onFullscreenChange={onFullscreenChange}
        />,
      );

      press(toggle());
      expect(onFullscreenChange).toHaveBeenCalledOnce();
      expect(layer()).not.toHaveAttribute('data-fullscreen');
    });

    it('is refused by cancelling the request', () => {
      render(
        <Basic
          defaultOpen
          fullscreenToggle
          onFullscreenChange={(_fullscreen, request) => request.cancel()}
        />,
      );

      press(toggle());
      expect(layer()).not.toHaveAttribute('data-fullscreen');
    });

    /** A confirmation has no corner controls at all, for the reason it has no ✕. */
    it('is never rendered by an alert dialog', () => {
      render(<Confirm defaultOpen />);
      expect(toggle()).toBeNull();
      expect(contract.members.alertDialog.parts).not.toContain('fullscreen');
    });
  });

  it('writes every axis the contract declares as an attribute a consumer can style', async () => {
    render(<Basic defaultOpen fullScreen="always" placement="top" scroll="viewport" size="lg" />);
    /* A layer mounted open enters: `data-open` lands a frame after the mount. */
    await waitFor(() => expect(layer()).toHaveAttribute('data-open'));

    const root = layer() as HTMLElement;
    expect(root.dataset['size']).toBe('lg');
    expect(root.dataset['placement']).toBe('top');
    expect(root.dataset['scroll']).toBe('viewport');
    expect(root.dataset['fullScreen']).toBe('always');
    expect(root.dataset['mount']).toBe('active');
    expect(root).toHaveAttribute('data-open');
    expect(root).toHaveAttribute('data-modal');
  });

  /**
   * An owner that passes an inline `onOpenChange` gives the root a new context
   * value on each of its renders. A command palette re-renders on each highlight
   * move, and a layer that re-registered
   * on each one wrote `inert` on the whole background and the scroll lock on
   * the body per pointer move.
   */
  it('registers the layer once per open, however often the root re-renders', () => {
    function Owner({ tick }: { tick: number }) {
      return (
        <>
          <div data-testid="sibling" />
          <Basic onOpenChange={() => tick}>
            <span>{tick}</span>
          </Basic>
        </>
      );
    }
    const { rerender } = render(<Owner tick={0} />);
    const sibling = screen.getByTestId('sibling').parentElement as HTMLElement;
    const observer = new MutationObserver(() => {});
    observer.observe(document.documentElement, {
      attributeFilter: ['inert', 'style'],
      attributes: true,
      subtree: true,
    });

    press(trigger());
    const opening = observer.takeRecords();
    expect(opening.filter((r) => r.target === sibling && r.attributeName === 'inert')).toHaveLength(
      1,
    );

    for (let tick = 1; tick <= 5; tick += 1) rerender(<Owner tick={tick} />);
    const rerenders = observer.takeRecords();
    observer.disconnect();

    expect(sibling).toHaveAttribute('inert');
    expect(rerenders.filter((r) => r.attributeName === 'inert')).toHaveLength(0);
    expect(rerenders.filter((r) => r.target === document.body)).toHaveLength(0);
  });

  it('is not in the document at all while it is closed', () => {
    render(<Basic />);
    expect(layer()).toBeNull();
  });

  it('keeps the layer in the document and inert when it is mounted eagerly', () => {
    render(<Basic mount="eager" />);
    expect(layer()).not.toBeNull();
    expect(layer()).not.toHaveAttribute('data-open');
    expect(layer()).toHaveAttribute('inert');
  });

  it('opens from the trigger and says whether a pointer or a key did it', () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);

    press(trigger());
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true);
    expect((onOpenChange.mock.calls[0]?.[1] as DialogChangeRequest).reason).toBe('pointer');
    expect(panel()).not.toBeNull();
  });

  it('reports a keyboard activation as keyboard rather than as a pointer', () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);

    activateByKey(trigger());
    expect((onOpenChange.mock.calls[0]?.[1] as DialogChangeRequest).reason).toBe('keyboard');
  });

  /** The consumer owns the value: the family asks and waits. */
  it('does not move itself while it is controlled', () => {
    const onOpenChange = vi.fn();
    render(<Basic open={false} onOpenChange={onOpenChange} />);

    press(trigger());
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(panel()).toBeNull();
  });

  it('lets the consumer refuse a close while a form is saving', () => {
    render(
      <Basic
        defaultOpen
        onOpenChange={(open, request) => {
          if (!open) request.cancel();
        }}
      />,
    );

    escape();
    expect(panel()).not.toBeNull();
  });

  it('closes on Escape, carrying escape', () => {
    const onOpenChange = vi.fn();
    render(<Basic defaultOpen onOpenChange={onOpenChange} />);

    escape();
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
    expect((onOpenChange.mock.calls[0]?.[1] as DialogChangeRequest).reason).toBe('escape');
  });

  /**
   * The platform's way back reaches the layer and not the page: a modal layer
   * holds one history entry, and the popstate that leaves it closes the layer
   * with the reason back. A layer told not to answer holds no entry.
   */
  it('closes on the platform way back, carrying back', async () => {
    const onOpenChange = vi.fn();
    const length = history.length;
    render(<Basic defaultOpen onOpenChange={onOpenChange} />);
    expect(history.length).toBe(length + 1);

    const gesture = new Promise<void>((resolve) =>
      window.addEventListener('popstate', () => resolve(), { once: true }),
    );
    history.back();
    await gesture;

    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
    expect((onOpenChange.mock.calls[0]?.[1] as DialogChangeRequest).reason).toBe('back');
  });

  it('holds no history entry when the consumer says back does not close it', () => {
    const length = history.length;
    render(<Basic defaultOpen back="none" />);
    expect(history.length).toBe(length);
  });

  it('refuses Escape when the consumer says the layer does not answer it', () => {
    const onOpenChange = vi.fn();
    render(<Basic defaultOpen escape="none" onOpenChange={onOpenChange} />);

    escape();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes on a press outside the layer, carrying outsidePress', () => {
    const onOpenChange = vi.fn();
    render(<Basic defaultOpen onOpenChange={onOpenChange} />);

    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);
    expect((onOpenChange.mock.calls[0]?.[1] as DialogChangeRequest).reason).toBe('outsidePress');
  });

  /**
   * DG1. The scrim is inside the layer's node and was never a way out. It is
   * the click that decides, so a selection dragged out of the panel and let go
   * over the scrim closes nothing.
   */
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

  /** The trigger is a branch of the layer, or opening would close it again. */
  it('does not read a press on its own trigger as a press outside', () => {
    const onOpenChange = vi.fn();
    render(<Basic defaultOpen onOpenChange={onOpenChange} />);

    fireEvent.pointerDown(trigger());
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('refuses an outside press when the consumer says so', () => {
    const onOpenChange = vi.fn();
    render(<Basic defaultOpen outsidePress="none" onOpenChange={onOpenChange} />);
    const scrim = document.querySelector('[data-part="backdrop"]') as HTMLElement;

    fireEvent.pointerDown(scrim);
    fireEvent.click(scrim);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  /**
   * `docs/component-features.md` §8 calls the source `closeButton`; the closed
   * vocabulary in `docs/state-and-events.md` already holds the word for what a
   * close button means.
   */
  it('closes from the close button carrying dismiss and the result it names', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit</DialogTitle>
            <DialogClose value="dismissed" />
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    press(screen.getByRole('button', { name: 'Close' }));
    const request = onOpenChange.mock.calls[0]?.[1] as DialogChangeRequest;
    expect(request.reason).toBe('dismiss');
    expect(request.result).toBe('dismissed');
  });

  it('wires the trigger to the layer it opens', () => {
    render(<Basic defaultOpen />);

    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger().getAttribute('aria-controls')).toBe(panel()?.id);
  });

  it('names the layer by its title and describes it by its description', () => {
    render(<Basic defaultOpen />);

    const content = panel() as HTMLElement;
    expect(content).toHaveAttribute('role', 'dialog');
    expect(content).toHaveAttribute('aria-modal', 'true');
    expect(
      document.getElementById(content.getAttribute('aria-labelledby') ?? ''),
    ).toHaveTextContent('Edit project');
    expect(
      document.getElementById(content.getAttribute('aria-describedby') ?? ''),
    ).toHaveTextContent('Names are visible to everyone.');
  });

  /** An `aria-labelledby` pointing at an id nothing carries is worse than none. */
  it('writes no aria-labelledby when no title part was rendered', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent aria-label="Quick note">
          <DialogBody>text</DialogBody>
        </DialogContent>
      </Dialog>,
    );

    expect(panel()).not.toHaveAttribute('aria-labelledby');
    expect(panel()).toHaveAttribute('aria-label', 'Quick note');
  });

  /**
   * The APG warns that marking a dialog modal without making the background
   * inert has severe consequences for the readers who rely on the mark.
   */
  it('writes no aria-modal on a layer that leaves the background reachable', () => {
    render(<Basic defaultOpen modal={false} />);

    expect(panel()).not.toHaveAttribute('aria-modal');
    expect(layer()).not.toHaveAttribute('data-modal');
  });

  it('moves focus into the layer and gives it back to the trigger', () => {
    render(<Basic />);
    const opener = trigger();
    opener.focus();

    press(opener);
    expect(panel()?.contains(document.activeElement)).toBe(true);

    escape();
    expect(document.activeElement).toBe(opener);
  });

  /**
   * A browser refuses focus on an element inside an `inert` subtree, and the
   * background of a modal layer is inert until the layer is taken down. jsdom
   * does not refuse it, so the test records where the background stood at the
   * moment focus was handed back.
   */
  it('gives focus back to the trigger once the background is no longer inert', () => {
    render(<Basic />);
    const opener = trigger();
    opener.focus();
    press(opener);
    expect(opener.closest('[inert]')).not.toBeNull();

    const focus = vi.spyOn(opener, 'focus');
    let inertWhenFocused: boolean | undefined;
    focus.mockImplementation(function (this: HTMLElement) {
      inertWhenFocused = this.closest('[inert]') !== null;
      HTMLElement.prototype.focus.call(this);
    });

    escape();
    expect(focus).toHaveBeenCalled();
    expect(inertWhenFocused).toBe(false);
  });

  it('moves focus to the element the consumer names', () => {
    function Named() {
      const target = useRef<HTMLInputElement>(null);
      return (
        <Dialog defaultOpen initialFocus={target}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <input aria-label="First" />
              <input aria-label="Second" ref={target} />
            </DialogBody>
          </DialogContent>
        </Dialog>
      );
    }
    render(<Named />);

    expect(document.activeElement).toBe(screen.getByLabelText('Second'));
  });

  it('marks the row that is still loading as busy without locking the way out', () => {
    render(<Basic defaultOpen loading />);

    expect(document.querySelector('[data-part="body"]')).toHaveAttribute('aria-busy', 'true');
    expect(layer()).toHaveAttribute('data-loading');
    expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled();
  });

  /**
   * The layer without the picture. `render` substitutes the element the panel is
   * drawn on and not the drawing, so this is the only way to keep the portal,
   * the scrim, the containment and the dismissal policy around a box the
   * consumer paints.
   */
  it('turns the family’s own paint off and keeps everything that is not paint', () => {
    render(<Basic defaultOpen surface="plain" />);

    expect(layer()?.dataset['surface']).toBe('plain');
    expect(document.querySelector('[data-part="backdrop"]')).not.toBeNull();
    expect(panel()).toHaveAttribute('aria-modal', 'true');
    expect(panel()?.contains(document.activeElement)).toBe(true);
  });

  /**
   * The header places four parts and a consumer's fifth thing used to land in
   * whichever cell was free — column one when no icon was rendered, which is
   * where an alert dialog's mark goes.
   */
  it('gives a consumer’s own header content a column of its own', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice</DialogTitle>
            <DialogDescription>Issued on September 3.</DialogDescription>
            <span data-testid="badge">Overdue</span>
            <DialogClose />
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    const header = document.querySelector('[data-part="header"]') as HTMLElement;
    expect(header.contains(screen.getByTestId('badge'))).toBe(true);
    expect([...header.children].map((node) => node.getAttribute('data-part'))).toEqual([
      'title',
      'description',
      null,
      'close',
    ]);
  });

  it('lets an application set its defaults once', () => {
    render(
      <DialogDefaultsProvider size="xl" placement="top">
        <Basic defaultOpen />
      </DialogDefaultsProvider>,
    );

    expect(layer()?.dataset['size']).toBe('xl');
    expect(layer()?.dataset['placement']).toBe('top');
  });

  it('lets an explicit value win over the application’s defaults', () => {
    render(
      <DialogDefaultsProvider size="xl">
        <Basic defaultOpen size="sm" />
      </DialogDefaultsProvider>,
    );

    expect(layer()?.dataset['size']).toBe('sm');
  });

  it('opens and closes from the imperative handle, carrying programmatic', () => {
    const onOpenChange = vi.fn();
    function Imperative() {
      const handle = useRef<DialogHandle>(null);
      return (
        <>
          <button type="button" onClick={() => handle.current?.open()}>
            open
          </button>
          <button type="button" onClick={() => handle.current?.close('saved')}>
            close
          </button>
          {/* The buttons are outside the layer, and a press on them is a press
              outside: the policy is off so the handle is what closes it. */}
          <Dialog onOpenChange={onOpenChange} outsidePress="none" ref={handle}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>From code</DialogTitle>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </>
      );
    }
    render(<Imperative />);

    press(screen.getByRole('button', { name: 'open' }));
    expect((onOpenChange.mock.calls[0]?.[1] as DialogChangeRequest).reason).toBe('programmatic');
    expect(panel()).not.toBeNull();

    press(screen.getByRole('button', { name: 'close' }));
    expect((onOpenChange.mock.calls[1]?.[1] as DialogChangeRequest).result).toBe('saved');
  });

  it('runs the consumer’s own handler and lets it refuse the family’s', () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(
      <Dialog>
        <DialogTrigger onClick={onClick}>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Never</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    press(screen.getByRole('button', { name: 'Open' }));
    expect(onClick).toHaveBeenCalled();
    expect(panel()).toBeNull();
  });

  it('lets a consumer replace the element a part renders', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle render={(props) => <h1 {...props} />}>Edit</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('data-part', 'title');
  });

  it('keeps the state a controlled consumer owns in step with the layer', async () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>Edit project</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit project</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
    }
    render(<Controlled />);

    press(trigger());
    expect(panel()).not.toBeNull();
    escape();
    /* The exit completes a frame after the status moves, animated or not. */
    await waitFor(() => expect(panel()).toBeNull());
  });
});

describe('AlertDialog', () => {
  it('renders the anatomy the contract declares for its member', () => {
    render(<Confirm defaultOpen />);

    const parts = [...document.querySelectorAll('[data-part]')].map((node) =>
      node.getAttribute('data-part'),
    );
    for (const part of contract.members.alertDialog.parts) {
      expect(parts, `${part} is declared and never rendered`).toContain(part);
    }
  });

  it('takes the role the pattern gives it and a tone of its own', () => {
    render(<Confirm defaultOpen />);

    expect(panel()).toHaveAttribute('role', 'alertdialog');
    expect(layer()?.dataset['tone']).toBe('danger');
  });

  it.each([
    ['accent', 'status-info'],
    ['secondary', 'status-info'],
    ['success', 'status-success'],
    ['warning', 'status-warning'],
    ['danger', 'status-danger'],
  ] as const)('draws the %s mark as the %s glyph', (tone, glyph) => {
    render(<Confirm defaultOpen tone={tone} />);

    const icon = document.querySelector('[data-part="icon"]') as HTMLElement;
    const drawn = icon.querySelector('[data-ui="icon"] > svg[data-part="glyph"]');
    expect(drawn).toHaveAttribute('data-glyph', glyph);
    expect(drawn).toHaveAttribute('aria-hidden', 'true');
  });

  /**
   * Ark and React Aria make the role a prop, so a consumer who sets it and
   * forgets the dismissal policy ships a destructive confirmation a stray click
   * dismisses. Here the member fixes it.
   */
  it('never closes on an outside press, whatever the consumer asks for', () => {
    const onOpenChange = vi.fn();
    render(<Confirm defaultOpen onOpenChange={onOpenChange} />);

    fireEvent.pointerDown(document.body);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(panel()).not.toBeNull();
  });

  it('is modal whatever the consumer asks for', () => {
    render(<Confirm defaultOpen />);
    expect(panel()).toHaveAttribute('aria-modal', 'true');
  });

  /** The APG's own advice for a step that is not easily reversible. */
  it('focuses the least destructive action rather than the first tabbable one', () => {
    render(<Confirm defaultOpen />);

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep project' }));
  });

  it('closes from cancel with dismiss and from the action with submit', () => {
    const onOpenChange = vi.fn();
    render(<Confirm defaultOpen onOpenChange={onOpenChange} />);

    press(screen.getByRole('button', { name: 'Delete project' }));
    const request = onOpenChange.mock.calls[0]?.[1] as DialogChangeRequest;
    expect(request.reason).toBe('submit');
    expect(request.result).toBe('confirm');
  });

  it('carries dismiss and the cancel result from the cancel action', () => {
    const onOpenChange = vi.fn();
    render(<Confirm defaultOpen onOpenChange={onOpenChange} />);

    press(screen.getByRole('button', { name: 'Keep project' }));
    const request = onOpenChange.mock.calls[0]?.[1] as DialogChangeRequest;
    expect(request.reason).toBe('dismiss');
    expect(request.result).toBe('cancel');
  });

  it('answers Escape, because a member with a cancel action can always cancel', () => {
    const onOpenChange = vi.fn();
    render(<Confirm defaultOpen onOpenChange={onOpenChange} />);

    escape();
    expect((onOpenChange.mock.calls[0]?.[1] as DialogChangeRequest).reason).toBe('escape');
  });

  it('refuses a close button, which is two controls for one outcome', () => {
    expect(() =>
      render(
        <AlertDialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete?</DialogTitle>
              <DialogDescription>Gone for good.</DialogDescription>
              <DialogClose />
            </DialogHeader>
          </DialogContent>
        </AlertDialog>,
      ),
    ).toThrow(/no close part/i);
  });

  /** The alertdialog pattern makes `aria-describedby` mandatory. */
  it('refuses to ship without the description the pattern requires', () => {
    expect(() =>
      render(
        <AlertDialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete?</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </AlertDialog>,
      ),
    ).toThrow(/DialogDescription|aria-describedby/i);
  });
});

/**
 * An action in a confirmation that closes the dialog under it closes both in
 * one change. The confirmation gives focus back to the dialog's control that
 * opened it, and the dialog then gives it back to its own trigger.
 */
describe('stacked layers that close in one change', () => {
  function Stacked() {
    const [open, setOpen] = useState(false);
    const [confirming, setConfirming] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>Change address</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delivery address</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <button type="button" onClick={() => setConfirming(true)}>
              Cancel
            </button>
          </DialogFooter>
          <AlertDialog open={confirming} onOpenChange={setConfirming}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Discard the new address?</DialogTitle>
                <DialogDescription>The order keeps the previous one.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction onClick={() => setOpen(false)}>
                  Discard changes
                </AlertDialogAction>
              </DialogFooter>
            </DialogContent>
          </AlertDialog>
        </DialogContent>
      </Dialog>
    );
  }

  it('returns focus to the trigger of the outermost', async () => {
    render(<Stacked />);
    const opener = screen.getByRole('button', { name: 'Change address' });
    opener.focus();
    fireEvent.click(opener);
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    cancel.focus();
    fireEvent.click(cancel);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep editing' }));

    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(opener);
    expect(opener.closest('[inert]')).toBeNull();
  });
});

/**
 * The virtual keyboard covers the band of the layout viewport below the
 * visual one. A layer whose panel can cover it carries that band as
 * `--slotted-keyboard-inset`, and a centerd panel reads nothing from it.
 */
describe('the virtual keyboard', () => {
  const keyboard = (covered: number) => {
    const viewport = Object.assign(new EventTarget(), {
      height: window.innerHeight - covered,
      offsetTop: 0,
    });
    vi.stubGlobal('visualViewport', viewport);
    return viewport;
  };
  const inset = () => layer()?.style.getPropertyValue('--slotted-keyboard-inset') ?? '';

  it('writes what the keys cover on a full-screen layer, and follows them', () => {
    const viewport = keyboard(260);
    const { unmount } = render(
      <Dialog defaultOpen fullScreen="narrow">
        <DialogContent aria-label="Search" />
      </Dialog>,
    );
    expect(inset()).toBe('260px');

    viewport.height = window.innerHeight;
    act(() => {
      viewport.dispatchEvent(new Event('resize'));
    });
    expect(inset()).toBe('');
    unmount();
    vi.unstubAllGlobals();
  });

  it('leaves a centerd layer alone', () => {
    keyboard(260);
    render(
      <Dialog defaultOpen fullScreen="never">
        <DialogContent aria-label="Search" />
      </Dialog>,
    );
    expect(inset()).toBe('');
    vi.unstubAllGlobals();
  });
});
