import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { VisuallyHidden } from './visually-hidden';
import { REACT_VISUALLY_HIDDEN_DOCS, REACT_VISUALLY_HIDDEN_TOKENS } from './visually-hidden.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta = {
  title: 'Components/VisuallyHidden',
  component: VisuallyHidden,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'VisuallyHidden',
        description: 'Content a screen reader reads and the eye never sees.',
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
  args: { children: 'Delete invoice', focusable: false },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <button type="button">
          <span aria-hidden="true">🗑</span>
          <VisuallyHidden {...args} />
        </button>
        <p>
          The button shows a glyph and nothing else. Its accessible name is the hidden text, so a
          screen reader announces the action the glyph stands for.
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
          focus, then it lays itself out like any other link.
        </p>
        <p id="visually-hidden-main">The link's destination.</p>
      </div>
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
                  <span aria-hidden="true">✓</span>
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
