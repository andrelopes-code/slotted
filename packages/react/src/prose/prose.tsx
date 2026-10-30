import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/prose/prose.css';

import { useProseDefaults } from './prose-defaults';
import type { ProseProps, ProseRootProps } from './prose.types';

/**
 * The typography of a region the application did not author element by
 * element. The tree arrives from a Markdown renderer, a CMS or a language
 * model, and the page never gets to put an attribute on the `h2`.
 *
 * Text the application does author is `Text` and `Heading`: those carry a
 * size, a weight and a tone per element, and wrapping two authored paragraphs
 * in this family is choosing a recipe over a decision. The boundary is who
 * wrote the tags.
 *
 * It does not sanitise. The renderer that produced the tree is where a
 * sanitiser belongs, and a component that both styled and sanitised would hide
 * which of the two failed.
 *
 * The region paints no maximum width. `Container` owns measure, and one
 * element composes it:
 *
 * ```tsx
 * <Container size="measure">
 *   <Prose>{rendered}</Prose>
 * </Container>
 * ```
 */
export function Prose({ flow, render, size, ...nativeProps }: ProseProps) {
  const defaults = useProseDefaults();

  const rootProps: ProseRootProps = keyedProps({
    ...nativeProps,
    'data-flow': flow ?? defaults.flow,
    'data-part': 'root',
    'data-size': size ?? defaults.size,
    'data-ui': 'prose',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
