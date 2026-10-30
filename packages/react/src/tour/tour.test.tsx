import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';

import contract from '../../../../specs/components/tour/contract.json';
import { Dialog, DialogBody, DialogContent, DialogTitle } from '../dialog';
import { SlottedProvider } from '../i18n';
import { Tour, useTour } from './tour';
import { TourContent, TourFooter, TourNext, TourTitle } from './tour-parts';
import type { TourHandle, TourProps, TourStep } from './tour.types';

afterEach(() => document.body.replaceChildren());

const steps: TourStep[] = [
  { id: 'welcome', title: 'Welcome to Reports', description: 'Five stops, about a minute.' },
  { id: 'share', target: '#share', title: 'Share with your team' },
  { id: 'export', target: '#export', title: 'Export what you see' },
];

function Page(props: Partial<TourProps> & { input?: boolean }) {
  const { input, ...rest } = props;
  return (
    <>
      <button id="opener" type="button">
        Help
      </button>
      <button id="share" type="button">
        Share
      </button>
      <button id="export" type="button">
        Export
      </button>
      {input && <input aria-label="Search" id="search" />}
      <Tour steps={steps} {...rest} />
    </>
  );
}

const root = () => document.querySelector<HTMLElement>('[data-ui="tour"]');
const card = () => document.querySelector<HTMLElement>('[data-ui="tour"] [data-part="content"]');
const part = (name: string) =>
  document.querySelector<HTMLElement>(`[data-ui="tour"] [data-part="${name}"]`);
const title = () => part('title')?.textContent;

async function opened(props: Partial<TourProps> = {}) {
  const view = render(<Page defaultOpen {...props} />);
  await waitFor(() => expect(card()).not.toBeNull());
  return view;
}

