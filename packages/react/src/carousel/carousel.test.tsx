import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/carousel/contract.json';
import { SlottedProvider } from '../i18n';
import { Carousel } from './carousel';
import {
  CarouselAutoplay,
  CarouselControls,
  CarouselCounter,
  CarouselIndicator,
  CarouselIndicators,
  CarouselNext,
  CarouselPrevious,
  CarouselSlide,
  CarouselViewport,
} from './carousel-parts';
import type { CarouselProps } from './carousel.types';

/**
 * jsdom lays nothing out. Each slide is given the viewport's width and stands
 * after the one before it, and the viewport's scroll offset moves every
 * slide — enough for the engine to read one page per slide.
 */
const WIDTH = 400;

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const part = this.getAttribute('data-part');
    if (part === 'slide' && this.parentElement !== null) {
      const index = [...this.parentElement.children].indexOf(this);
      const left = index * WIDTH - this.parentElement.scrollLeft;
      return {
        left,
        right: left + WIDTH,
        top: 0,
        bottom: 300,
        width: WIDTH,
        height: 300,
        x: left,
        y: 0,
        toJSON() {},
      } as DOMRect;
    }
    return {
      left: 0,
      right: WIDTH,
      top: 0,
      bottom: 300,
      width: WIDTH,
      height: 300,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect;
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.getAttribute('data-part') === 'viewport' ? WIDTH : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.getAttribute('data-part') === 'viewport' ? this.children.length * WIDTH : 0;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const NAMES = ['Terracotta Amphora', 'Sage Bottle', 'Lavender Bowl'];

function Basic(props: Partial<CarouselProps>) {
  return (
    <Carousel aria-label="Autumn Collection" {...props}>
      <CarouselViewport>
        {NAMES.map((name) => (
          <CarouselSlide key={name}>{name}</CarouselSlide>
        ))}
      </CarouselViewport>
      <CarouselPrevious />
      <CarouselNext />
      <CarouselControls>
        <CarouselAutoplay />
        <CarouselIndicators />
        <CarouselCounter />
      </CarouselControls>
    </Carousel>
  );
}

const tabs = () => screen.getAllByRole('tab');
const slides = (container: HTMLElement) => [...container.querySelectorAll('[data-part="slide"]')];

describe('Carousel', () => {
  it('writes the APG anatomy, in the words of the page', () => {
    const { container } = render(<Basic />);
    const root = container.querySelector('[data-ui="carousel"]');
    expect(root?.tagName).toBe('SECTION');
    expect(root).toHaveAttribute('aria-roledescription', 'carousel');
    expect(root).toHaveAttribute('aria-label', 'Autumn Collection');
    expect(slides(container)[0]).toHaveAttribute('aria-roledescription', 'slide');
    expect(slides(container)[0]).toHaveAttribute('aria-label', '1 of 3');
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Choose slide');
    expect(tabs()).toHaveLength(3);
    expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs()[0]).toHaveAttribute('aria-controls', slides(container)[0]?.id);
    expect(container.querySelector('[data-part="counter"]')).toHaveTextContent('1 / 3');
    expect(container.querySelector('[data-part="counter"]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('declares the defaults the contract declares', () => {
    const { container } = render(<Basic />);
    const root = container.querySelector('[data-ui="carousel"]');
    const defaults = contract.members.carousel.defaults;
    expect(root).toHaveAttribute('data-orientation', defaults.orientation);
    expect(root).toHaveAttribute('data-transition', defaults.transition);
    expect(root).toHaveAttribute('data-align', defaults.align);
    expect(root).toHaveAttribute('data-arrows', defaults.arrows);
    expect(root).toHaveAttribute('data-size', defaults.size);
    expect(root).not.toHaveAttribute('data-playing');
  });

  it('asks for the next page with the reason, and moves an uncontrolled carousel', () => {
    const onPageChange = vi.fn();
    const { container } = render(<Basic onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }), { detail: 1 });
    expect(onPageChange).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ reason: 'pointer', previous: 0 }),
    );
    expect(tabs()[1]).toHaveAttribute('aria-selected', 'true');
    expect(container.querySelector('[data-part="counter"]')).toHaveTextContent('2 / 3');
    expect(slides(container)[1]).toHaveAttribute('data-current');
  });

  it('keeps focus on a control at the end and says it has nowhere to go', () => {
    render(<Basic />);
    const previous = screen.getByRole('button', { name: 'Previous slide' });
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    expect(previous).not.toBeDisabled();
    previous.focus();
    fireEvent.click(previous);
    expect(document.activeElement).toBe(previous);
    expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('wraps past the ends with a loop', () => {
    const onPageChange = vi.fn();
    render(<Basic loop onPageChange={onPageChange} />);
    const previous = screen.getByRole('button', { name: 'Previous slide' });
    expect(previous).not.toHaveAttribute('aria-disabled');
    fireEvent.click(previous, { detail: 0 });
    expect(onPageChange).toHaveBeenCalledWith(2, expect.objectContaining({ reason: 'keyboard' }));
  });

  it('never moves a page the consumer owns, and follows the one it sets', () => {
    function Controlled({ accept }: { accept: boolean }) {
      const [page, setPage] = useState(0);
      return <Basic page={page} onPageChange={(next) => accept && setPage(next)} />;
    }
    const { unmount } = render(<Controlled accept={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
    unmount();
    render(<Controlled accept />);
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(tabs()[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('commits nothing when the request is cancelled', () => {
    render(<Basic onPageChange={(_page, request) => request.cancel()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('pages the viewport from the keyboard and mirrors the inline axis', () => {
    const onPageChange = vi.fn();
    render(<Basic onPageChange={onPageChange} />);
    const viewport = screen.getByRole('group', { name: 'Slides' });
    expect(viewport).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(viewport, { key: 'ArrowRight' });
    expect(onPageChange).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ reason: 'keyboard' }),
    );
    fireEvent.keyDown(viewport, { key: 'End' });
    expect(onPageChange).toHaveBeenLastCalledWith(2, expect.anything());
    fireEvent.keyDown(viewport, { key: 'ArrowDown' });
    expect(onPageChange).toHaveBeenCalledTimes(2);
  });

  it('moves the page with the slide picker, which stops at its ends', () => {
    const onPageChange = vi.fn();
    render(<Basic onPageChange={onPageChange} />);
    fireEvent.click(tabs()[2] as HTMLElement, { detail: 1 });
    expect(onPageChange).toHaveBeenLastCalledWith(
      2,
      expect.objectContaining({ reason: 'pointer' }),
    );
    tabs()[2]?.focus();
    fireEvent.keyDown(tabs()[2] as HTMLElement, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(tabs()[2]);
    fireEvent.keyDown(tabs()[2] as HTMLElement, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(tabs()[1]);
    expect(onPageChange).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('hides the slides out of view from assistive technology', () => {
    const { container } = render(<Basic />);
    expect(slides(container)[0]).not.toHaveAttribute('inert');
    expect(slides(container)[0]).toHaveAttribute('data-inview');
    expect(slides(container)[1]).toHaveAttribute('inert');
  });

  it('leaves a name the consumer gave a slide alone', () => {
    const { container } = render(
      <Carousel aria-label="Galeria">
        <CarouselViewport>
          <CarouselSlide aria-label="Jarro Mel, vista de frente">a</CarouselSlide>
          <CarouselSlide>b</CarouselSlide>
        </CarouselViewport>
      </Carousel>,
    );
    expect(slides(container)[0]).toHaveAttribute('aria-label', 'Jarro Mel, vista de frente');
    expect(slides(container)[1]).toHaveAttribute('aria-label', '2 of 2');
  });

  it('draws thumbnails from a function child', () => {
    render(
      <Carousel aria-label="Galeria">
        <CarouselViewport>
          {NAMES.map((name) => (
            <CarouselSlide key={name}>{name}</CarouselSlide>
          ))}
        </CarouselViewport>
        <CarouselIndicators variant="thumbnails">
          {(page) => (
            <CarouselIndicator key={page} page={page}>
              <img alt={NAMES[page]} src="data:," />
            </CarouselIndicator>
          )}
        </CarouselIndicators>
      </Carousel>,
    );
    expect(screen.getByRole('tablist')).toHaveAttribute('data-variant', 'thumbnails');
    expect(screen.getByRole('tab', { name: 'Lavender Bowl' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('speaks the language in force, and lays its own messages over it', () => {
    const { container } = render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        {/* language: pt-BR */}
        <Basic messages={{ previous: 'Voltar' }} />
        {/* language: en-US */}
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Próximo slide' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
    // language: en-US
    expect(slides(container)[0]).toHaveAttribute('aria-label', '1 de 3');
  });

  it('writes the slides per view as the runtime property the stylesheet reads', () => {
    const { container } = render(<Basic slidesPerView={3} />);
    const root = container.querySelector<HTMLElement>('[data-ui="carousel"]');
    expect(root?.style.getPropertyValue('--slotted-carousel-slides-per-view')).toBe('3');
  });
});

describe('Carousel rotation', () => {
  it('never rotates unless asked, and draws no rotation control', () => {
    render(<Basic />);
    expect(screen.queryByRole('button', { name: /rotation/ })).toBeNull();
  });

  it('advances on the timer with the reason timeout, and names its control by the action', () => {
    vi.useFakeTimers();
    const onPageChange = vi.fn();
    const { container } = render(<Basic autoplay={1000} loop onPageChange={onPageChange} />);
    expect(container.querySelector('[data-ui="carousel"]')).toHaveAttribute('data-playing');
    expect(screen.getByRole('button', { name: 'Stop rotation' })).not.toHaveAttribute(
      'aria-pressed',
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onPageChange).toHaveBeenCalledWith(1, expect.objectContaining({ reason: 'timeout' }));
    expect(
      container
        .querySelector<HTMLElement>('[data-ui="carousel"]')
        ?.style.getPropertyValue('--slotted-carousel-autoplay-delay'),
    ).toBe('1000ms');
  });

  it('stops when keyboard focus enters, and only the control starts it again', () => {
    vi.useFakeTimers();
    const onPlayingChange = vi.fn();
    render(<Basic autoplay onPlayingChange={onPlayingChange} />);
    /* jsdom never matches :focus-visible; the browser does after a Tab. */
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
      this: Element,
      selector: string,
    ) {
      return selector === ':focus-visible' ? true : matches.call(this, selector);
    });
    act(() => {
      screen.getByRole('group', { name: 'Slides' }).focus();
    });
    expect(onPlayingChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'keyboard' }),
    );
    const control = screen.getByRole('button', { name: 'Resume rotation' });
    fireEvent.click(control, { detail: 1 });
    expect(onPlayingChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('stops at the last page without a loop, with the reason timeout', () => {
    vi.useFakeTimers();
    const onPlayingChange = vi.fn();
    render(<Basic autoplay={500} defaultPage={2} onPlayingChange={onPlayingChange} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onPlayingChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'timeout' }),
    );
  });

  it('holds the time that was left while the pointer rests on it', () => {
    vi.useFakeTimers();
    const onPageChange = vi.fn();
    const { container } = render(<Basic autoplay={1000} onPageChange={onPageChange} />);
    const root = container.querySelector('[data-ui="carousel"]') as HTMLElement;
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.pointerEnter(root, { pointerType: 'mouse' });
    expect(root).toHaveAttribute('data-paused');
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onPageChange).not.toHaveBeenCalled();
    fireEvent.pointerLeave(root, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onPageChange).toHaveBeenCalledOnce();
  });

  it('does not start for a reader who asked for reduced motion', () => {
    const matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} });
    vi.stubGlobal('matchMedia', matchMedia);
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia });
    const { container } = render(<Basic autoplay />);
    expect(container.querySelector('[data-ui="carousel"]')).not.toHaveAttribute('data-playing');
    expect(screen.getByRole('button', { name: 'Resume rotation' })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
