import type { AvatarFallbackProps } from './avatar.types';

/**
 * Always rendered. The stylesheet takes it out of the document once the
 * picture arrives, which keeps the two frameworks identical here and means the
 * fallback is present for the request that never returns.
 */
export function AvatarFallback(props: AvatarFallbackProps) {
  return <span {...props} data-part="fallback" />;
}