describe('Tour', () => {
  it('renders the contract identity and the whole card when nothing is composed', async () => {
    await opened();
    expect(root()).toHaveAttribute('data-ui', contract.ui);
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(card()).toHaveAttribute('role', 'dialog');
    expect(card()).toHaveAttribute('aria-labelledby', part('title')?.id);
    expect(card()).toHaveAttribute('aria-describedby', part('description')?.id);
    expect(part('progress')).toHaveTextContent('1 of 3');
    expect(title()).toBe('Welcome to Reports');
  });

  it('centres a step with no target and anchors a step with one', async () => {
    await opened();
    expect(root()).toHaveAttribute('data-placement', 'centered');
    expect(part('spotlight')).toBeNull();
    fireEvent.click(part('next')!);
    await waitFor(() => expect(title()).toBe('Share with your team'));
    expect(root()).toHaveAttribute('data-placement', 'anchored');
    expect(root()).toHaveAttribute('data-spotlight');
    expect(part('spotlight')).not.toBeNull();
  });

  it('asks for each step move with its reason, and shows Back from the second step', async () => {
    const onStepChange = vi.fn();
    await opened({ onStepChange });
    expect(part('prev')).toBeNull();
    fireEvent.click(part('next')!, { detail: 1 });
    await waitFor(() => expect(title()).toBe('Share with your team'));
    expect(onStepChange).toHaveBeenLastCalledWith(
      'share',
      expect.objectContaining({ reason: 'pointer', previous: 'welcome' }),
    );
    expect(part('prev')).not.toBeNull();
    fireEvent.click(part('prev')!, { detail: 0 });
    await waitFor(() => expect(title()).toBe('Welcome to Reports'));
    expect(onStepChange).toHaveBeenLastCalledWith(
      'welcome',
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('reads Done on the last step and closes with the outcome complete', async () => {
    const onOpenChange = vi.fn();
    await opened({ defaultStep: 'export', onOpenChange });
    expect(part('next')).toHaveTextContent('Done');
    expect(part('next')).toHaveAttribute('data-last');
    expect(part('skip')).toBeNull();
    fireEvent.click(part('next')!);
    await waitFor(() =>
      expect(onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ outcome: 'complete' }),
      ),
    );
    await waitFor(() => expect(root()).toBeNull());
  });

  it('tells skip, close and Escape apart by outcome and reason', async () => {
    const onOpenChange = vi.fn();
    const first = await opened({ onOpenChange });
    fireEvent.click(part('skip')!, { detail: 1 });
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ outcome: 'skip', reason: 'pointer' }),
    );
    first.unmount();

    const second = await opened({ onOpenChange });
    /* The cross is the library's `Glyph` in an `icon`, not a painted mask. */
    expect(part('close')!.querySelector('[data-ui="icon"] > svg[data-glyph="x"]')).not.toBeNull();
    fireEvent.click(part('close')!);
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ outcome: 'close', reason: 'dismiss' }),
    );
    second.unmount();

    await opened({ onOpenChange });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ outcome: 'close', reason: 'escape' }),
    );
  });

  it('refuses Escape when closeOnEscape is false', async () => {
    const onOpenChange = vi.fn();
    await opened({ closeOnEscape: false, onOpenChange });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(card()).not.toBeNull();
  });

  it('passes over a step whose condition is false, and does not count it', async () => {
    const conditional = steps.map((step) =>
      step.id === 'share' ? { ...step, when: () => false } : step,
    );
    await opened({ steps: conditional });
    expect(part('progress')).toHaveTextContent('1 of 2');
    fireEvent.click(part('next')!);
    await waitFor(() => expect(title()).toBe('Export what you see'));
  });

  it('centres a step whose target is missing, and marks the root', async () => {
    const lost = [{ id: 'lost', target: '#nowhere', title: 'Find it in the sidebar' }];
    await opened({ steps: lost });
    expect(root()).toHaveAttribute('data-missing');
    expect(root()).toHaveAttribute('data-placement', 'centered');
  });

  it('passes over a step whose target is missing under missing="skip"', async () => {
    const lost: TourStep[] = [
      { id: 'lost', target: '#nowhere', title: 'Gone' },
      { id: 'share', target: '#share', title: 'Share with your team' },
    ];
    await opened({ missing: 'skip', steps: lost });
    expect(title()).toBe('Share with your team');
  });

  it('closes with the outcome unavailable when no step can be shown, without painting', async () => {
    const onOpenChange = vi.fn();
    render(
      <Page
        defaultOpen
        onOpenChange={onOpenChange}
        steps={[{ id: 'x', title: 'X', when: () => false }]}
      />,
    );
    await waitFor(() =>
      expect(onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ outcome: 'unavailable' }),
      ),
    );
    expect(root()).toBeNull();
  });

  it('holds a controlled step until the consumer moves it', async () => {
    function Controlled() {
      const [step, setStep] = useState<string | null>('welcome');
      return (
        <>
          <output data-testid="step">{step}</output>
          <Page
            open
            step={step}
            onStepChange={(next) => setStep(next === 'export' ? null : next)}
          />
        </>
      );
    }
    render(<Controlled />);
    await waitFor(() => expect(title()).toBe('Welcome to Reports'));
    fireEvent.click(part('next')!);
    await waitFor(() => expect(title()).toBe('Share with your team'));
    expect(screen.getByTestId('step')).toHaveTextContent('share');
  });

  it('goes on and back with the arrow keys, mirrored right to left, and not from a text field', async () => {
    await opened();
    fireEvent.keyDown(card()!, { key: 'ArrowRight' });
    await waitFor(() => expect(title()).toBe('Share with your team'));
    fireEvent.keyDown(card()!, { key: 'ArrowLeft' });
    await waitFor(() => expect(title()).toBe('Welcome to Reports'));

    card()!.setAttribute('dir', 'rtl');
    fireEvent.keyDown(card()!, { key: 'ArrowLeft' });
    await waitFor(() => expect(title()).toBe('Share with your team'));
    card()!.removeAttribute('dir');
  });

  it('leaves the arrows to a field inside the card', async () => {
    const withField = [
      { id: 'a', title: 'Name it', content: <input aria-label="Name" /> },
      { id: 'b', title: 'Second' },
    ];
    await opened({ steps: withField });
    fireEvent.keyDown(screen.getByLabelText('Name'), { key: 'ArrowRight' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(title()).toBe('Name it');
  });

  it('makes the page inert on a modal step, and writes aria-modal only then', async () => {
    await opened();
    expect(card()).toHaveAttribute('aria-modal', 'true');
    expect(root()).toHaveAttribute('data-modal');
    expect(document.getElementById('share')?.closest('[inert]')).not.toBeNull();
  });

  it('leaves the page reachable on an interactive step, with focus guards', async () => {
    const act1: TourStep[] = [
      { id: 'act', target: '#share', title: 'Press Share', interactive: true, advanceOn: 'click' },
      { id: 'after', title: 'Shared' },
    ];
    await opened({ steps: act1 });
    expect(card()).not.toHaveAttribute('aria-modal');
    expect(root()).not.toHaveAttribute('data-modal');
    expect(document.getElementById('share')?.closest('[inert]')).toBeNull();
    expect(document.querySelectorAll('[data-part="focus-guard"]')).toHaveLength(2);
    expect(part('next')).toBeNull();

    fireEvent.focus(document.querySelectorAll('[data-part="focus-guard"]')[1]!);
    expect(document.activeElement).toBe(document.getElementById('share'));

    fireEvent.click(document.getElementById('share')!, { detail: 1 });
    await waitFor(() => expect(title()).toBe('Shared'));
  });

  it('waits on prepare with Next loading, then shows the step it prepared', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const prepared: TourStep[] = [
      { id: 'a', title: 'First' },
      { id: 'b', title: 'Prepared', prepare: () => gate },
    ];
    await opened({ steps: prepared });
    fireEvent.click(part('next')!);
    await waitFor(() => expect(part('next')).toHaveAttribute('data-loading'));
    expect(title()).toBe('First');
    await act(async () => release());
    await waitFor(() => expect(title()).toBe('Prepared'));
  });

  it('focuses the card on open, and gives focus back to where it was on close', async () => {
    render(<Page />);
    const opener = document.getElementById('opener')!;
    opener.focus();

    function Start() {
      const tour = useRef<TourHandle>(null);
      return (
        <>
          <button onClick={() => tour.current?.start()} type="button">
            Start
          </button>
          <Tour ref={tour} steps={steps} />
        </>
      );
    }
    document.body.replaceChildren();
    render(<Start />);
    const start = screen.getByRole('button', { name: 'Start' });
    start.focus();
    fireEvent.click(start);
    await waitFor(() => expect(document.activeElement).toBe(card()));
    fireEvent.click(part('skip')!);
    await waitFor(() => expect(document.activeElement).toBe(start));
  });

  it('starts at a named step from the handle, and goes to one', async () => {
    const tour = { current: null as TourHandle | null };
    render(<Tour ref={(node) => void (tour.current = node)} steps={steps} />);
    act(() => tour.current?.start('export'));
    await waitFor(() => expect(title()).toBe('Export what you see'));
    act(() => tour.current?.goTo('welcome'));
    await waitFor(() => expect(title()).toBe('Welcome to Reports'));
  });

  it('speaks the language in force, under the tour’s messages and a step’s own', async () => {
    const labelled = [
      { id: 'a', title: 'First', messages: { next: 'Start tour' } },
      { id: 'b', title: 'Second' },
    ];
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        {/* language: pt-BR */}
        <Tour defaultOpen messages={{ skip: 'Agora não' }} steps={labelled} />
        {/* language: en-US */}
      </SlottedProvider>,
    );
    await waitFor(() => expect(card()).not.toBeNull());
    expect(part('progress')).toHaveTextContent('1 de 2');
    // language: pt-BR
    expect(part('skip')).toHaveTextContent('Agora não');
    // language: en-US
    expect(part('next')).toHaveTextContent('Start tour');
    // language: pt-BR
    expect(part('close')).toHaveAttribute('aria-label', 'Fechar tour');
    // language: en-US
  });

  it('lets a consumer compose the card from the parts and the hook', async () => {
    function Dots() {
      const tour = useTour();
      return <span data-testid="dots">{`${tour.position}/${tour.total}`}</span>;
    }
    render(
      <Tour defaultOpen steps={steps}>
        <TourContent aria-label="Guide">
          <TourTitle />
          <Dots />
          <TourFooter>
            <TourNext>Onward</TourNext>
          </TourFooter>
        </TourContent>
      </Tour>,
    );
    await waitFor(() => expect(card()).not.toBeNull());
    expect(screen.getByTestId('dots')).toHaveTextContent('1/3');
    expect(part('next')).toHaveTextContent('Onward');
    expect(part('progress')).toBeNull();
  });

  it("runs the consumer's own handler, and lets it prevent the family's", async () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <Tour defaultOpen steps={steps}>
        <TourContent>
          <TourTitle />
          <TourNext onClick={onClick} />
        </TourContent>
      </Tour>,
    );
    await waitFor(() => expect(card()).not.toBeNull());
    fireEvent.click(part('next')!);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onClick).toHaveBeenCalledOnce();
    expect(title()).toBe('Welcome to Reports');
  });

  it('resumes where it was closed, and starts over after it was skipped', async () => {
    function Reopen() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button onClick={() => setOpen(true)} type="button">
            Reopen
          </button>
          <Tour open={open} onOpenChange={setOpen} steps={steps} />
        </>
      );
    }
    render(<Reopen />);
    await waitFor(() => expect(card()).not.toBeNull());
    fireEvent.click(part('next')!);
    await waitFor(() => expect(title()).toBe('Share with your team'));
    fireEvent.click(part('close')!);
    await waitFor(() => expect(root()).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Reopen' }));
    await waitFor(() => expect(title()).toBe('Share with your team'));
    fireEvent.click(part('skip')!);
    await waitFor(() => expect(root()).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Reopen' }));
    await waitFor(() => expect(title()).toBe('Welcome to Reports'));
  });

  it('turns a lateral side vertical and marks the root compact on a phone-width viewport', async () => {
    const width = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    try {
      await opened({ defaultStep: 'share', side: 'inline-end' });
      await waitFor(() => expect(root()).toHaveAttribute('data-compact'));
      await waitFor(() => expect(part('surface')?.getAttribute('data-side')).toBe('bottom'));
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    }
  });

  it('centres the card over a target that leaves it no room, and keeps the spotlight on it', async () => {
    const editor = document.createElement('div');
    editor.id = 'editor';
    document.body.append(editor);
    editor.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        width: 1024,
        height: 768,
        right: 1024,
        bottom: 768,
      }) as DOMRect;
    render(
      <Tour defaultOpen steps={[{ id: 'e', target: '#editor', title: 'The whole editor' }]} />,
    );
    await waitFor(() => expect(card()).not.toBeNull());
    await waitFor(() => expect(root()).toHaveAttribute('data-placement', 'centered'));
    expect(root()).toHaveAttribute('data-spotlight');
    expect(part('arrow')).toBeNull();
  });

  /**
   * A tour started over an open modal dialog, pointing at a control inside it:
   * the card is a layer above the dialog, so the dialog's own focus trap must
   * let focus go to it, and Escape closes the tour before the dialog.
   */
  it('works over an open modal dialog, on a target inside it', async () => {
    const onDialog = vi.fn();
    const tour = { current: null as TourHandle | null };
    render(
      <>
        <Dialog defaultOpen onOpenChange={onDialog}>
          <DialogContent>
            <DialogTitle>Invite people</DialogTitle>
            <DialogBody>
              <button id="invite" type="button">
                Send invites
              </button>
            </DialogBody>
          </DialogContent>
        </Dialog>
        <Tour
          ref={(node) => void (tour.current = node)}
          steps={[{ id: 'invite', target: '#invite', title: 'Send when ready' }]}
        />
      </>,
    );
    await waitFor(() => expect(document.querySelector('[data-ui="dialog"]')).not.toBeNull());
    act(() => tour.current?.start());
    await waitFor(() => expect(card()).not.toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(card()));
    expect(root()).toHaveAttribute('data-placement', 'anchored');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(root()).toBeNull());
    expect(onDialog).not.toHaveBeenCalled();
  });

  /**
   * The dialog opens after the tour, from a step's prepare, and would stand
   * over it: the tour is raised back on top, stays reachable, keeps focus in
   * its card, and the dialog is the layer made inert.
   */
  it('stays on top of a dialog one of its steps opened', async () => {
    /* The theme's durations, as a page has them: the card arrives after the
       dialog the step opened has taken focus, and takes it back. */
    document.documentElement.style.setProperty('--slotted-duration-medium', '40ms');
    document.documentElement.style.setProperty('--slotted-duration-long', '60ms');
    document.documentElement.style.setProperty('--slotted-duration-short', '20ms');
    onTestFinished(() => {
      for (const token of ['medium', 'long', 'short']) {
        document.documentElement.style.removeProperty(`--slotted-duration-${token}`);
      }
    });
    function Flow() {
      const [dialog, setDialog] = useState(false);
      const steps: TourStep[] = [
        { id: 'start', title: 'Invite your team' },
        {
          id: 'email',
          target: '#email',
          title: 'Type their emails',
          prepare: () =>
            new Promise<void>((resolve) => {
              setDialog(true);
              setTimeout(resolve, 50);
            }),
        },
      ];
      return (
        <>
          <Dialog onOpenChange={setDialog} open={dialog}>
            <DialogContent>
              <DialogTitle>Invite people</DialogTitle>
              <DialogBody>
                <input aria-label="Emails" id="email" />
              </DialogBody>
            </DialogContent>
          </Dialog>
          <Tour defaultOpen steps={steps} />
        </>
      );
    }
    render(<Flow />);
    await waitFor(() => expect(card()).not.toBeNull());
    card()!.focus();
    fireEvent.click(part('next')!);
    await waitFor(() => expect(title()).toBe('Type their emails'));
    await waitFor(() => expect(document.activeElement).toBe(card()));
    expect(root()?.closest('[inert]')).toBeNull();
    const dialogRoot = document.querySelector('[data-ui="dialog"]');
    expect(dialogRoot?.closest('[inert]')).not.toBeNull();
    expect(root()).toHaveAttribute('data-placement', 'anchored');
  });

  /**
   * The theme is an attribute on a region, and the layer takes it from its
   * origin. A first step with no target has none to give, so the layer takes
   * it from where the tour was started.
   */
  it('draws a centred first step in the theme of the region the tour was started from', async () => {
    const tour = { current: null as TourHandle | null };
    render(
      <div data-slotted-scheme="dark" data-slotted-theme="default">
        <button type="button">Start</button>
        <Tour ref={(node) => void (tour.current = node)} steps={steps} />
      </div>,
    );
    screen.getByRole('button', { name: 'Start' }).focus();
    act(() => tour.current?.start());
    await waitFor(() => expect(card()).not.toBeNull());
    const layer = root()?.parentElement;
    expect(layer).toHaveAttribute('data-slotted-scheme', 'dark');
    expect(layer).toHaveAttribute('data-slotted-theme', 'default');
  });

  /**
   * The choreography, read off the attributes the stylesheet animates: the
   * cutout lights where the tour opens, travels between two targets, closes
   * before a centred step, and rests in between; the card leaves while it
   * moves and is drawn again only once it is placed.
   */
  describe('choreography', () => {
    beforeEach(() => {
      document.documentElement.style.setProperty('--slotted-duration-long', '60ms');
      document.documentElement.style.setProperty('--slotted-duration-short', '20ms');
    });
    afterEach(() => {
      document.documentElement.style.removeProperty('--slotted-duration-long');
      document.documentElement.style.removeProperty('--slotted-duration-short');
    });

    const surface = () => part('surface');
    const walk: TourStep[] = [
      { id: 'share', target: '#share', title: 'Share with your team' },
      { id: 'export', target: '#export', title: 'Export what you see' },
      { id: 'done', title: 'You are set' },
    ];

    it('lights the first cutout, and brings the card in once it is placed', async () => {
      await opened({ steps: walk });
      expect(['light', 'rest']).toContain(root()?.getAttribute('data-spot'));
      await waitFor(() => expect(surface()).toHaveAttribute('data-ready'));
      await waitFor(() => expect(root()).toHaveAttribute('data-spot', 'rest'));
    });

    it('lets the card leave while the cutout travels, then draws the next card', async () => {
      await opened({ steps: walk });
      await waitFor(() => expect(root()).toHaveAttribute('data-spot', 'rest'));
      fireEvent.click(part('next')!);
      await waitFor(() => expect(root()).toHaveAttribute('data-spot', 'travel'));
      expect(surface()).toHaveAttribute('data-leaving');
      expect(title()).toBe('Share with your team');
      await waitFor(() => expect(title()).toBe('Export what you see'));
      expect(surface()).not.toHaveAttribute('data-leaving');
      await waitFor(() => expect(root()).toHaveAttribute('data-spot', 'rest'));
      await waitFor(() => expect(surface()).toHaveAttribute('data-ready'));
    });

    it('closes the cutout on its old target before a centred step', async () => {
      await opened({ steps: walk, defaultStep: 'export' });
      await waitFor(() => expect(root()).toHaveAttribute('data-spot', 'rest'));
      fireEvent.click(part('next')!);
      await waitFor(() => expect(root()).toHaveAttribute('data-spot', 'close'));
      expect(part('spotlight')).not.toBeNull();
      await waitFor(() => expect(title()).toBe('You are set'));
      await waitFor(() => expect(part('spotlight')).toBeNull());
      expect(root()).toHaveAttribute('data-placement', 'centered');
    });
  });
});
