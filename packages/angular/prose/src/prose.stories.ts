import { SlContainer } from '@slotted/angular/container';
import { SlLink } from '@slotted/angular/link';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlProse } from './prose';
import type { ProseFlow, ProseSize } from './prose';
import { SlProseAnchor, SlProseExclude, SlProseFootnotes, SlProseLead } from './prose-parts';
import { SlProseScroll } from './prose-scroll';
import { ANGULAR_PROSE_DOCS, ANGULAR_PROSE_TOKENS } from './prose.docs';

interface ProseStoryArgs {
  flow: ProseFlow;
  size: ProseSize;
}

/**
 * The content every scene is set in. It stands in for what a Markdown renderer
 * emits: bare tags, with no attribute the application ever got to write.
 * Keeping it in one template fragment is what makes two scenes comparable — a
 * reader judging `flow` is looking at the same words twice.
 */
const opening = `
<h2 id="deploying">
  Deploying a service<a slProseAnchor href="#deploying" aria-label="Link to this section">#</a>
</h2>
<p slProseLead>
  Everything a team needs to move a service from a laptop to production, in the order the steps
  have to happen.
</p>
<p>
  A deployment is three decisions: <strong>where</strong> the code runs, <em>when</em> it moves,
  and who is told.
</p>`;

const rhythm = `
<h3>Prerequisites</h3>
<p>The command line tool, installed with <code>npm i -g &#64;acme/cli</code>.</p>
<ul>
  <li>Version 4 or later.</li>
  <li>Authenticated once with <kbd>acme login</kbd>.</li>
</ul>`;

const wideTable = `
<div slProseScroll labelledBy="environments">
  <table>
    <caption id="environments">Environments and their gates</caption>
    <thead>
      <tr>
        <th>Environment</th>
        <th>Approval</th>
        <th>Rollback window</th>
        <th>Notified</th>
        <th>Latency budget</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>development</td>
        <td>none</td>
        <td>—</td>
        <td>nobody</td>
        <td>—</td>
      </tr>
      <tr>
        <td>staging</td>
        <td>automatic</td>
        <td>1 hour</td>
        <td>the owning team</td>
        <td>250 ms</td>
      </tr>
      <tr>
        <td>production</td>
        <td>two reviewers</td>
        <td>24 hours</td>
        <td>the owning team and the on-call rota</td>
        <td>120 ms</td>
      </tr>
    </tbody>
  </table>
</div>`;

const specimen = `${opening}${rhythm}
<blockquote>
  <p>
    A deployment that cannot be reversed is not a deployment. It is a migration, and it needs a
    different review.
  </p>
</blockquote>
<h3>Running it</h3>
<pre><code>acme deploy --env production --wait
  ✓ built in 14s
  ✓ 3 instances healthy</code></pre>
<ol>
  <li>Build the image.</li>
  <li>Push it to the registry.</li>
  <li>Roll the instances, one zone at a time.</li>
</ol>
${wideTable}
<hr />
<dl>
  <dt>Zone</dt>
  <dd>One failure domain. A roll never touches two at once.</dd>
  <dt>Gate</dt>
  <dd>A condition that has to hold before the next zone starts.</dd>
</dl>
<details>
  <summary>What happens when a gate fails</summary>
  <p>The roll stops where it is, and instances already replaced keep serving.</p>
</details>
<p>
  Deprecated flags are struck through: <del>--fast</del> became <ins>--no-wait</ins> in version 4.
  Terms are marked on first use, like <mark>blue-green</mark>, and
  <abbr title="Service Level Objective">SLO</abbr> targets are checked at each gate.<sup>1</sup>
</p>
<h6>Revision history</h6>
<p><small>Last reviewed in March, by the platform team.</small></p>
<section slProseFootnotes>
  <ol>
    <li>Measured over the trailing seven days, not over the deployment window.</li>
  </ol>
</section>`;

