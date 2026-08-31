import { useCallback } from 'react';
import type { ReactEventHandler } from 'react';

import { useAvatar } from './avatar-context';
import type { AvatarImageProps } from './avatar.types';

/**
 * A picture already in the browser cache finishes decoding before React
 * attaches the load handler, so the callback ref asks the element whether it is
 * already complete rather than waiting for an event that has been and gone.
 */
export function AvatarImage({ onError, onLoad, ...nativeProps }: AvatarImageProps) {
  const avatar = useAvatar();
  const setLoaded = avatar?.setLoaded;

  const measure = useCallback(
    (element: HTMLImageElement | null) => {
      if (element === null || setLoaded === undefined) return;
      if (element.complete && element.naturalWidth > 0) setLoaded(true);
    },
    [setLoaded],
  );

  const handleLoad: ReactEventHandler<HTMLImageElement> = (event) => {
    setLoaded?.(true);
    onLoad?.(event);
  };

  const handleError: ReactEventHandler<HTMLImageElement> = (event) => {
    setLoaded?.(false);
    onError?.(event);
  };

  return (
    <img
      {...nativeProps}
      data-part="image"
      onError={handleError}
      onLoad={handleLoad}
      ref={measure}
    />
  );
}
