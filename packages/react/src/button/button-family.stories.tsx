import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario, WorkbenchMatrix } from '@slotted/storybook-workbench';
import { ChevronDown, Plus, Redo2, Save, Trash2, Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from './button';
import { ButtonGroup } from './button-group';
import { IconButton } from './icon-button';

const demoIcons = {
  'chevron-down': ChevronDown,
  plus: Plus,
  redo: Redo2,
  save: Save,
  trash: Trash2,
  undo: Undo2,
} as const;

function DemoIcon({ name }: { name: keyof typeof demoIcons }) {
  const Icon = demoIcons[name];
  return <Icon aria-hidden="true" focusable="false" strokeWidth={1.75} />;
}

function SectionIntro({ description, title }: { description: string; title: string }) {
  return (
    <header className="slotted-component-lab__intro">
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

function DemoScene({
  children,
  label,
  note,
}: {
  children: ReactNode;
  label: string;
  note: string;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage">{children}</div>
    </section>
  );
}

const meta = {
  title: 'Components/Button family/Overview',
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const tones = ['neutral', 'accent', 'success', 'warning', 'danger'] as const;

export const Matrix: Story = {
  parameters: scenario('matrix'),
  render: () => (
    <main className="slotted-component-lab">
      <section className="slotted-component-lab__section">
        <SectionIntro
          description="Every tone and variant on one stable comparison plane."
          title="Appearance"
        />
        <div className="slotted-component-lab__body">
          <WorkbenchMatrix
            columns={['Neutral', 'Accent', 'Success', 'Warning', 'Danger']}
            rows={(['solid', 'outline', 'ghost'] as const).map((variant) => ({
              label: variant.charAt(0).toUpperCase() + variant.slice(1),
              cells: tones.map((tone) => (
                <Button key={tone} tone={tone} variant={variant}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </Button>
              )),
            }))}
          />
        </div>
      </section>

      <section className="slotted-component-lab__section">
        <SectionIntro
          description="Scale and interaction states stay aligned without isolated samples."
          title="Scale and state"
        />
        <div className="slotted-component-lab__body slotted-demo-grid" data-columns="3">
          <DemoScene label="Sizes" note="Three explicit control heights.">
            <div className="slotted-demo-row">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </DemoScene>
          <DemoScene label="States" note="Default, unavailable, and in progress.">
            <div className="slotted-demo-row">
              <Button>Default</Button>
              <Button disabled>Disabled</Button>
              <Button loading loadingText="Saving">
                Save
              </Button>
            </div>
          </DemoScene>
          <DemoScene label="Density" note="Layout changes without API changes.">
            <div className="slotted-demo-row">
              <span data-slotted-density="comfortable">
                <Button>Comfortable</Button>
              </span>
              <span data-slotted-density="compact">
                <Button>Compact</Button>
              </span>
            </div>
          </DemoScene>
        </div>
      </section>

      <section className="slotted-component-lab__section">
        <SectionIntro
          description="Consumer content, toolbars, and split actions remain composition, not special cases."
          title="Composition"
        />
        <div className="slotted-component-lab__body slotted-demo-grid" data-columns="3">
          <DemoScene label="Content" note="Replaceable icons and full-width layout.">
            <div className="slotted-demo-stack slotted-demo-measure">
              <Button
                leading={<DemoIcon name="save" />}
                trailing={<DemoIcon name="chevron-down" />}
              >
                Save draft
              </Button>
              <Button fullWidth leading={<DemoIcon name="plus" />}>
                Create document
              </Button>
            </div>
          </DemoScene>
          <DemoScene
            label="Inside ButtonGroup"
            note="A compact editing toolbar with one seam system."
          >
            <ButtonGroup aria-label="Editing history">
              <IconButton aria-label="Undo" tone="neutral" variant="outline">
                <DemoIcon name="undo" />
              </IconButton>
              <IconButton aria-label="Redo" tone="neutral" variant="outline">
                <DemoIcon name="redo" />
              </IconButton>
              <IconButton aria-label="Delete" tone="neutral" variant="outline">
                <DemoIcon name="trash" />
              </IconButton>
            </ButtonGroup>
          </DemoScene>
          <DemoScene label="Split action" note="One primary action and its related options.">
            <ButtonGroup aria-label="Publish actions" className="slotted-split-action">
              <Button leading={<DemoIcon name="save" />} size="md" tone="accent" variant="solid">
                Publish
              </Button>
              <IconButton aria-label="More publish options" size="md" tone="accent" variant="solid">
                <DemoIcon name="chevron-down" />
              </IconButton>
            </ButtonGroup>
          </DemoScene>
        </div>
      </section>
    </main>
  ),
};

export const Themes: Story = {
  parameters: scenario('themes'),
  render: () => (
    <div className="slotted-demo-grid">
      {(['light', 'dark'] as const).map((scheme) => (
        <section className="slotted-demo-scene" key={scheme}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">
              {scheme.charAt(0).toUpperCase() + scheme.slice(1)} scheme
            </span>
            <span className="slotted-demo-scene__note">The same semantic contract.</span>
          </header>
          <div className="slotted-demo-stage" data-slotted-scheme={scheme}>
            <div className="slotted-demo-row">
              <Button leading={<DemoIcon name="save" />}>Save draft</Button>
              <IconButton aria-label="Add item" variant="outline">
                <DemoIcon name="plus" />
              </IconButton>
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Densities: Story = {
  parameters: scenario('densities'),
  render: () => (
    <div className="slotted-demo-grid">
      {(['comfortable', 'compact'] as const).map((density) => (
        <section className="slotted-demo-scene" data-slotted-density={density} key={density}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">
              {density.charAt(0).toUpperCase() + density.slice(1)}
            </span>
            <span className="slotted-demo-scene__note">Spacing changes, semantics do not.</span>
          </header>
          <div className="slotted-demo-stage">
            <div className="slotted-demo-row">
              <Button leading={<DemoIcon name="save" />}>Save</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
};
