import '@slotted/styles/description-list/description-list.css';

import type { DescriptionListProps, DescriptionListRootProps } from './description-list.types';

export function DescriptionList({
  className,
  orientation = 'vertical',
  render,
  ...nativeProps
}: DescriptionListProps) {
  const rootProps: DescriptionListRootProps = {
    ...nativeProps,
    className: ['slotted-description-list', className].filter(Boolean).join(' '),
    'data-orientation': orientation,
    'data-part': 'root',
    'data-slotted-component': 'description-list',
  };

  return render === undefined ? <dl {...rootProps} /> : render(rootProps);
}
