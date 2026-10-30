import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/dialog/contract.json';
import * as alertDialogStories from './alert-dialog.stories';
import { REACT_DIALOG_DOCS } from './dialog.docs';
import * as dialogStories from './dialog.stories';

describe('Dialog stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.dialog, dialogStories)).toEqual([]);
    expect(scenarioCoverageErrors(contract.scenarios.alertDialog, alertDialogStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof REACT_DIALOG_DOCS>) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          REACT_DIALOG_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_DIALOG_DOCS.dialog,
        framework: 'React',
        member: contract.members.dialog,
        scenarioIds: contract.scenarios.dialog,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);

    expect(
      referencePageErrors({
        docs: REACT_DIALOG_DOCS.alertDialog,
        framework: 'React',
        member: contract.members.alertDialog,
        scenarioIds: contract.scenarios.alertDialog,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_DIALOG_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
