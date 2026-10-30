import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/button-group/button-group.css';

import { ButtonDefaultsProvider } from '../button/button-defaults';
import { ButtonGroupShapeProvider } from './button-group-shape';
import type { ButtonGroupProps, ButtonGroupRootProps } from './button-group.types';

/**
 * A set of related actions joined into one shape. The group arranges what the
 * consumer wrote and changes the semantics of nothing inside it: every button
 * keeps its own role, its own state and its own place in the tab sequence.
 *
 * It is `role="group"` and not `role="toolbar"`, and the difference is a
 * keyboard model rather than a name. A toolbar is one tab stop with arrow-key
 * navigation between its controls, which is the `toolbar` family. A consumer
 * who writes `role="toolbar"` here gets the role and not the model, so the two
 * are never confused by accident — the explicit value wins, and it is written
 * before the family's own so it can. `role={undefined}` is a value too, and it
 * is how a substituted `nav` or `section` keeps the semantics it was chosen
 * for.
 *
 * There is no `label` prop. The element already accepts `aria-label` and
 * `aria-labelledby`, and a second way to name one thing is a second thing to
 * get wrong.
 */
export function ButtonGroup({
  align,
  children,
  fullWidth,
  justify,
  orientation,
  render,
  size,
  tone,
  variant,
  ...nativeProps
}: ButtonGroupProps) {
  const flow = orientation ?? 'horizontal';
  const paints = size !== undefined || tone !== undefined || variant !== undefined;

  const content = (
    <ButtonGroupShapeProvider value={{ orientation: flow }}>
      {paints ? (
        <ButtonDefaultsProvider size={size} tone={tone} variant={variant}>
          {children}
        </ButtonDefaultsProvider>
      ) : (
        children
      )}
    </ButtonGroupShapeProvider>
  );

  const rootProps: ButtonGroupRootProps = keyedProps({
    role: 'group',
    ...nativeProps,
    ...(align === undefined ? {} : { 'data-align': align }),
    ...(justify === undefined ? {} : { 'data-justify': justify }),
    ...(orientation === undefined ? {} : { 'data-orientation': orientation }),
    ...(fullWidth ? { 'data-full-width': '' } : {}),
    'data-part': 'root',
    'data-ui': 'button-group',
    children: content,
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
