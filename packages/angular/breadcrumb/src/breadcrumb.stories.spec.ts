import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/breadcrumb/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_BREADCRUMB_DOCS } from './breadcrumb.docs';
import * as breadcrumbStories from './breadcrumb.stories';

describe('Angular Breadcrumb stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.breadcrumb, breadcrumbStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_BREADCRUMB_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_BREADCRUMB_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_BREADCRUMB_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
