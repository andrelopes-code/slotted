import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';

import { Button } from '../button';
import { InlineMessage } from '../inline-message';
import { Text } from '../typography';
import { Loader } from './loader';
import { ProgressBar } from './progress-bar';
import { ProgressCircle } from './progress-circle';
import { ProgressIndicatorDefaultsProvider } from './progress-indicator-defaults';
import {
  REACT_PROGRESS_INDICATOR_DOCS,
  REACT_PROGRESS_INDICATOR_TOKENS,
} from './progress-indicator.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_PROGRESS_INDICATOR_DOCS.progressIndicator.scenes, {
    playground: Playground,
    recipes: Recipes,
    determinate: Determinate,
    indeterminate: Indeterminate,
    loader: LoaderScene,
    wave: Wave,
    waveRamp: WaveRamp,
    wavePace: WavePace,
    waveIndeterminate: WaveIndeterminate,
    waveSizes: WaveSizes,
    buffer: Buffer,
    sizes: Sizes,
    tones: Tones,
    timing: Timing,
    page: Page,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/ProgressIndicator',
  component: ProgressBar,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Progress Indicator',
        description:
          'A quantity a task has covered, or a wait with no number in it: a bar, a ring, and the shape M3 draws instead of a spinner.',
        framework: 'React',
        ...REACT_PROGRESS_INDICATOR_DOCS.progressIndicator,
        tokens: REACT_PROGRESS_INDICATOR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes
 * this rather than laying itself out, so no two examples can end up against
 * each other and no story reaches for an inline style.
 */
function Scene({
  children,
  label,
  layout = 'stack',
  note,
}: {
  children: React.ReactNode;
  label: string;
  layout?: 'row' | 'stack' | 'prose' | 'block';
  note: string;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-align="start" data-layout={layout}>
        {children}
      </div>
    </section>
  );
}

/** A load that never finishes, so a demonstration can be looked at. */
function useToggle(interval: number) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => setOn((value) => !value), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return on;
}

/**
 * A load that runs to the end, stays finished for a moment and starts again,
 * for the scenes about how fast a value moves. `step` per `interval` is the
 * speed; `hold` is how long the finished bar is left on screen.
 */
function useRun(step: number, interval: number, hold: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setValue((current) => {
        const next = current >= 100 ? 0 : Math.min(100, current + step);
        timer = setTimeout(tick, next >= 100 ? hold : interval);
        return next;
      });
    };
    timer = setTimeout(tick, interval);
    return () => clearTimeout(timer);
  }, [hold, interval, step]);
  return value;
}

/** A value that climbs and starts again, for the scenes about a number moving. */
function useClimb(step = 7, interval = 700) {
  const [value, setValue] = useState(12);
  useEffect(() => {
    const timer = setInterval(
      () => setValue((current) => (current >= 100 ? 0 : Math.min(100, current + step))),
      interval,
    );
    return () => clearInterval(timer);
  }, [interval, step]);
  return value;
}

export const Playground: Story = {
  args: {
    label: 'Uploading invoices',
    showValue: true,
    size: 'md',
    tone: 'accent',
    value: 40,
    wave: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start" data-layout="block">
      <div className="slotted-demo-rows">
        <Text>report-q3.pdf</Text>
        <ProgressBar {...args} />
      </div>
    </div>
  ),
};

export const Recipes: Story = {
  parameters: scenario('recipes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene
        label="ProgressBar"
        layout="block"
        note="A quantity along a row, where there is width to spend on it: an upload, an import, a quota."
      >
        <ProgressBar label="Uploading invoices" showValue value={40} />
      </Scene>
      <Scene
        label="ProgressCircle"
        note="The same report where a bar will not fit — a table cell, a menu item, a button's icon slot. With no value it is the spinner."
      >
        <ProgressCircle label="Rebuilding index" showValue value={70} />
        <ProgressCircle label="Checking availability" />
      </Scene>
      <Scene
        label="Loader"
        note="A short wait with nothing to measure. M3 recommends it over a spinning ring for anything under five seconds."
      >
        <Loader label="Signing you in" size="lg" />
      </Scene>
    </div>
  ),
};

