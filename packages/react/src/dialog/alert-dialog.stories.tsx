import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { Button } from '../button';
import { Grid, Scene } from '../field/field-demo';
import { Text } from '../typography';
import { AlertDialog } from './dialog';
import { Layer } from './dialog-demo';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogIcon,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog-parts';
import { REACT_DIALOG_DOCS, REACT_DIALOG_TOKENS } from './dialog.docs';
import type { AlertDialogProps } from './dialog.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DIALOG_DOCS.alertDialog.scenes, {
    playground: Playground,
    tones: Tones,
    actions: Actions,
    policy: Policy,
    focus: Focus,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Dialog/AlertDialog',
  component: AlertDialog,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'AlertDialog',
        description:
          'A dialog that interrupts to confirm something irreversible. The two rules the pattern gives it — an outside press never closes it, and focus lands on the least destructive action — are defaults of the member rather than props a consumer remembers to set.',
        framework: 'React',
        ...REACT_DIALOG_DOCS.alertDialog,
        tokens: REACT_DIALOG_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A confirmation is opened, never left standing.
 *
 * The member fixes `modal` at true, which is the pattern's own rule: the page
 * behind is inert and the document scroll is locked while it is up. A reference
 * page carrying eight of them at once would therefore lock its own scroll eight
 * times and inert everything around them — so each one is behind the trigger a
 * reader presses, which is also what happens in an application.
 *
 * The panel is the picture in every scene below; the trigger is how the reader
 * gets to it.
 */
function Confirm({
  action = 'Delete project',
  body,
  cancel = 'Keep project',
  container,
  description = 'The project and its 42 documents are removed for everyone. This cannot be undone.',
  title = 'Delete this project?',
  trigger = 'Delete project',
  ...props
}: Partial<AlertDialogProps> & {
  action?: string;
  body?: ReactNode;
  cancel?: string;
  container: Element;
  description?: string;
  title?: string;
  trigger?: string;
}) {
  return (
    <AlertDialog container={container} {...props}>
      <DialogTrigger
        render={(control) => (
          <Button
            {...control}
            tone={props.tone === 'warning' ? 'warning' : 'danger'}
            variant="outline"
          >
            {trigger}
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <AlertDialogIcon />
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body === undefined ? null : <DialogBody>{body}</DialogBody>}
        <DialogFooter>
          <AlertDialogCancel
            render={({ children, ...control }) => (
              <Button {...control} size="sm" tone="secondary" variant="outline">
                {children}
              </Button>
            )}
          >
            {cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            render={({ children, ...control }) => (
              <Button {...control} size="sm" tone={props.tone === 'warning' ? 'warning' : 'danger'}>
                {children}
              </Button>
            )}
          >
            {action}
          </AlertDialogAction>
        </DialogFooter>
      </DialogContent>
    </AlertDialog>
  );
}

export const Playground: Story = {
  args: { escape: 'close', loading: false, placement: 'center', size: 'sm', tone: 'danger' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Layer>
      {(container) => (
        <AlertDialog {...args} container={container}>
          <DialogTrigger
            render={(props) => (
              <Button {...props} tone="danger" variant="outline">
                Delete project
              </Button>
            )}
          />
          <DialogContent>
            <DialogHeader>
              <AlertDialogIcon />
              <DialogTitle>Delete this project?</DialogTitle>
              <DialogDescription>
                The project and its 42 documents are removed for everyone. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <AlertDialogCancel
                render={({ children, ...control }) => (
                  <Button {...control} size="sm" tone="secondary" variant="outline">
                    {children}
                  </Button>
                )}
              >
                Manter projeto
              </AlertDialogCancel>
              <AlertDialogAction
                render={({ children, ...control }) => (
                  <Button {...control} size="sm" tone="danger">
                    {children}
                  </Button>
                )}
              >
                Delete project
              </AlertDialogAction>
            </DialogFooter>
          </DialogContent>
        </AlertDialog>
      )}
    </Layer>
  ),
};

export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="danger — the default"
        note="Press Delete project: a struck circle, because what follows cannot be undone. The mark is a mask from a glyph token, so it survives forced colours, where the tone’s colour does not."
      >
        <Layer>{(container) => <Confirm container={container} />}</Layer>
      </Scene>
      <Scene
        label="warning — a decision, not a deletion"
        note="Press Leave without saving: a triangle, the one silhouette in the set that has to be recognised before its colour is. The action reads as the consequence rather than as a threat."
      >
        <Layer>
          {(container) => (
            <Confirm
              action="Discard edits"
              cancel="Keep editing"
              container={container}
              description="Your last three edits have not been saved yet."
              title="Leave without saving?"
              trigger="Leave without saving"
              tone="warning"
            />
          )}
        </Layer>
      </Scene>
    </Grid>
  ),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Labels that name the action"
        note="Open it and read the two buttons: “Delete project” and “Keep project”, not “Yes” and “No”. A reader who hears only the buttons still knows which one does what, which is the whole reason the pattern asks for concrete labels."
      >
        <Layer>{(container) => <Confirm container={container} />}</Layer>
      </Scene>
      <Scene
        label="Each one carries its own result"
        note="The action closes with reason submit and result “confirm”; the cancel with dismiss and “cancel”. A consumer reading the request knows which control the reader chose without tracking it themselves."
      >
        <Layer>
          {(container) => (
            <Confirm
              action="Send anyway"
              cancel="Review"
              container={container}
              description="Three recipients are outside your organization."
              title="Send outside the organization?"
              trigger="Send anyway"
              tone="warning"
            />
          )}
        </Layer>
      </Scene>
    </Grid>
  ),
};

