import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../button';
import { Card, CardBody } from '../card';
import { Container } from '../container';
import { Link } from '../link';
import { Prose } from './prose';
import { ProseDefaultsProvider } from './prose-defaults';
import { Opening, Rhythm, Specimen, Stage, WideTable } from './prose-demo';
import { ProseAnchor, ProseExclude, ProseLead } from './prose-parts';
import { ProseScroll } from './prose-scroll';
import { REACT_PROSE_DOCS, REACT_PROSE_TOKENS } from './prose.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_PROSE_DOCS.prose.scenes, {
    playground: Playground,
    elements: Elements,
    size: Size,
    flow: Flow,
    lead: Lead,
    anchor: Anchor,
    scroll: Scroll,
    exclude: Exclude,
    streaming: Streaming,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Prose',
  component: Prose,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Prose',
        description:
          'The typography of a region the application did not author element by element. The tree arrives from a Markdown renderer, a CMS or a language model, and the page never gets to put an attribute on the h2. It styles bare tags, loses to every family placed inside it, and caps no width of its own.',
        framework: 'React',
        ...REACT_PROSE_DOCS.prose,
        tokens: REACT_PROSE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Prose>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { flow: 'normal', size: 'lg' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Stage>
      <Prose {...args}>
        <Opening />
        <Rhythm />
      </Prose>
    </Stage>
  ),
};

export const Elements: Story = {
  parameters: scenario('elements'),
  render: () => (
    <Stage>
      <Prose>
        <Specimen />
      </Prose>
    </Stage>
  ),
};

export const Size: Story = {
  parameters: scenario('size'),
  render: () => (
    <Stage>
      <Prose size="md">
        <h3>Control size</h3>
        <p>
          Body text at <code>--slotted-font-size-md</code>: the step a button label is set in, for a
          region that sits inside dense product chrome.
        </p>
      </Prose>
      <Prose size="lg">
        <h3>Reading size</h3>
        <p>
          Body text at one rem, the family default, for documentation and for anything a reader
          stays with for more than a sentence.
        </p>
      </Prose>
      <Prose size="xl">
        <h3>Article size</h3>
        <p>
          Body text at <code>--slotted-font-size-xl</code>, where the page is the content rather
          than a panel beside it.
        </p>
      </Prose>
    </Stage>
  ),
};

export const Flow: Story = {
  parameters: scenario('flow'),
  render: () => (
    <Stage>
      {(['tight', 'normal', 'loose'] as const).map((flow) => (
        <Prose flow={flow} key={flow}>
          <h3>{flow}</h3>
          <p>The same three blocks, at the distance this step gives them.</p>
          <p>The second block.</p>
          <ul>
            <li>And a list, which keeps its own tighter step.</li>
            <li>Two rows.</li>
          </ul>
        </Prose>
      ))}
    </Stage>
  ),
};

export const Lead: Story = {
  parameters: scenario('lead'),
  render: () => (
    <Stage>
      <Prose>
        <h3>With a lead</h3>
        <ProseLead>
          Everything a team needs to move a service from a laptop to production, in the order the
          steps have to happen.
        </ProseLead>
        <p>A deployment is three decisions: where the code runs, when it moves, and who is told.</p>
      </Prose>
      <Prose>
        <h3>Without one</h3>
        <p>
          Everything a team needs to move a service from a laptop to production, in the order the
          steps have to happen.
        </p>
        <p>A deployment is three decisions: where the code runs, when it moves, and who is told.</p>
      </Prose>
    </Stage>
  ),
};

export const Anchor: Story = {
  parameters: scenario('anchor'),
  render: () => (
    <Stage>
      <Prose>
        <h2 id="gates">
          Gates
          <ProseAnchor href="#gates" aria-label="Link to this section">
            #
          </ProseAnchor>
        </h2>
        <p>
          Hover the heading above, then press Tab from this paragraph: the permalink answers both.
        </p>
        <h3 id="zones">
          Zones
          <ProseAnchor href="#zones" aria-label="Link to this section">
            #
          </ProseAnchor>
        </h3>
        <p>Every level takes one, and every one holds its box whether it is visible or not.</p>
      </Prose>
    </Stage>
  ),
};

