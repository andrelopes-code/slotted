import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Check, X } from 'lucide-react';

import { VisuallyHidden } from './visually-hidden';
import { REACT_VISUALLY_HIDDEN_DOCS, REACT_VISUALLY_HIDDEN_TOKENS } from './visually-hidden.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

/**
 * The icon belongs to the consumer, and it is Lucide's. A character is never an
 * icon, and a reference page that used one would be teaching the wrong thing
 * beside the right one.
 */
const CROSS = <X aria-hidden="true" focusable="false" size={14} />;
const CHECK = <Check aria-hidden="true" focusable="false" size={14} />;

const meta = {
  title: 'Components/VisuallyHidden',
  component: VisuallyHidden,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'VisuallyHidden',
        description: 'Content a screen reader reads, the eye never sees, and layout never feels.',
        framework: 'React',
        ...REACT_VISUALLY_HIDDEN_DOCS.visuallyHidden,
        tokens: REACT_VISUALLY_HIDDEN_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: 'Remove invoice', focusable: false },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <button type="button">
          {CROSS}
          <VisuallyHidden {...args} />
        </button>
        <p>
          The button shows a glyph and nothing else. Its accessible name is the hidden text, so a
          screen reader announces the action the glyph stands for. Turn <code>focusable</code> on
          and press Tab to see the difference: the name becomes visible while the button holds
          focus.
        </p>
      </div>
    </div>
  ),
};

export const Focusable: Story = {
  parameters: scenario('focusable'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <VisuallyHidden focusable render={(props) => <a {...props} href="#visually-hidden-main" />}>
          Skip to content
        </VisuallyHidden>
        <p>
          Press Tab with focus inside this frame. The skip link above is hidden until it holds
          focus, then it stops being hidden and renders as the anchor it is — the component paints
          nothing on it, so its appearance is the one the consumer gives the link.
        </p>
        <p id="visually-hidden-main">The link’s destination.</p>
      </div>
    </div>
  ),
};

/**
 * The promise that separates this primitive from `aria-label`: the content is
 * read and it costs no space. Both rows carry the same two buttons, and the
 * second one carries hidden text inside the first button and between the two.
 */
export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Without hidden content</span>
          <span className="slotted-demo-scene__note">Two buttons in a row with a gap.</span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div className="slotted-demo-row">
            <button type="button">A</button>
            <button type="button">B</button>
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">With hidden content</span>
          <span className="slotted-demo-scene__note">
            The same row, with a name inside the first button and a hidden span between the two.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div className="slotted-demo-row">
            <button type="button">
              A<VisuallyHidden>pprove</VisuallyHidden>
            </button>
            <VisuallyHidden>Not a third gap</VisuallyHidden>
            <button type="button">B</button>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">A column header shown as a glyph</span>
          <span className="slotted-demo-scene__note">
            The hidden text names the column for a screen reader.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <table>
            <thead>
              <tr>
                <th scope="col">Invoice</th>
                <th scope="col">
                  {CHECK}
                  <VisuallyHidden>Paid</VisuallyHidden>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>INV-0042</td>
                <td>Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Extra context for a repeated link</span>
          <span className="slotted-demo-scene__note">
            Every link on the page reads &ldquo;Read more&rdquo; without it.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <a href="#visually-hidden-main">
            Read more
            <VisuallyHidden> about quarterly billing</VisuallyHidden>
          </a>
        </div>
      </section>
    </div>
  ),
};