export const Policy: Story = {
  parameters: scenario('policy'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The scrim does nothing"
        note="Open it, then click outside the panel: nothing happens, and there is no prop that changes it. A destructive confirmation a stray click dismisses is what fixing the policy to the member prevents."
      >
        <Layer>{(container) => <Confirm container={container} />}</Layer>
      </Scene>
      <Scene
        label='escape="none", for a cancel that is not safe'
        note="Escape is accepted by default, because a member that requires a cancel action can always cancel. A flow where leaving mid-way is itself destructive turns it off."
      >
        <Layer>
          {(container) => (
            <Confirm
              action="End migration"
              cancel="Continue migration"
              container={container}
              description="Ending now leaves 1,204 records half-done."
              escape="none"
              title="End the migration?"
              trigger="End migration"
            />
          )}
        </Layer>
      </Scene>
    </Grid>
  ),
};

export const Focus: Story = {
  parameters: scenario('focus'),
  render: () => (
    <Scene
      label="The ring is on “Manter projeto”"
      note="Open it and look at the ring: it is on the cancel, not on the first tabbable element, which would be the destructive one here. The APG asks for the least destructive action on a step that is not easily reversible, and the member does it without being asked."
    >
      <Layer>{(container) => <Confirm container={container} />}</Layer>
    </Scene>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A description, then the detail"
        note="The description stays the one sentence aria-describedby announces; the list of what is going lives in the body, so a reader hears the consequence before the inventory."
      >
        <Layer>
          {(container) => (
            <Confirm
              body={<Text size="sm">Monthly report, Results presentation and Proposal draft.</Text>}
              container={container}
              description="This cannot be undone."
              title="Delete 3 documents?"
              trigger="Delete 3 documents"
            />
          )}
        </Layer>
      </Scene>
      <Scene
        label="A title the panel cannot hold"
        note="The words wrap and the row grows; the mark keeps its own column, so it stays on the first line’s optical centre rather than sliding down beside the second."
      >
        <Layer>
          {(container) => (
            <Confirm
              container={container}
              description="Der Vorgang entfernt sämtliche Bereitstellungsartefakte unwiderruflich."
              title="Produktions-Bereitstellungspipeline endgültig entfernen?"
              trigger="Pipeline entfernen"
            />
          )}
        </Layer>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Scene
      label="The actions are the library’s own buttons"
      note="render hands each control every attribute the family wrote, so the danger button is a Button with the closing behaviour on it. Nothing is wrapped, and the tone comes from the button rather than from the dialog."
    >
      <Layer>{(container) => <Confirm container={container} size="md" />}</Layer>
    </Scene>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Scene
      label='role="alertdialog", and a description that is not optional'
      note="The role is what lets a screen reader treat this differently from a dialog; the mandatory aria-describedby is what makes sure the sentence saying what will be destroyed is announced with the title."
    >
      <Layer>{(container) => <Confirm container={container} />}</Layer>
    </Scene>
  ),
};
