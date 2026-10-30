import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import carouselTokens from '@slotted/styles/carousel/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_CAROUSEL_TOKENS = carouselTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Carousel decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  Carousel,\n  CarouselAutoplay,\n  CarouselControls,\n  CarouselCounter,\n  CarouselIndicator,\n  CarouselIndicators,\n  CarouselNext,\n  CarouselPrevious,\n  CarouselSlide,\n  CarouselViewport,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'section (Carousel), or the element render returns',
    required: true,
    purpose:
      'The region, with aria-roledescription "carousel" and the name the consumer gives it. A one-cell grid: previous, next and an overlay bar written as its children stand over the viewport. Carries data-orientation, data-transition, data-align, data-arrows, data-size, and data-playing, data-paused, data-dragging and data-measured.',
  },
  {
    part: 'viewport',
    element: 'div (CarouselViewport)',
    required: true,
    purpose:
      'The scroller with snap — or, in fade, the stack — and a tab stop of its own: the arrows of its axis, PageUp, PageDown, Home and End move a page.',
  },
  {
    part: 'slide',
    element: 'div (CarouselSlide)',
    required: true,
    purpose:
      'A group named "3 of 8" unless it carries a name; data-current on the slides of the page shown, data-inview on the ones in view, and inert on the ones that are not.',
  },
  {
    part: 'previous',
    element: 'button (CarouselPrevious)',
    required: false,
    purpose:
      'Shows the previous page. aria-disabled at the first page without a loop, so a focused control keeps its focus. Over the viewport as a child of the root, in the bar as a child of controls.',
  },
  {
    part: 'next',
    element: 'button (CarouselNext)',
    required: false,
    purpose: 'Shows the next page, with the same rules as previous at the last page.',
  },
  {
    part: 'controls',
    element: 'div (CarouselControls)',
    required: false,
    purpose:
      'The bar the controls stand in: placement "below" under the viewport, "overlay" on a pill of the raised surface over its foot.',
  },
  {
    part: 'autoplay',
    element: 'button (CarouselAutoplay)',
    required: false,
    purpose:
      'The rotation control, named by the action it performs — Stop rotation, Resume rotation — with no pressed state. Renders nothing in a carousel that does not rotate. Written first, so it is first in the tab sequence.',
  },
  {
    part: 'indicators',
    element: 'div role="tablist" (CarouselIndicators)',
    required: false,
    purpose:
      'The slide picker, one tab stop. variant "dots", "line" or "thumbnails"; past eight pages the dots window themselves (data-adaptive).',
  },
  {
    part: 'indicator',
    element: 'button role="tab" (CarouselIndicator)',
    required: false,
    purpose:
      'One page. aria-selected on the page shown, aria-controls naming its first slide. While the rotation runs the current one fills over the delay.',
  },
  {
    part: 'counter',
    element: 'span aria-hidden (CarouselCounter)',
    required: false,
    purpose: '"3 / 8" in tabular figures, isolated so a right-to-left page reads it first to last.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A slideshow of the workshop’s pieces with every axis below the canvas. Press next, drag with the mouse, swipe on a touch screen, or focus the viewport and use the arrows: the dots, the counter and the slide names follow.',
    snippet: defineSnippet({
      id: 'carousel-react-playground',
      language: 'tsx',
      label: 'A slideshow with arrows, dots and a counter',
      source: `<Carousel aria-label="Autumn Collection">
  <CarouselViewport>
    {pieces.map((piece) => (
      <CarouselSlide key={piece.name}>
        <Image alt={piece.name} ratio="landscape" src={piece.image} />
      </CarouselSlide>
    ))}
  </CarouselViewport>
  <CarouselPrevious />
  <CarouselNext />
  <CarouselControls>
    <CarouselIndicators />
    <CarouselCounter />
  </CarouselControls>
</Carousel>;`,
    }),
  },
  {
    id: 'orientation',
    title: 'A column of slides',
    note: 'orientation="vertical" turns the scroller and both arrows a quarter; the arrows of the keyboard that page it are now Up and Down, and Left and Right are left to the page. The column needs a height, which --slotted-carousel-viewport-size gives it.',
    snippet: defineSnippet({
      id: 'carousel-react-orientation',
      language: 'tsx',
      label: 'Vertical, two slides per view',
      source: `<Carousel aria-label="Novidades" orientation="vertical" slidesPerView={2}>
  <CarouselViewport>{slides}</CarouselViewport>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>;`,
    }),
  },
  {
    id: 'transition',
    title: 'Slide or fade',
    note: 'slide moves the track on a spring timed by the theme’s long duration, which keeps the speed of a hand that lets go or of a movement it interrupts; fade stacks the slides and crossfades them — the arriving one on the enter curve, the leaving one faster on the exit curve. Under reduced motion both change at once.',
    snippet: defineSnippet({
      id: 'carousel-react-transition',
      language: 'tsx',
      label: 'The same notices, crossfaded',
      source: `<Carousel aria-label="Avisos" loop transition="fade">
  <CarouselViewport>{notices}</CarouselViewport>
  <CarouselControls>
    <CarouselPrevious />
    <CarouselIndicators />
    <CarouselNext />
  </CarouselControls>
</Carousel>;`,
    }),
  },
  {
    id: 'align',
    title: 'Centred, with the neighbours showing',
    note: 'align="center" makes every slide a page and centres it; --slotted-carousel-peek pads the viewport so the slides either side show at its edges. Press a slide that peeks and it comes to the centre.',
    snippet: defineSnippet({
      id: 'carousel-react-align',
      language: 'tsx',
      label: 'Centre alignment and a peek',
      source: `<Carousel align="center" aria-label="One-of-a-kind pieces" className="peek">
  <CarouselViewport>{slides}</CarouselViewport>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>;

/* .peek { --slotted-carousel-peek: 2.5rem; } */`,
    }),
  },
  {
    id: 'arrows',
    title: 'Over the picture, or beside the row',
    note: 'arrows="inset" stands previous and next over the ends of the viewport, for a slideshow; "outside" gives them columns of their own, so a row of cards keeps its whole width and no arrow covers the first card.',
    snippet: defineSnippet({
      id: 'carousel-react-arrows',
      language: 'tsx',
      label: 'Arrows outside a row of cards',
      source: `<Carousel aria-label="Mais vendidos" arrows="outside" slidesPerView={3}>
  <CarouselViewport>{cards}</CarouselViewport>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Three control sizes',
    note: 'size steps the round controls along the control scale — 30, 34 and 38 pixels at comfortable — and the density shrinks them with every other control. The dots keep the 24-pixel target in every size.',
    snippet: defineSnippet({
      id: 'carousel-react-sizes',
      language: 'tsx',
      label: 'sm, md and lg',
      source: `<>
  <Carousel aria-label="Pequeno" size="sm">
    …
  </Carousel>
  <Carousel aria-label="Grande" size="lg">
    …
  </Carousel>
</>;`,
    }),
  },
  {
    id: 'indicators',
    title: 'Dots, a line, and many pages',
    note: 'dots draw the current page as a bar three dots long; line shares the width between segments; past eight pages the dots window themselves, the ones two steps away shrink and the rest fold away while staying in the arrow ring.',
    snippet: defineSnippet({
      id: 'carousel-react-indicators',
      language: 'tsx',
      label: 'The two families’ marks',
      source: `<>
  <CarouselIndicators />
  <CarouselIndicators variant="line" />
</>;`,
    }),
  },
  {
    id: 'thumbnails',
    title: 'A product gallery',
    note: 'variant="thumbnails" with a function child draws each indicator from the consumer’s picture. The strip scrolls on its own when it holds more than it shows, and keeps the current picture in view — one carousel, nothing to synchronise.',
    snippet: defineSnippet({
      id: 'carousel-react-thumbnails',
      language: 'tsx',
      label: 'Thumbnails as the slide picker',
      source: `<CarouselIndicators aria-label="Fotografias" variant="thumbnails">
  {(page) => (
    <CarouselIndicator key={page} page={page}>
      <img alt={photos[page].alt} src={photos[page].thumbnail} />
    </CarouselIndicator>
  )}
</CarouselIndicators>;`,
    }),
  },
  {
    id: 'autoplay',
    title: 'A rotation the reader controls',
    note: 'autoplay turns it on; the current dot fills over the delay. Hovering holds it with the time that was left, a hidden browser tab holds it, and the first keyboard focus inside stops it until the rotation control starts it again.',
    snippet: defineSnippet({
      id: 'carousel-react-autoplay',
      language: 'tsx',
      label: 'Six seconds a page, the control first',
      source: `<Carousel aria-label="Destaques" autoplay={6000} loop>
  <CarouselViewport>{slides}</CarouselViewport>
  <CarouselControls placement="overlay">
    <CarouselAutoplay />
    <CarouselIndicators />
  </CarouselControls>
</Carousel>;`,
    }),
  },
  {
    id: 'multiple',
    title: 'A row of cards that pages by what it shows',
    note: 'slidesPerView={3} sizes the cards; the pages are read from the layout, so the row pages by three and its last page ends flush. --slotted-carousel-slide-min-size keeps a card readable when the container narrows: at 240 pixels the same carousel shows one card and the edge of the next.',
    snippet: defineSnippet({
      id: 'carousel-react-multiple',
      language: 'tsx',
      label: 'Three per view, paged by three',
      source: `<Carousel aria-label="Mais vendidos" arrows="outside" slidesPerView={3}>
  <CarouselViewport>
    {pieces.map((piece) => (
      <CarouselSlide key={piece.name}>
        <ProductCard piece={piece} />
      </CarouselSlide>
    ))}
  </CarouselViewport>
  <CarouselPrevious />
  <CarouselNext />
  <CarouselControls>
    <CarouselIndicators variant="line" />
  </CarouselControls>
</Carousel>;`,
    }),
  },
  {
    id: 'loop',
    title: 'Past the last page',
    note: 'loop sends next on the last page to the first and previous on the first to the last; the track travels back rather than cloning a slide, so ids, focus and form state stay single. Without it the controls at the ends say they have nowhere to go.',
    snippet: defineSnippet({
      id: 'carousel-react-loop',
      language: 'tsx',
      label: 'A loop',
      source: `<Carousel aria-label="Collection" loop>
  …
</Carousel>;`,
    }),
  },
  {
    id: 'controlled',
    title: 'A page the application owns',
    note: 'page and onPageChange make the page the application’s; the request carries the reason — pointer, keyboard, scroll, timeout, resize, programmatic. The buttons outside the carousel move it through the same state, and the log shows each request.',
    snippet: defineSnippet({
      id: 'carousel-react-controlled',
      language: 'tsx',
      label: 'Controlled page, requests logged',
      source: `const [page, setPage] = useState(0);

<Carousel
  aria-label="Collection"
  page={page}
  onPageChange={(next, request) => {
    log(request.reason);
    setPage(next);
  }}
>
  …
</Carousel>;`,
    }),
  },
  {
    id: 'states',
    title: 'Every control in every state',
    note: 'Hover lifts a round control onto the neutral hover ground, a press shrinks it to 94 per cent, focus draws the ring two pixels out; at an end it keeps its place in the disabled ink. Use Tab to see the rings.',
    snippet: defineSnippet({
      id: 'carousel-react-states',
      language: 'tsx',
      label: 'The controls the reader presses',
      source: `<CarouselControls>
  <CarouselPrevious />
  <CarouselIndicators />
  <CarouselNext />
</CarouselControls>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'Cards of different heights stand at the height of the tallest; a long Portuguese name wraps inside its card; a right-to-left page mirrors the track, the arrows and the dots, and the counter still reads first to last.',
    snippet: defineSnippet({
      id: 'carousel-react-content',
      language: 'tsx',
      label: 'Long names, uneven heights, right to left',
      source: `<div dir="rtl">
  <Carousel aria-label="معرض" slidesPerView={2}>
    …
  </Carousel>
</div>;`,
    }),
  },
  {
    id: 'empty',
    title: 'Nothing yet, and loading',
    note: 'With no slide the controls are disabled and the counter reads 0 / 0; the empty state is a result-state the consumer puts in the viewport. While the pieces load, skeleton slides with the same anatomy hold the height.',
    snippet: defineSnippet({
      id: 'carousel-react-empty',
      language: 'tsx',
      label: 'An empty collection',
      source: `<Carousel aria-label="Collection">
  <CarouselViewport>
    {pieces.length === 0 ? (
      <ResultState status="empty">
        <ResultStateContent>
          <ResultStateTitle>No pieces in this collection</ResultStateTitle>
        </ResultStateContent>
      </ResultState>
    ) : (
      slides
    )}
  </CarouselViewport>
</Carousel>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Inside a product page',
    note: 'The gallery beside the buy box, as a product page lays them out: the picture and its thumbnails on the start, the name, the price and the action on the end. handleRef.scrollToSlide takes the gallery to the picture of the colour chosen.',
    snippet: defineSnippet({
      id: 'carousel-react-composition',
      language: 'tsx',
      label: 'A gallery driven by a colour choice',
      source: `const gallery = useRef<CarouselHandle>(null);

<>
  <Carousel aria-label="Fotografias" handleRef={gallery}>
    …
  </Carousel>
  <SegmentedControl
    aria-label="Cor"
    onValueChange={(colour) => gallery.current?.scrollToSlide(photoOf(colour))}
  >
    …
  </SegmentedControl>
</>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Tab reaches the rotation control, the viewport, the arrows and then one tab stop in the dots. In the viewport the arrows, PageUp, PageDown, Home and End move a page; in the dots the arrows move and show, and stop at the ends. Holding a key moves without animating.',
    snippet: defineSnippet({
      id: 'carousel-react-keyboard',
      language: 'tsx',
      label: 'Nothing to wire',
      source: `<Carousel aria-label="Collection">
  <CarouselViewport>{slides}</CarouselViewport>
  <CarouselControls>
    <CarouselIndicators />
  </CarouselControls>
</Carousel>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onPageChange',
    payload: '(page: number, request: ChangeRequest<number>)',
    when: 'Before the page moves: a control or an indicator ("pointer" or "keyboard"), a key in the viewport ("keyboard"), a swipe, a trackpad or a wheel that came to rest ("scroll"), a mouse drag ("pointer"), the rotation ("timeout"), a page that stopped existing ("resize"), handleRef ("programmatic"). cancel() keeps the page; a refused request brings the viewport back.',
  },
  {
    name: 'onPlayingChange',
    payload: '(playing: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the rotation starts or stops: the rotation control ("pointer" or "keyboard"), keyboard focus entering ("keyboard"), the reader moving the page by hand ("pointer", "keyboard", "scroll"), the last page reached without a loop ("timeout").',
  },
  {
    name: 'onClick, onKeyDown, onFocus, onPointerEnter, onPointerLeave',
    payload: 'the elements’ own events',
    when: 'Whenever the elements fire them. The consumer’s handler runs first; preventing the default of a click or a key stops the family’s answer.',
  },
];

export const REACT_CAROUSEL_DOCS = {
  carousel: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'page',
        'number',
        '—',
        'Carousel',
        'Present means the consumer owns the page, counted from 0. defaultPage is the uncontrolled half',
      ],
      ['defaultPage', 'number', '0', 'Carousel', 'The page an uncontrolled carousel starts on'],
      [
        'autoplay',
        'boolean | number',
        'false',
        'Carousel',
        'Turns the rotation on: true waits autoplayDelay, a number waits that many milliseconds',
      ],
      [
        'autoplayDelay',
        'number',
        '5000',
        'CarouselDefaultsProvider',
        'The wait on a page when autoplay is true; written as --slotted-carousel-autoplay-delay',
      ],
      [
        'playing',
        'boolean',
        '—',
        'Carousel',
        'Present means the consumer owns whether the rotation runs. defaultPlaying is the uncontrolled half',
      ],
      [
        'defaultPlaying',
        'boolean',
        'true with autoplay, false under reduced motion',
        'Carousel',
        'Whether an uncontrolled rotation starts running',
      ],
      [
        'loop',
        'boolean',
        'false',
        'Carousel, CarouselDefaultsProvider',
        'Next on the last page goes to the first; without it the rotation stops there',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'Carousel, CarouselDefaultsProvider',
        'The axis of the track, the arrows and the keys',
      ],
      [
        'transition',
        "'slide' | 'fade'",
        'slide',
        'Carousel, CarouselDefaultsProvider',
        'A scroll with snap, or slides stacked and crossfaded',
      ],
      [
        'align',
        "'start' | 'center'",
        'start',
        'Carousel, CarouselDefaultsProvider',
        'Where a page snaps; center makes every slide a page',
      ],
      [
        'arrows',
        "'inset' | 'outside'",
        'inset',
        'Carousel, CarouselDefaultsProvider',
        'Where previous and next stand when they are children of the root',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Carousel, CarouselDefaultsProvider',
        'The step of the control scale the round controls take',
      ],
      [
        'slidesPerView',
        'number',
        '1',
        'Carousel',
        'Written as --slotted-carousel-slides-per-view; unset, a container query of the consumer’s may write it',
      ],
      [
        'slidesPerMove',
        "number | 'page'",
        'page',
        'Carousel',
        'How many slides a page moves; page is the slides wholly in view',
      ],
      [
        'draggable',
        'boolean',
        'true',
        'Carousel, CarouselDefaultsProvider',
        'Whether a mouse drags the row; a finger and a trackpad always scroll it',
      ],
      [
        'messages',
        'PartialMessages<CarouselMessages>',
        '—',
        'Carousel',
        'Words laid over the language in force, key by key: roleDescription, slide, indicators, indicator, previous, next, stop, start, viewport, announce — with {index}, {page} and {count}',
      ],
      [
        'children',
        'ReactNode',
        'the chevron, play or pause glyph',
        'CarouselPrevious, CarouselNext, CarouselAutoplay',
        'Replaces the glyph; the accessible name stays the message unless aria-label is given',
      ],
      [
        'CarouselDefaultsProvider',
        '{ orientation, transition, align, arrows, size, loop, draggable, autoplayDelay }',
        '—',
        'a subtree',
        'The decisions an application takes once',
      ],
    ]),
    accessibility: [
      'The root is a region with aria-roledescription "carousel" and the consumer’s name; each slide is a group with aria-roledescription "slide" and the name "3 of 8", as the APG carousel asks, and a name the consumer gives a slide is never replaced.',
      'The slides out of view are inert, so the Tab key and a screen reader reach only what the reader can see; a press on a slide that peeks reaches the viewport, which brings that slide in.',
      'Previous and next at an end without a loop are aria-disabled rather than disabled, so the focus they hold is not dropped onto the page; a press does nothing and the disabled ink says so.',
      'The slide picker is the APG tabs pattern: one tab stop, arrows that move and show and stop at the ends, Home and End. Each tab names its page and controls its first slide; the slides stay groups because a page can hold several.',
      'A page the reader asked for is announced once through the shared live announcer — "Slide 3 of 8" — and nothing is announced while the rotation turns, so a screen reader is never interrupted by a page the reader did not ask for.',
      'The rotation never starts unless asked, does not start under reduced motion, pauses on hover and on a hidden browser tab, and stops on the first keyboard focus inside; its control is named by its action and carries no pressed state.',
    ],
    snippets: [
      defineSnippet({
        id: 'carousel-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<section aria-label="Autumn Collection" aria-roledescription="carousel" data-ui="carousel">
  <div aria-label="Slides" data-part="viewport" role="group" tabIndex={0}>
    <div
      aria-label="1 of 5"
      aria-roledescription="slide"
      data-current=""
      data-inview=""
      data-part="slide"
      role="group"
    />
    <div aria-label="2 of 5" aria-roledescription="slide" data-part="slide" inert="" role="group" />
  </div>
  <button aria-disabled="true" aria-label="Previous slide" data-part="previous" type="button" />
  <button aria-label="Next slide" data-part="next" type="button" />
  <div data-part="controls" data-placement="below">
    <div aria-label="Choose slide" data-part="indicators" data-variant="dots" role="tablist">
      <button aria-selected="true" data-current="" data-part="indicator" role="tab" />
    </div>
    <span aria-hidden="true" data-part="counter">
      1 / 5
    </span>
  </div>
</section>;`,
      }),
      defineSnippet({
        id: 'carousel-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='carousel'] {
  --slotted-carousel-gap: var(--slotted-space-4);
  --slotted-carousel-radius: var(--slotted-radius-md);
  --slotted-carousel-duration: var(--slotted-duration-medium);
  --slotted-carousel-slide-min-size: 12rem;
}`,
      }),
    ],
  },
} as const;
