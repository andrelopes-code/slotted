import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/stepper/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_STEPPER_DOCS } from './stepper.docs';
import * as stepperStories from './stepper.stories';

describe('Angular Stepper stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.stepper, stepperStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_STEPPER_DOCS
    >) {
      expect(apiMetadataErrors(contract.members[member], ANGULAR_STEPPER_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_STEPPER_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
