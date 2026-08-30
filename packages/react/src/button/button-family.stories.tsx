import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario, WorkbenchMatrix } from '@slotted/storybook-workbench';
import { ChevronDown, Plus, Redo2, Save, Trash2, Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from './button';
import { ButtonGroup } from './button-group';
import { ButtonLink } from './button-link';
import { IconButton } from './icon-button';
import { ToggleButton } from './toggle-button';

const demoIcons = {
  'chevron-down': ChevronDown,
  plus: Plus,
  redo: Redo2,
  save: Save,
  trash: Trash2,
  undo: Undo2,
} as const;
const variants = ['accent', 'secondary', 'success', 'warning', 'danger'] as const;
const fills = ['solid', 'outline', 'ghost'] as const;

type Variant = (typeof variants)[number];
type Fill = (typeof fills)[number];

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

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

function AppearanceMatrix({
  matrix,
  note,
  renderCell,
}: {
  matrix: string;
  note: string;
  renderCell: (variant: Variant, fill: Fill) => ReactNode;
}) {
  return (
    <DemoScene label="Appearance matrix" note={note}>
      <div data-slotted-matrix={matrix}>
        <WorkbenchMatrix
          columns={variants.map(titleCase)}
          rows={fills.map((fill) => ({
            label: titleCase(fill),
            cells: variants.map((variant) => renderCell(variant, fill)),
          }))}
        />
      </div>
    </DemoScene>
  );
}

const meta = {
  title: 'Components/Button family/Overview',
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = {
  parameters: scenario('matrix'),
  render: () => (
    <main className="slotted-component-lab">
      <section className="slotted-component-lab__section">
        <SectionIntro
          description="Every semantic variant and fill on the native action primitive."
          title="Button"
        />
        <div className="slotted-component-lab__body">
          <AppearanceMatrix
            matrix="button"
            note="Five variants across all three fills."
            renderCell={(variant, fill) => (
              <Button fill={fill} key={variant} variant={variant}>
                {titleCase(variant)}
              </Button>
            )}
          />
        </div>
      </section>

      <section className="slotted-component-lab__section">
        <SectionIntro
          description="Navigation receives the same hierarchy without losing native link semantics."
          title="ButtonLink"
        />
        <div className="slotted-component-lab__body">
          <AppearanceMatrix
            matrix="button-link"
            note="The complete link appearance contract."
            renderCell={(variant, fill) => (
              <ButtonLink fill={fill} href={`/${variant}/${fill}`} key={variant} variant={variant}>
                {titleCase(variant)}
              </ButtonLink>
            )}
          />
        </div>
      </section>

      <section className="slotted-component-lab__section">
        <SectionIntro
          description="Icon-only actions expose the full appearance system with an accessible name."
          title="IconButton"
        />
        <div className="slotted-component-lab__body">
          <AppearanceMatrix
            matrix="icon-button"
            note="Every control contains a real Lucide icon."
            renderCell={(variant, fill) => (
              <IconButton
                aria-label={`${titleCase(variant)} ${fill} action`}
                fill={fill}
                key={variant}
                variant={variant}
              >
                <DemoIcon name="plus" />
              </IconButton>
            )}
          />
        </div>
      </section>

      <section className="slotted-component-lab__section">
        <SectionIntro
          description="Persistent actions use the same variants and fills as momentary actions."
          title="ToggleButton"
        />
        <div className="slotted-component-lab__body">
          <AppearanceMatrix
            matrix="toggle-button"
            note="Unpressed controls across every appearance."
            renderCell={(variant, fill) => (
              <ToggleButton fill={fill} key={variant} variant={variant}>
                {titleCase(variant)}
              </ToggleButton>
            )}
          />
        </div>
      </section>

      <section className="slotted-component-lab__section">
        <SectionIntro
          description="Pressed and unpressed controls remain distinguishable for every semantic variant."
          title="Toggle state"
        />
        <div className="slotted-component-lab__body">
          <DemoScene label="State matrix" note="Each variant is paired across both values.">
            <div data-slotted-matrix="toggle-state">
              <WorkbenchMatrix
                columns={variants.map(titleCase)}
                rows={([false, true] as const).map((pressed) => ({
                  label: pressed ? 'Pressed' : 'Unpressed',
                  cells: variants.map((variant) => (
                    <ToggleButton key={variant} pressed={pressed} variant={variant}>
                      {titleCase(variant)}
                    </ToggleButton>
                  )),
                }))}
              />
            </div>
          </DemoScene>
        </div>
      </section>

      <section className="slotted-component-lab__section">
        <SectionIntro
          description="Scale, interaction state, consumer content, and grouped actions in context."
          title="Usage and composition"
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
          <DemoScene label="Hierarchy" note="Primary and secondary actions remain unmistakable.">
            <div className="slotted-demo-row">
              <Button>Primary action</Button>
              <Button variant="secondary">Secondary action</Button>
            </div>
          </DemoScene>
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
              <IconButton aria-label="Undo" fill="outline" variant="secondary">
                <DemoIcon name="undo" />
              </IconButton>
              <IconButton aria-label="Redo" fill="outline" variant="secondary">
                <DemoIcon name="redo" />
              </IconButton>
              <IconButton aria-label="Delete" fill="outline" variant="secondary">
                <DemoIcon name="trash" />
              </IconButton>
            </ButtonGroup>
          </DemoScene>
          <DemoScene label="Split action" note="One primary action and its related options.">
            <ButtonGroup aria-label="Publish actions" className="slotted-split-action">
              <Button fill="solid" leading={<DemoIcon name="save" />} size="md" variant="accent">
                Publish
              </Button>
              <IconButton aria-label="More publish options" fill="solid" size="md" variant="accent">
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
              <Button variant="secondary">Explore</Button>
              <IconButton aria-label="Add item" fill="outline" variant="secondary">
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
              <Button fill="outline" variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
};