export const Scroll: Story = {
  parameters: scenario('scroll'),
  render: () => (
    <Stage>
      <Prose>
        <p>
          The table below is wider than this column. Press Tab: it is a named region with a tab stop
          of its own.
        </p>
        <WideTable />
        <p>The one below fits, and takes neither.</p>
        <ProseScroll aria-label="Two rows">
          <table>
            <tbody>
              <tr>
                <td>staging</td>
                <td>1 hour</td>
              </tr>
              <tr>
                <td>production</td>
                <td>24 hours</td>
              </tr>
            </tbody>
          </table>
        </ProseScroll>
      </Prose>
    </Stage>
  ),
};

export const Exclude: Story = {
  parameters: scenario('exclude'),
  render: () => (
    <Stage>
      <Prose>
        <h3>A component inside the page</h3>
        <p>
          This paragraph is set by the family. What follows is not: the subtree is returned to
          control type and left to whatever put it there.
        </p>
        <ProseExclude>
          <Card>
            <CardBody>
              <p>A card keeps its own type, its own rhythm and its own colour.</p>
              <ul>
                <li>No marker gap.</li>
                <li>No editorial leading.</li>
              </ul>
            </CardBody>
          </Card>
        </ProseExclude>
        <p>And the page continues, at the family’s own size.</p>
      </Prose>
    </Stage>
  ),
};

const STREAMED = [
  'A deployment is three decisions: where the code runs, when it moves, and who is told.',
  'The first is the one this page is about, and it assumes the prerequisites are already met.',
  'A gate that fails stops the roll where it is; instances already replaced keep serving.',
  'Rollback is a decision the owning team takes, inside the window the environment allows.',
];

export const Streaming: Story = {
  parameters: scenario('streaming'),
  render: function Render() {
    const [count, setCount] = useState(1);

    return (
      <Stage>
        <Prose flow="tight">
          <h3>An answer still arriving</h3>
          {STREAMED.slice(0, count).map((text) => (
            <p key={text}>{text}</p>
          ))}
        </Prose>
        <Button
          disabled={count === STREAMED.length}
          onClick={() => setCount((current) => Math.min(current + 1, STREAMED.length))}
          size="sm"
          variant="outline"
        >
          Append a block
        </Button>
      </Stage>
    );
  },
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Stage>
      <Prose>
        <h3>A body that does not start at the top level</h3>
        <h4>Two headings with nothing between them</h4>
        <p>
          A pasted destination is one unbroken token and breaks inside the column rather than
          widening it:{' '}
          <a href="#token">
            https://registry.internal.example.com/v2/platform/deployments/8f3c1a9b2d4e6f70/manifests/sha256:9c1f0a
          </a>
        </p>
        <ul>
          <li>
            First level
            <ul>
              <li>
                Second level
                <ul>
                  <li>
                    Third level, where the indentation has to still leave a column to read in
                    <ul>
                      <li>Fourth</li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
        <p dir="rtl" lang="ar">
          فقرة عربية داخل نفس المنطقة، تُقرأ من اليمين إلى اليسار وتحتفظ بإيقاعها.
        </p>
        <blockquote>
          <p>
            Eine Zusammenarbeitsvereinbarung zwischen Rechenzentrumsbetreibern regelt die
            Kapazitätsverteilung.
          </p>
        </blockquote>
      </Prose>
    </Stage>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Stage>
      <ProseDefaultsProvider flow="loose" size="lg">
        <Container inset={0} size="measure">
          <Prose render={(props) => <article {...props} />}>
            <h3>Bounded by the container, framed by nothing</h3>
            <p>
              The measure belongs to <Link href="#container">Container</Link>, and this family caps
              no width of its own. The link in this sentence is the real family: every content rule
              here weighs the same as the region’s own identifier, so a component placed inside wins
              on specificity and is left exactly as it is.
            </p>
            <p>
              A bare <code>a</code> from the renderer reads the same theme tokens, so the two are
              one decision rather than two colours.
            </p>
          </Prose>
        </Container>
      </ProseDefaultsProvider>
    </Stage>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Stage>
      <Prose>
        <h2 id="operable">
          The two operable things
          <ProseAnchor href="#operable" aria-label="Link to this section">
            #
          </ProseAnchor>
        </h2>
        <p>
          Tab from here: the permalink above, then the link in this sentence —{' '}
          <Link href="#operable">a real one</Link> — then the table below, which takes a stop only
          because it overflows.
        </p>
        <WideTable />
      </Prose>
    </Stage>
  ),
};
