import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/stepper/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_STEPPER_DOCS } from './stepper.docs';
import * as stepperStories from './stepper.stories';

describe('Stepper stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.stepper, stepperStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof REACT_STEPPER_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], REACT_STEPPER_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_STEPPER_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
