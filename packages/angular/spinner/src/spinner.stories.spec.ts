import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/spinner/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_SPINNER_DOCS } from './spinner.docs';
import * as spinnerStories from './spinner.stories';

describe('Angular Spinner stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.spinner, spinnerStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_SPINNER_DOCS
    >) {
      expect(apiMetadataErrors(contract.members[member], ANGULAR_SPINNER_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_SPINNER_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
