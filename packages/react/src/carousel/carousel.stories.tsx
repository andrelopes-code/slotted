import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import type { CSSProperties, Ref } from 'react';

import { Button } from '../button';
import { Card, CardBody, CardHeader, CardMedia } from '../card';
import { Image } from '../image';
import {
  ResultState,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '../result-state';
import { Segment, SegmentedControl } from '../segmented-control';
import { Skeleton } from '../skeleton';
import { Heading, Text } from '../typography';
import { Carousel } from './carousel';
import { NOTICES, PIECES } from './carousel-catalogue';
import { Grid, PhotoSlide, ProductSlide, Scene } from './carousel-demo';
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
import { REACT_CAROUSEL_DOCS, REACT_CAROUSEL_TOKENS } from './carousel.docs';
import type {
  CarouselAlign,
  CarouselArrows,
  CarouselHandle,
  CarouselOrientation,
  CarouselSize,
  CarouselTransition,
} from './carousel.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_CAROUSEL_DOCS.carousel.scenes, {
    playground: Playground,
    orientation: Orientation,
    transition: Transition,
    align: Align,
    arrows: Arrows,
    sizes: Sizes,
    indicators: Indicators,
    thumbnails: Thumbnails,
    autoplay: Autoplay,
    multiple: Multiple,
    loop: Loop,
    controlled: Controlled,
    states: States,
    content: Content,
    empty: Empty,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

interface PlaygroundArgs {
  align: CarouselAlign;
  arrows: CarouselArrows;
  loop: boolean;
  orientation: CarouselOrientation;
  size: CarouselSize;
  transition: CarouselTransition;
}

const meta = {
  title: 'Components/Carousel',
  component: Carousel,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Carousel',
        description:
          'A set of slides shown a page at a time: a native scroller with snap that a finger, a trackpad, a mouse and the keyboard page, with previous and next, a slide picker of dots, a line or thumbnails, a counter, and a rotation the reader controls.',
        framework: 'React',
        ...REACT_CAROUSEL_DOCS.carousel,
        tokens: REACT_CAROUSEL_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const FIVE = PIECES.slice(0, 5);

/** The family's own public tokens, written on the instance the way an application would. */
const PEEK = { '--slotted-carousel-peek': '2.5rem' } as CSSProperties;
const FLOOR = { '--slotted-carousel-slide-min-size': '14rem' } as CSSProperties;

function Slideshow(props: Partial<PlaygroundArgs> & { label?: string }) {
  const { label = 'Autumn Collection', ...rest } = props;
  return (
    <Carousel aria-label={label} {...rest}>
      <CarouselViewport>
        {FIVE.map((piece) => (
          <PhotoSlide key={piece.name} piece={piece} />
        ))}
      </CarouselViewport>
      <CarouselPrevious />
      <CarouselNext />
      <CarouselControls>
        <CarouselIndicators />
        <CarouselCounter />
      </CarouselControls>
    </Carousel>
  );
}

export const Playground = {
  args: {
    align: 'start',
    arrows: 'inset',
    loop: false,
    orientation: 'horizontal',
    size: 'md',
    transition: 'slide',
  } as never,
  argTypes: {
    align: { control: 'inline-radio', options: ['start', 'center'] },
    arrows: { control: 'inline-radio', options: ['inset', 'outside'] },
    loop: { control: 'boolean' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    transition: { control: 'inline-radio', options: ['slide', 'fade'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args: unknown) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Slideshow {...(args as PlaygroundArgs)} />
    </div>
  ),
} satisfies Story as Story;

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Horizontal"
        note="The arrows stand at the inline ends; Left and Right page the viewport and mirror in a right-to-left page."
      >
        <Slideshow label="Horizontal collection" />
      </Scene>
      <Scene
        label="Vertical, two per view"
        note="The column pages with Up and Down; the arrows turn a quarter and stand at its top and foot."
      >
        <Carousel aria-label="Vertical collection" orientation="vertical" slidesPerView={2}>
          <CarouselViewport>
            {PIECES.slice(0, 6).map((piece) => (
              <PhotoSlide key={piece.name} piece={piece} ratio="wide" />
            ))}
          </CarouselViewport>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </Scene>
    </Grid>
  ),
};

function Notices({ transition }: { transition: CarouselTransition }) {
  return (
    <Carousel aria-label="Avisos da loja" loop transition={transition}>
      <CarouselViewport>
        {NOTICES.map((notice) => (
          <CarouselSlide key={notice.title}>
            <Card>
              <CardHeader>
                <Heading level={3} size="lg">
                  {notice.title}
                </Heading>
              </CardHeader>
              <CardBody>
                <Text tone="muted">{notice.body}</Text>
              </CardBody>
            </Card>
          </CarouselSlide>
        ))}
      </CarouselViewport>
      <CarouselControls>
        <CarouselPrevious />
        <CarouselIndicators />
        <CarouselNext />
      </CarouselControls>
    </Carousel>
  );
}

export const Transition: Story = {
  parameters: scenario('transition'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="slide"
        note="The track moves on a spring timed by the long duration, and a second press carries the first one’s speed."
      >
        <Notices transition="slide" />
      </Scene>
      <Scene
        label="fade"
        note="The arriving notice fades in on the enter curve over the leaving one, which goes faster."
      >
        <Notices transition="fade" />
      </Scene>
    </Grid>
  ),
};

export const Align: Story = {
  parameters: scenario('align'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Centred, two and a half rem of each neighbour"
        note="Every slide is a page; the ones either side show at the edges. Press one and it comes to the centre."
      >
        <Carousel align="center" aria-label="One-of-a-kind pieces" defaultPage={1} style={PEEK}>
          <CarouselViewport>
            {FIVE.map((piece) => (
              <PhotoSlide key={piece.name} piece={piece} />
            ))}
          </CarouselViewport>
          <CarouselPrevious />
          <CarouselNext />
          <CarouselControls>
            <CarouselIndicators />
          </CarouselControls>
        </Carousel>
      </Scene>
    </Grid>
  ),
};

function Rail({ arrows, style }: { arrows: CarouselArrows; style?: CSSProperties | undefined }) {
  return (
    <Carousel aria-label="Mais vendidos" arrows={arrows} slidesPerView={3} style={style}>
      <CarouselViewport>
        {PIECES.map((piece) => (
          <ProductSlide key={piece.name} piece={piece} />
        ))}
      </CarouselViewport>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

export const Arrows: Story = {
  parameters: scenario('arrows'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="inset"
        note="Over the ends of a picture: the slideshow keeps its whole width and the arrows stand on it."
      >
        <Slideshow label="Collection with arrows on top" />
      </Scene>
      <Scene
        label="outside"
        note="Beside a row of cards: columns of their own, so no arrow covers the first card’s corner."
      >
        <Rail arrows="outside" />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={3}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Scene
          key={size}
          label={size}
          note={`The round controls at the ${size} step of the control scale.`}
        >
          <Slideshow label={`Collection ${size}`} size={size} />
        </Scene>
      ))}
    </Grid>
  ),
};

function Archive({ count }: { count: number }) {
  return (
    <Carousel aria-label="Arquivo de campanhas" defaultPage={Math.floor(count / 2)}>
      <CarouselViewport>
        {Array.from({ length: count }, (_, index) => (
          <PhotoSlide key={index} piece={PIECES[index % PIECES.length]!} ratio="wide" />
        ))}
      </CarouselViewport>
      <CarouselControls>
        <CarouselPrevious />
        <CarouselIndicators />
        <CarouselNext />
        <CarouselCounter />
      </CarouselControls>
    </Carousel>
  );
}

export const Indicators: Story = {
  parameters: scenario('indicators'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="dots"
        note="The current page is a bar three dots long; shape, not colour alone, says which."
      >
        <Slideshow label="Collection with dots" />
      </Scene>
      <Scene label="line" note="Segments share the width; the current one is the ink.">
        <Carousel aria-label="Collection with line">
          <CarouselViewport>
            {FIVE.map((piece) => (
              <PhotoSlide key={piece.name} piece={piece} ratio="wide" />
            ))}
          </CarouselViewport>
          <CarouselPrevious />
          <CarouselNext />
          <CarouselControls>
            <CarouselIndicators variant="line" />
            <CarouselCounter />
          </CarouselControls>
        </Carousel>
      </Scene>
      <Scene
        label="fourteen pages"
        note="Past eight pages the row windows itself; arrow through it and the window follows."
      >
        <Archive count={14} />
      </Scene>
    </Grid>
  ),
};

function Gallery({ handleRef }: { handleRef?: Ref<CarouselHandle> | undefined }) {
  const photos = PIECES.slice(0, 6);
  return (
    <Carousel aria-label="Fotografias do Jarro Mel" handleRef={handleRef}>
      <CarouselViewport>
        {photos.map((piece) => (
          <PhotoSlide key={piece.name} piece={piece} />
        ))}
      </CarouselViewport>
      <CarouselPrevious />
      <CarouselNext />
      <CarouselControls>
        <CarouselIndicators aria-label="Escolher fotografia" variant="thumbnails">
          {(page) => (
            <CarouselIndicator key={page} page={page}>
              <img alt={photos[page]!.name} src={photos[page]!.image} />
            </CarouselIndicator>
          )}
        </CarouselIndicators>
      </CarouselControls>
    </Carousel>
  );
}

export const Thumbnails: Story = {
  parameters: scenario('thumbnails'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Six photographs, one picker"
        note="The current picture carries an inset ring of the ink; the others are held back until the pointer reaches them."
      >
        <Gallery />
      </Scene>
    </Grid>
  ),
};

export const Autoplay: Story = {
  parameters: scenario('autoplay'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Six seconds a page, over the picture"
        note="The current dot fills over the delay. Hover holds it; Tab into it and the rotation stops until the control starts it."
      >
        <Carousel aria-label="Destaques" autoplay={6000} loop>
          <CarouselViewport>
            {FIVE.map((piece) => (
              <PhotoSlide key={piece.name} piece={piece} />
            ))}
          </CarouselViewport>
          <CarouselControls placement="overlay">
            <CarouselAutoplay />
            <CarouselIndicators />
          </CarouselControls>
        </Carousel>
      </Scene>
      <Scene
        label="A line that measures the wait"
        note="The segment of the current notice fills; the counter beside it says where the rotation is."
      >
        <Carousel aria-label="Rotating notices" autoplay loop transition="fade">
          <CarouselViewport>
            {NOTICES.map((notice) => (
              <CarouselSlide key={notice.title}>
                <Card>
                  <CardHeader>
                    <Heading level={3} size="lg">
                      {notice.title}
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <Text tone="muted">{notice.body}</Text>
                  </CardBody>
                </Card>
              </CarouselSlide>
            ))}
          </CarouselViewport>
          <CarouselControls>
            <CarouselAutoplay />
            <CarouselIndicators variant="line" />
            <CarouselCounter />
          </CarouselControls>
        </Carousel>
      </Scene>
    </Grid>
  ),
};

export const Multiple: Story = {
  parameters: scenario('multiple'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Three per view"
        note="Eight cards make three pages; the last one ends flush with the row."
      >
        <Carousel aria-label="Mais vendidos" arrows="outside" slidesPerView={3}>
          <CarouselViewport>
            {PIECES.map((piece) => (
              <ProductSlide key={piece.name} piece={piece} />
            ))}
          </CarouselViewport>
          <CarouselPrevious />
          <CarouselNext />
          <CarouselControls>
            <CarouselIndicators variant="line" />
          </CarouselControls>
        </Carousel>
      </Scene>
      <Scene
        label="A narrow column"
        note="The slide floor keeps a card readable: one card and the edge of the next."
      >
        <div className="slotted-demo-measure">
          <Rail arrows="inset" style={FLOOR} />
        </div>
      </Scene>
    </Grid>
  ),
};

export const Loop: Story = {
  parameters: scenario('loop'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Without a loop"
        note="At the first page previous stays in place in the disabled ink."
      >
        <Slideshow label="Collection without loop" />
      </Scene>
      <Scene
        label="With a loop"
        note="Previous at the first page goes to the last; the track travels back."
      >
        <Slideshow label="Collection with loop" loop />
      </Scene>
    </Grid>
  ),
};

function ControlledCarousel() {
  const [page, setPage] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  return (
    <div className="slotted-demo-stack">
      <Carousel
        aria-label="Controlled collection"
        onPageChange={(next, request) => {
          setLog((entries) => [`${next + 1} · ${request.reason}`, ...entries].slice(0, 4));
          setPage(next);
        }}
        page={page}
      >
        <CarouselViewport>
          {FIVE.map((piece) => (
            <PhotoSlide key={piece.name} piece={piece} ratio="wide" />
          ))}
        </CarouselViewport>
        <CarouselPrevious />
        <CarouselNext />
        <CarouselControls>
          <CarouselIndicators />
        </CarouselControls>
      </Carousel>
      <div className="slotted-demo-row">
        {FIVE.map((piece, index) => (
          <Button key={piece.name} onClick={() => setPage(index)} size="sm" variant="outline">
            {piece.name}
          </Button>
        ))}
      </div>
      <div className="slotted-demo-surface" data-surface="sunken">
        <Text size="sm">Requests: {log.length === 0 ? 'none yet' : log.join(' — ')}</Text>
      </div>
    </div>
  );
}

export const Controlled: Story = {
  parameters: scenario('controlled'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The page is the application’s"
        note="Swipe, press, drag or use the keys; each request lands in the log with its reason before the page moves."
      >
        <ControlledCarousel />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="At the first page"
        note="Previous in the disabled ink and still focusable; next answers hover and press."
      >
        <Slideshow label="States at the start" />
      </Scene>
      <Scene
        label="In the bar"
        note="The controls in a bar under the picture, each with its hover ground, its press and its ring."
      >
        <Notices transition="slide" />
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Uneven cards, long names"
        note="The row stands at the tallest card; a long name wraps inside its card."
      >
        <Carousel aria-label="Pieces with long names" slidesPerView={2}>
          <CarouselViewport>
            {PIECES.slice(0, 4).map((piece, index) => (
              <CarouselSlide key={piece.name}>
                <Card>
                  <CardMedia>
                    <Image alt="" ratio="landscape" src={piece.image} />
                  </CardMedia>
                  <CardHeader>
                    <Heading level={3} size="md">
                      {index === 1
                        ? `${piece.name} — numbered edition from the Flower Street workshop`
                        : piece.name}
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <Text size="sm" tone="muted">
                      {index === 2
                        ? `${piece.glaze}, cozida a 1280 °C em forno a lenha durante trinta horas`
                        : piece.glaze}
                    </Text>
                  </CardBody>
                </Card>
              </CarouselSlide>
            ))}
          </CarouselViewport>
          <CarouselPrevious />
          <CarouselNext />
          <CarouselControls>
            <CarouselIndicators />
            <CarouselCounter />
          </CarouselControls>
        </Carousel>
      </Scene>
      <Scene
        label="Right to left"
        note="The track, the arrows and the dots mirror; the counter still reads first to last."
      >
        <div dir="rtl">
          <Slideshow label="معرض الخزف" />
        </div>
      </Scene>
    </Grid>
  ),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="No pieces"
        note="The controls are disabled, the counter reads 0 / 0, and the viewport holds the result state."
      >
        <Carousel aria-label="Empty collection">
          <CarouselViewport>
            <ResultState status="empty">
              <ResultStateContent>
                <ResultStateTitle>No pieces in this collection</ResultStateTitle>
                <ResultStateDescription>
                  The pieces from the next firing appear here.
                </ResultStateDescription>
              </ResultStateContent>
            </ResultState>
          </CarouselViewport>
          <CarouselControls>
            <CarouselPrevious />
            <CarouselCounter />
            <CarouselNext />
          </CarouselControls>
        </Carousel>
      </Scene>
      <Scene
        label="Loading"
        note="Skeleton cards with the anatomy of the cards they stand in for hold the row’s height."
      >
        <Carousel aria-label="Loading collection" slidesPerView={2}>
          <CarouselViewport>
            {[0, 1, 2].map((index) => (
              <CarouselSlide key={index}>
                <Card>
                  <CardMedia>
                    <Skeleton shape="block">
                      <Image alt="" ratio="square" src={PIECES[0]!.image} />
                    </Skeleton>
                  </CardMedia>
                  <CardHeader>
                    <Skeleton shape="text">
                      <Heading level={3} size="md">
                        Terracotta Amphora
                      </Heading>
                    </Skeleton>
                  </CardHeader>
                </Card>
              </CarouselSlide>
            ))}
          </CarouselViewport>
        </Carousel>
      </Scene>
    </Grid>
  ),
};

