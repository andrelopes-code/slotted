import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/dialog/contract.json';
import * as alertDialogStories from './alert-dialog.stories';
import { ANGULAR_DIALOG_DOCS } from './dialog.docs';
import * as dialogStories from './dialog.stories';

describe('SlDialog stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.dialog, dialogStories)).toEqual([]);
    expect(scenarioCoverageErrors(contract.scenarios.alertDialog, alertDialogStories)).toEqual([]);
  });

  /**
   * The state model is deliberately not handed over here. `docs/state-and-events.md`
   * names the uncontrolled half `defaultOpen` for React and "initial input plus
   * internal state" for Angular, and a `model()` is both halves at once — so a
   * `defaultOpen` row would document an input this binding does not have.
   */
  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof ANGULAR_DIALOG_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], ANGULAR_DIALOG_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_DIALOG_DOCS.dialog,
        framework: 'Angular',
        member: contract.members.dialog,
        scenarioIds: contract.scenarios.dialog,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);

    expect(
      referencePageErrors({
        docs: ANGULAR_DIALOG_DOCS.alertDialog,
        framework: 'Angular',
        member: contract.members.alertDialog,
        scenarioIds: contract.scenarios.alertDialog,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_DIALOG_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
