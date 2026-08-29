import type { ButtonGroupProps } from './button.types';

export function ButtonGroup({
  children,
  className,
  orientation = 'horizontal',
  ...nativeProps
}: ButtonGroupProps) {
  return (
    <div
      {...nativeProps}
      className={['slotted-button-group', className].filter(Boolean).join(' ')}
      data-orientation={orientation}
      data-slotted-component="button-group"
      role="group"
    >
      {children}
    </div>
  );
}