export const Determinate: Story = {
  parameters: scenario('determinate'),
  render: () => {
    const value = useClimb();
    return (
      <div className="slotted-demo-grid" data-columns="2">
        <Scene
          label="A value climbing"
          layout="block"
          note="The gap, the stop indicator and the number all move with one transition, because all four are derived from one registered custom property."
        >
          <ProgressBar label="Copying files" showValue value={value} />
          <ProgressCircle label="Copying files" showValue value={value} />
        </Scene>
        <Scene
          label="A range, and a format, of your own"
          layout="block"
          note="min and max are the range a reader is told about; format writes the value in the unit you passed in rather than as a percentage of it."
        >
          <ProgressBar
            format={{ style: 'unit', unit: 'megabyte', unitDisplay: 'narrow' }}
            label="Downloading"
            max={512}
            showValue
            value={128}
          />
          <ProgressBar label="Copying" max={7} showValue value={3} valueText="3 of 7 files" />
        </Scene>
        <Scene
          label="Four per cent, and a hundred"
          layout="block"
          note="At four per cent the stop indicator is what says the bar is four per cent of something; at a hundred the gap and the dot both go, so a finished bar is one bar."
        >
          <ProgressBar label="Copying 1 of 24 files" showValue value={4} />
          <ProgressBar label="Sync finished" showValue tone="success" value={100} />
        </Scene>
        <Scene
          label="data-complete"
          layout="block"
          note="CSS cannot compare a value to a maximum, so the family writes the comparison: a finished bar can read differently from one at ninety-nine per cent."
        >
          <ProgressBar label="Ninety-nine per cent" showValue value={99} />
          <ProgressBar label="A hundred per cent" showValue value={100} />
        </Scene>
      </div>
    );
  },
};

export const Indeterminate: Story = {
  parameters: scenario('indeterminate'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene
        label="ProgressBar"
        layout="block"
        note="A short bar crosses the track and swells as it goes, which is M3's disjoint indicator: a bar of constant length reads as a scrollbar being dragged."
      >
        <ProgressBar label="Preparing your export" />
        <ProgressBar label="Preparing your export" size="lg" />
      </Scene>
      <Scene
        label="ProgressCircle"
        note="The arc grows and shrinks while the ring turns, at two periods that do not divide into each other. There is no track: an arc with no value has no remainder to show."
      >
        <ProgressCircle label="Checking availability" size="lg" />
      </Scene>
      <Scene
        label="Loader"
        note="The same wait, kept by a shape instead of a ring. It is the one to reach for when the wait is short and the page has nothing else to say."
      >
        <Loader label="Signing you in" size="lg" />
      </Scene>
    </div>
  ),
};

export const LoaderScene: Story = {
  parameters: scenario('loader'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Bare"
        layout="row"
        note="A circle, a clover, a flower, a trefoil and an oval, in a sequence that never shows the same shape in the same orientation twice."
      >
        <Loader label="Small" size="sm" />
        <Loader label="Medium" size="md" />
        <Loader label="Large" size="lg" />
      </Scene>
      <Scene
        label="contained"
        layout="row"
        note="M3's fully rounded container, at M3's own 38:48 ratio. It is the form for a photograph or a colored surface, where a bare shape has no ground to be seen against."
      >
        <Loader contained label="Small" size="sm" />
        <Loader contained label="Medium" size="md" />
        <Loader contained label="Large" size="lg" />
      </Scene>
      <Scene
        label="On a surface the family did not choose"
        layout="block"
        note="The container is a computed tint of the loader's own tone, so it holds the 3:1 M3 asks for between a contained shape and its container in every scheme."
      >
        <div className="slotted-demo-surface" data-surface="sunken">
          <Loader contained label="Loading" size="lg" />
          <Loader contained label="Loading" size="lg" tone="success" />
          <Loader contained label="Loading" size="lg" tone="danger" />
        </div>
      </Scene>
      <Scene
        label="Beside a sentence"
        layout="row"
        note="A loader whose wait is already named by the words next to it is decorative: no role, no range, nothing said twice."
      >
        <Loader decorative size="sm" />
        <Text>Importing contacts…</Text>
      </Scene>
    </div>
  ),
};

export const Wave: Story = {
  parameters: scenario('wave'),
  render: () => {
    const value = useClimb(5, 900);
    return (
      <div className="slotted-demo-grid" data-columns="2">
        <Scene
          label="wave, on the bar"
          layout="block"
          note="One period every ten thicknesses at three quarters of one in amplitude — M3's 40dp against 4dp — running back toward the start, which reads as the fill flowing forward, and ending in a round cap on the crest. The track stays flat: the crest belongs to the part that is moving."
        >
          <ProgressBar label="Rendering the report" showValue size="lg" value={value} wave />
          <ProgressBar label="Rendering the report" showValue size="md" value={value} wave />
        </Scene>
        <Scene
          label="wave, on the ring"
          note="A sine wound around the circle, drawn a fifth wider than its step with the stroke it had — M3 grows its own wavy ring from 40dp to 48dp at the same 4dp stroke. The track stays a circle: only the active indicator waves."
        >
          <ProgressCircle label="Rendering the report" showValue value={value} wave />
        </Scene>
      </div>
    );
  },
};

