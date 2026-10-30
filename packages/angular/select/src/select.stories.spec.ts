import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/select/contract.json';
import { ANGULAR_SELECT_DOCS } from './select.docs';
import * as selectStories from './select.stories';

describe('Angular SELECT stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.select, selectStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    /* The declared model rather than the workbench's fallback table, which
       guesses that a family's text is called `value` — here it is the query,
       and `value` is the selection. A two-way `model()` is checked as the one
       row it is. */
    expect(
      apiMetadataErrors(
        contract.members.select,
        ANGULAR_SELECT_DOCS.select.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_SELECT_DOCS.select,
        framework: 'Angular',
        member: contract.members.select,
        scenarioIds: contract.scenarios.select,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_SELECT_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
  /**
   * A story opens its layer for the picture, on its own page. Inside the
   * reference page the same story is one demonstration among many, and a layer
   * nobody asked for is open over the demonstration below it — which is what
   * TT1 found for `tooltip`, G11 for `menu` and `combobox`, and G14 here.
   *
   * Not every story of this family opens one, so the guard counts the ones that
   * do rather than demanding the prop everywhere; what it demands everywhere is
   * that no template writes the layer open by hand.
   */
  describe('a layer opened for the picture', () => {
    type Pictured = { props?: Record<string, unknown>; template?: string };
    const pictured = Object.values(selectStories)
      .filter((story) => typeof story === 'object' && story !== null && 'render' in story)
      .map((story) => (story as { render: (args: never, context: never) => Pictured }).render);

    it('opens on a story of its own', () => {
      let opened = 0;
      for (const story of pictured) {
        const rendered = story({} as never, { viewMode: 'story' } as never);
        expect(rendered.template).not.toContain('[open]="true"');
        if (rendered.props?.['pictured'] === true) opened += 1;
      }
      expect(opened).toBeGreaterThan(0);
    });

    it('is closed on the reference page until the reader asks', () => {
      for (const story of pictured) {
        const rendered = story({} as never, { viewMode: 'docs' } as never);
        expect(rendered.props?.['pictured'] ?? false).toBe(false);
        expect(rendered.template).not.toContain('[open]="true"');
      }
    });
  });
});