/** The stage every scene stands on: this family answers its own inline size. */
const stage = (body: string) => `<div class="slotted-demo-stage" data-layout="block">${body}</div>`;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_PROSE_DOCS.prose.scenes, {
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

const meta: Meta<ProseStoryArgs> = {
  title: 'Components/Prose',
  component: SlProse,
  decorators: [
    moduleMetadata({
      imports: [
        SlContainer,
        SlLink,
        SlProse,
        SlProseAnchor,
        SlProseExclude,
        SlProseFootnotes,
        SlProseLead,
        SlProseScroll,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Prose',
        description:
          'The typography of a region the application did not author element by element. The tree arrives from a Markdown renderer, a CMS or a language model, and the page never gets to put an attribute on the h2. It styles bare tags, loses to every family placed inside it, and caps no width of its own.',
        framework: 'Angular',
        ...ANGULAR_PROSE_DOCS.prose,
        tokens: ANGULAR_PROSE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ProseStoryArgs>;

export const Playground: Story = {
  args: { flow: 'normal', size: 'lg' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: stage(`<div slProse [size]="size" [flow]="flow">${opening}${rhythm}</div>`),
  }),
};

export const Elements: Story = {
  parameters: scenario('elements'),
  render: () => ({ template: stage(`<div slProse>${specimen}</div>`) }),
};

export const Size: Story = {
  parameters: scenario('size'),
  render: () => ({
    template: stage(`
<div slProse size="md">
  <h3>Control size</h3>
  <p>
    Body text at <code>--slotted-font-size-md</code>: the step a button label is set in, for a
    region that sits inside dense product chrome.
  </p>
</div>
<div slProse size="lg">
  <h3>Reading size</h3>
  <p>
    Body text at one rem, the family default, for documentation and for anything a reader stays
    with for more than a sentence.
  </p>
</div>
<div slProse size="xl">
  <h3>Article size</h3>
  <p>
    Body text at <code>--slotted-font-size-xl</code>, where the page is the content rather than a
    panel beside it.
  </p>
</div>`),
  }),
};

export const Flow: Story = {
  parameters: scenario('flow'),
  render: () => ({
    props: { steps: ['tight', 'normal', 'loose'] },
    template: stage(`
@for (step of steps; track step) {
  <div slProse [flow]="step">
    <h3>{{ step }}</h3>
    <p>The same three blocks, at the distance this step gives them.</p>
    <p>The second block.</p>
    <ul>
      <li>And a list, which keeps its own tighter step.</li>
      <li>Two rows.</li>
    </ul>
  </div>
}`),
  }),
};

export const Lead: Story = {
  parameters: scenario('lead'),
  render: () => ({
    template: stage(`
<div slProse>
  <h3>With a lead</h3>
  <p slProseLead>
    Everything a team needs to move a service from a laptop to production, in the order the steps
    have to happen.
  </p>
  <p>A deployment is three decisions: where the code runs, when it moves, and who is told.</p>
</div>
<div slProse>
  <h3>Without one</h3>
  <p>
    Everything a team needs to move a service from a laptop to production, in the order the steps
    have to happen.
  </p>
  <p>A deployment is three decisions: where the code runs, when it moves, and who is told.</p>
</div>`),
  }),
};

export const Anchor: Story = {
  parameters: scenario('anchor'),
  render: () => ({
    template: stage(`
<div slProse>
  <h2 id="gates">Gates<a slProseAnchor href="#gates" aria-label="Link to this section">#</a></h2>
  <p>Hover the heading above, then press Tab from this paragraph: the permalink answers both.</p>
  <h3 id="zones">Zones<a slProseAnchor href="#zones" aria-label="Link to this section">#</a></h3>
  <p>Every level takes one, and every one holds its box whether it is visible or not.</p>
</div>`),
  }),
};

export const Scroll: Story = {
  parameters: scenario('scroll'),
  render: () => ({
    template: stage(`
<div slProse>
  <p>
    The table below is wider than this column. Press Tab: it is a named region with a tab stop of
    its own.
  </p>
  ${wideTable}
  <p>The one below fits, and takes neither.</p>
  <div slProseScroll aria-label="Two rows">
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
  </div>
</div>`),
  }),
};

export const Exclude: Story = {
  parameters: scenario('exclude'),
  render: () => ({
    props: {
      card: [
        'background: var(--slotted-surface-raised)',
        'border: 1px solid var(--slotted-border-subtle)',
        'border-radius: var(--slotted-radius-md)',
        'padding: var(--slotted-space-6)',
      ].join('; '),
    },
    template: stage(`
<div slProse>
  <h3>A component inside the page</h3>
  <p>
    This paragraph is set by the family. What follows is not: the subtree is returned to control
    type and left to whatever put it there.
  </p>
  <div slProseExclude [style]="card">
    <p>A card keeps its own type, its own rhythm and its own color.</p>
    <ul>
      <li>No marker gap.</li>
      <li>No editorial leading.</li>
    </ul>
  </div>
  <p>And the page continues, at the family's own size.</p>
</div>`),
  }),
};

export const Streaming: Story = {
  parameters: scenario('streaming'),
  render: () => ({
    props: {
      blocks: [
        'A deployment is three decisions: where the code runs, when it moves, and who is told.',
        'The first is the one this page is about, and it assumes the prerequisites are already met.',
        'A gate that fails stops the roll where it is; instances already replaced keep serving.',
        'Rollback is a decision the owning team takes, inside the window the environment allows.',
      ],
      shown: 1,
    },
    template: stage(`
<div slProse flow="tight">
  <h3>An answer still arriving</h3>
  @for (block of blocks.slice(0, shown); track block) {
    <p>{{ block }}</p>
  }
</div>
<button
  type="button"
  [disabled]="shown === blocks.length"
  (click)="shown = shown + 1"
>
  Append a block
</button>`),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: stage(`
<div slProse>
  <h3>A body that does not start at the top level</h3>
  <h4>Two headings with nothing between them</h4>
  <p>
    A pasted destination is one unbroken token and breaks inside the column rather than widening
    it:
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
  <p lang="ar" dir="rtl">فقرة عربية داخل نفس المنطقة، تُقرأ من اليمين إلى اليسار وتحتفظ بإيقاعها.</p>
  <blockquote>
    <p>
      Eine Zusammenarbeitsvereinbarung zwischen Rechenzentrumsbetreibern regelt die
      Kapazitätsverteilung.
    </p>
  </blockquote>
</div>`),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: stage(`
<div slContainer size="measure" [inset]="0">
  <article slProse flow="loose">
    <h3>Bounded by the container, framed by nothing</h3>
    <p>
      The measure belongs to <a slLink href="#container">slContainer</a>, and this family caps no
      width of its own. The link in this sentence is the real family: every content rule here
      weighs the same as the region's own identifier, so a component placed inside wins on
      specificity and is left exactly as it is.
    </p>
    <p>
      A bare <code>a</code> from the renderer reads the same theme tokens, so the two are one
      decision rather than two colors.
    </p>
  </article>
</div>`),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: stage(`
<div slProse>
  <h2 id="operable">
    The two operable things<a slProseAnchor href="#operable" aria-label="Link to this section">#</a>
  </h2>
  <p>
    Tab from here: the permalink above, then the link in this sentence —
    <a slLink href="#operable">a real one</a> — then the table below, which takes a stop only
    because it overflows.
  </p>
  ${wideTable}
</div>`),
  }),
};