export const WaveRamp: Story = {
  parameters: scenario('waveRamp'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="The amplitude is a function of the value"
        layout="block"
        note="Five values of one bar. The amplitude is a ramp on the value: flat to six per cent, full from sixteen to eighty-four, flat again from ninety-six. Eleven and ninety are half way up the ramp, and the thickness never changes as the crests retract."
      >
        <ProgressBar label="Five per cent" showValue size="lg" value={5} wave />
        <ProgressBar label="Eleven per cent" showValue size="lg" value={11} wave />
        <ProgressBar label="Half way" showValue size="lg" value={50} wave />
        <ProgressBar label="Ninety per cent" showValue size="lg" value={90} wave />
        <ProgressBar label="Finished" showValue size="lg" tone="success" value={100} wave />
      </Scene>
    </div>
  ),
};

export const WavePace: Story = {
  parameters: scenario('wavePace'),
  render: () => {
    const fast = useRun(4, 60, 1800);
    const slow = useRun(1, 300, 1800);
    return (
      <div className="slotted-demo-grid" data-columns="2">
        <Scene
          label="A load of a second and a half"
          layout="block"
          note="The value climbs four points every sixty milliseconds. The crests keep their own pace — one wavelength every 1.1 seconds, running back toward the start — so the fill flows through them, settles flat over the last twelve points and closes as one bar before the crests have moved a track's width."
        >
          <ProgressBar label="Compressing" showValue size="lg" value={fast} wave />
          <ProgressCircle label="Compressing" showValue value={fast} wave />
        </Scene>
        <Scene
          label="A load of half a minute"
          layout="block"
          note="One point every three hundred milliseconds. The same crests now pass the standing end of the fill many times before it moves, and the end cap rides each one. Neither the speed nor the amplitude of the wave reads how fast the value moves."
        >
          <ProgressBar label="Rebuilding the index" showValue size="lg" value={slow} wave />
          <ProgressCircle label="Rebuilding the index" showValue value={slow} wave />
        </Scene>
      </div>
    );
  },
};

export const WaveIndeterminate: Story = {
  parameters: scenario('waveIndeterminate'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="wave, with no value"
        layout="block"
        note="The travelling bar carries the tighter wave M3 draws while the value is unknown — one period every five thicknesses instead of ten — and it is wavy along its whole length, because there is no value to flatten it against."
      >
        <ProgressBar label="Preparing your export" size="lg" wave />
        <ProgressBar label="Preparing your export" size="md" wave />
      </Scene>
      <Scene
        label="The same wait, determinate beside it"
        layout="block"
        note="A known value at the wavelength of ten thicknesses, for the comparison: the indeterminate bar's crests are half as long and the window moves; the determinate bar's crests are longer and the window stands at the value."
      >
        <ProgressBar label="Rendering the report" showValue size="lg" value={62} wave />
        <ProgressBar label="Rendering the report" showValue size="md" value={62} wave />
      </Scene>
    </div>
  ),
};

export const WaveSizes: Story = {
  parameters: scenario('waveSizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="The wave is measured in thicknesses"
        layout="block"
        note="One wavelength is ten thicknesses and one crest is three quarters of one, at every size: the small bar's wave is twenty pixels long and rises a pixel and a half, the large bar's is eighty and rises six. The speed is one wavelength per cycle, so the thin wave also travels at a quarter of the speed in pixels."
      >
        <ProgressBar label="Small" showValue size="sm" value={55} wave />
        <ProgressBar label="Medium" showValue size="md" value={55} wave />
        <ProgressBar label="Large" showValue size="lg" value={55} wave />
      </Scene>
      <Scene
        label="The ring at three sizes"
        layout="row"
        note="Eight crests on every ring, because the wave is wound on the viewBox and the viewBox scales. A wavy ring is drawn a fifth wider than its plain step, so it stands a little taller than the button its size names."
      >
        <ProgressCircle label="Saving" showValue size="sm" value={55} wave />
        <ProgressCircle label="Saving" showValue size="md" value={55} wave />
        <ProgressCircle label="Saving" showValue size="lg" value={55} wave />
      </Scene>
    </div>
  ),
};

