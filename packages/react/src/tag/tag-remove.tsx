import type { TagRemoveProps } from './tag.types';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

/**
 * The cross is drawn by the stylesheet, so the control takes no children: a
 * glyph passed here would sit beside the drawn one rather than replacing it.
 * The name is the consumer's, because "Remove" alone does not say what.
 */
export function TagRemove({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  disabled = false,
  type = 'button',
  ...nativeProps
}: TagRemoveProps) {
  if (isDevelopment && !ariaLabel?.trim() && !ariaLabelledBy?.trim()) {
    console.warn(
      'TagRemove has no accessible name. Give it aria-label naming the value it removes, such as "Remove design".',
    );
  }

  return (
    <button
      {...nativeProps}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-disabled={disabled ? '' : undefined}
      data-part="remove"
      disabled={disabled}
      type={type}
    />
  );
}