const COLOURS = [
  { value: 'mel', label: 'Honey', slide: 3 },
  { value: 'salvia', label: 'Sage', slide: 1 },
  { value: 'indigo', label: 'Indigo', slide: 4 },
] as const;

function ProductPage() {
  const gallery = useRef<CarouselHandle>(null);
  const [colour, setColour] = useState<string>('mel');
  return (
    <div className="slotted-demo-grid" data-columns="2">
      <Gallery handleRef={gallery} />
      <div className="slotted-demo-stack">
        <Heading level={3} size="2xl">
          Honey Jug
        </Heading>
        <Text tone="muted">Honey-glazed earthenware, hand-thrown. 1.2 liters.</Text>
        <Text size="xl">€72.00</Text>
        <SegmentedControl
          aria-label="Cor"
          onValueChange={(value) => {
            setColour(value as string);
            const entry = COLOURS.find((candidate) => candidate.value === value);
            if (entry !== undefined) gallery.current?.scrollToSlide(entry.slide);
          }}
          value={colour}
        >
          {COLOURS.map((entry) => (
            <Segment key={entry.value} value={entry.value}>
              {entry.label}
            </Segment>
          ))}
        </SegmentedControl>
        <Button>Add to cart</Button>
      </div>
    </div>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A product page"
        note="Choose a colour and the gallery goes to its photograph through handleRef.scrollToSlide."
      >
        <ProductPage />
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Tab, then the arrows"
        note="Focus the viewport and use the arrows, PageUp, PageDown, Home and End; Tab on to the dots and use the arrows there."
      >
        <Slideshow label="Collection by keyboard" />
      </Scene>
    </Grid>
  ),
};