export const Buffer: Story = {
  parameters: scenario('buffer'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="buffer"
        layout="block"
        note="Three bands in one track: what is done, what has arrived, and what has not. The same value with no buffer sits below it, so the M3 gap is visible again."
      >
        <ProgressBar buffer={72} label="Processing uploaded pages" showValue size="lg" value={34} />
        <ProgressBar label="The same value, unbuffered" showValue size="lg" value={34} />
      </Scene>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="The bar's thickness"
        layout="block"
        note="Two, four and eight pixels — M3's own default track is the middle one. Thickness is graphic weight, so it does not change with density; the words do."
      >
        <ProgressBar label="Small" size="sm" value={55} />
        <ProgressBar label="Medium" size="md" value={55} />
        <ProgressBar label="Large" size="lg" value={55} />
      </Scene>
      <Scene
        label="The ring beside the control it belongs to"
        layout="row"
        note="The rings read the control height scale, so a spinner standing next to a button is exactly as tall as the button at every density."
      >
        <ProgressCircle label="Saving" size="sm" value={55} />
        <Button size="sm" variant="outline">
          Save
        </Button>
        <ProgressCircle label="Saving" size="md" value={55} />
        <Button size="md" variant="outline">
          Save
        </Button>
        <ProgressCircle label="Saving" size="lg" value={55} />
        <Button size="lg" variant="outline">
          Save
        </Button>
      </Scene>
    </div>
  ),
};

export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="tone, in the context each one exists for"
        layout="block"
        note="accent is the work in hand and secondary a job nobody is watching; success is an upload that landed, warning a quota nearly spent, danger a transfer that failed."
      >
        <ProgressBar label="Uploading invoices" showValue value={62} />
        <ProgressBar label="Reindexing in the background" showValue tone="secondary" value={62} />
        <ProgressBar label="Backup complete" showValue tone="success" value={100} />
        <ProgressBar label="Storage used" showValue tone="warning" value={88} />
        <ProgressBar label="Transfer failed" showValue tone="danger" value={41} />
      </Scene>
    </div>
  ),
};

export const Timing: Story = {
  parameters: scenario('timing'),
  render: () => {
    const pending = useToggle(900);
    return (
      <div className="slotted-demo-grid" data-columns="2">
        <Scene
          label="No timing"
          layout="block"
          note="A load that finishes every nine hundred milliseconds. The bar appears and vanishes with it and the row never settles — that churn is the flash."
        >
          <ProgressBar label="Saving draft" loading={pending} />
          <Loader label="Saving draft" loading={pending} />
        </Scene>
        <Scene
          label="delay={600} minDuration={600}"
          layout="block"
          note="The same load beside it. Nothing is painted until the wait has lasted six hundred milliseconds, and anything painted stays for six hundred more."
        >
          <ProgressBar delay={600} label="Saving draft" loading={pending} minDuration={600} />
          <Loader delay={600} label="Saving draft" loading={pending} minDuration={600} />
        </Scene>
      </div>
    );
  },
};

