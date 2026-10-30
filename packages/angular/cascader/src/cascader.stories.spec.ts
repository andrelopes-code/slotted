import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/cascader/contract.json';
import { ANGULAR_CASCADER_DOCS } from './cascader.docs';
import * as cascaderStories from './cascader.stories';

describe('Angular CASCADER stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.cascader, cascaderStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.cascader,
        ANGULAR_CASCADER_DOCS.cascader.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_CASCADER_DOCS.cascader,
        framework: 'Angular',
        member: contract.members.cascader,
        scenarioIds: contract.scenarios.cascader,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_CASCADER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
  /**
   * A story opens its layer for the picture, on its own page. Inside the
   * reference page the same story is one demonstration among many, and a layer
   * nobody asked for is open over the demonstration below it — which is what
   * TT1 found for `tooltip` and G11 found here.
   */
  describe('a layer opened for the picture', () => {
    type Pictured = { props?: Record<string, unknown>; template?: string };
    const pictured = Object.values(cascaderStories)
      .filter((story) => typeof story === 'object' && story !== null && 'render' in story)
      .map((story) => (story as { render: (args: never, context: never) => Pictured }).render);

    it('opens on a story of its own', () => {
      for (const story of pictured) {
        const rendered = story({} as never, { viewMode: 'story' } as never);
        expect(rendered.props?.['pictured']).toBe(true);
        expect(rendered.template).not.toContain('[open]="true"');
      }
    });

    it('is closed on the reference page until the reader asks', () => {
      for (const story of pictured) {
        const rendered = story({} as never, { viewMode: 'docs' } as never);
        expect(rendered.props?.['pictured']).toBe(false);
      }
    });
  });
});
