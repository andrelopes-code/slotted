import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/command-palette/contract.json';
import { ANGULAR_COMMAND_PALETTE_DOCS } from './command-palette.docs';
import * as stories from './command-palette.stories';

describe('Command palette stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.commandPalette, stories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.commandPalette,
        ANGULAR_COMMAND_PALETTE_DOCS.commandPalette.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_COMMAND_PALETTE_DOCS.commandPalette,
        framework: 'Angular',
        member: contract.members.commandPalette,
        scenarioIds: contract.scenarios.commandPalette,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_COMMAND_PALETTE_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