export const Page: Story = {
  parameters: scenario('page'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label='placement="page", indeterminate'
        layout="block"
        note="The dashed box stands in for the viewport: in an application the bar's containing block is the viewport itself, and it sits above the page at the sticky layer."
      >
        <div className="slotted-demo-viewport">
          <ProgressBar label="Loading page" placement="page" />
        </div>
      </Scene>
      <Scene
        label='placement="page", with a value'
        layout="block"
        note="Square corners, no track and no stop indicator: a permanent grey band across the top of a page reads as a rule under the header rather than as a wait."
      >
        <div className="slotted-demo-viewport">
          <ProgressBar label="Loading page" placement="page" value={72} />
        </div>
      </Scene>
      <Scene
        label='placement="edge-start", indeterminate'
        layout="block"
        note="The same bar on the top edge of the nearest positioned box. In an application that box is AppShellProgress's frame over the content, and the bar covers the line between the chrome and the content."
      >
        <div className="slotted-demo-viewport">
          <ProgressBar label="Refreshing" placement="edge-start" />
        </div>
      </Scene>
      <Scene
        label='placement="edge-end", with a value'
        layout="block"
        note="On the bottom edge instead, the way PageHeaderProgress draws a refresh over the line where the header ends. The value fills from the inline start, so it runs right to left in an Arabic document."
      >
        <div className="slotted-demo-viewport">
          <ProgressBar label="Saving" placement="edge-end" value={62} />
        </div>
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene
        label="A narrow column"
        layout="block"
        note="Four words in a 360-pixel measure: the label wraps and the number does not, because a label is a sentence and a number is never improved by being broken in half."
      >
        <div className="slotted-demo-measure">
          <ProgressBar label="Verificando assinaturas do pacote publicado" showValue value={47} />
        </div>
      </Scene>
      <Scene
        label="A string no language can break"
        layout="block"
        note="A container digest breaks at the character, and the value column keeps its own width, so the bar below stays the width of the column rather than the width of the token."
      >
        <div className="slotted-demo-measure">
          <ProgressBar
            label="sha256:9f2c4ae1b8d37c05e6f1a92b4d8c7e30f5a6b1c2d3e4f5061728394a5b6c7d8e"
            showValue
            value={47}
          />
        </div>
      </Scene>
      <Scene
        label='dir="rtl"'
        layout="block"
        note="Every edge changes ends — the fill, the gap, the stop indicator, the words — and the clock does not: a ring turns the same way in every language."
      >
        <div dir="rtl">
          <ProgressBar label="جارٍ التحقق من التوقيعات" locale="ar-EG" showValue value={47} />
        </div>
        <div dir="rtl">
          <ProgressCircle label="جارٍ التحقق من التوقيعات" locale="ar-EG" showValue value={47} />
        </div>
      </Scene>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => {
    const value = useClimb(9, 800);
    return (
      <div className="slotted-demo-grid" data-columns="2">
        <Scene
          label="An upload row"
          layout="block"
          note="The file names the wait, so the bar's own name is clipped rather than repeated; the number sits where a row of them lines up, and the action stays reachable."
        >
          <div className="slotted-demo-rows">
            <Text>report-q3.pdf</Text>
            <ProgressBar hideLabel label="Uploading report-q3.pdf" showValue value={value} />
            <Text>contracts.zip</Text>
            <ProgressBar
              hideLabel
              label="Uploading contracts.zip"
              showValue
              value={100}
              tone="success"
            />
          </div>
          <Button tone="secondary" variant="outline">
            Cancel upload
          </Button>
        </Scene>
        <Scene
          label="Defaults for a whole application"
          layout="block"
          note="The provider decides the timing, the appearance and the language once. An indicator that states its own still wins over it, which is the rule the library follows everywhere."
        >
          <ProgressIndicatorDefaultsProvider
            delay={200}
            label="Loading…"
            locale="pt-BR"
            minDuration={400}
            size="lg"
            tone="secondary"
          >
            <ProgressBar showValue value={value} />
            <ProgressBar showValue tone="accent" value={value} />
            <Loader />
          </ProgressIndicatorDefaultsProvider>
        </Scene>
      </div>
    );
  },
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="aria-busy and aria-describedby, on your region"
        layout="block"
        note="ARIA asks a consumer to write both on the region that is loading, pointing at the indicator's id. The family cannot write them: the region is yours, not its."
      >
        <section aria-busy aria-describedby="import-progress">
          <div className="slotted-demo-rows">
            <Text>Importing contacts</Text>
            <ProgressBar
              hideLabel
              id="import-progress"
              label="Importing contacts"
              showValue
              value={62}
            />
          </div>
        </section>
      </Scene>
      <Scene
        label="The words a reader hears"
        layout="block"
        note="role=progressbar prunes its own subtree, so a message inside an indicator is never announced. It goes beside one, where the sighted reader sees the same sentence."
      >
        <InlineMessage>Importing contacts — 62% complete</InlineMessage>
        <ProgressBar hideLabel label="Importing contacts" value={62} />
      </Scene>
      <Scene
        label="decorative"
        layout="row"
        note="No role, no range, nothing in the accessibility tree — for the one case the feature guide names, a spinner beside text that already says what is happening."
      >
        <Loader decorative size="sm" />
        <Text>Checking availability…</Text>
      </Scene>
      <Scene
        label="A name, three ways"
        layout="block"
        note="A rendered label, a label clipped by hideLabel, or your own aria-label. With none of the three, development warns and the bar still renders."
      >
        <ProgressBar label="A rendered name" value={40} />
        <ProgressBar hideLabel label="A clipped name" value={40} />
        <ProgressBar aria-label="A name you wrote" value={40} />
      </Scene>
    </div>
  ),
};
