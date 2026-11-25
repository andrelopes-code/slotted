import { ArrowRight } from 'lucide-react';

import { ButtonLink } from '@slotted/react/button';

import { sitePath } from '../lib/site';

/** Rendered on the server only: two links, no script. */
export default function HeroActions() {
  return (
    <div className="hero-actions">
      <ButtonLink href={sitePath('/foundations/introduction/')} size="lg">
        Get started
      </ButtonLink>
      <ButtonLink
        href={sitePath('/react/components/field/')}
        size="lg"
        variant="ghost"
        tone="secondary"
        end={<ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}
      >
        Browse components
      </ButtonLink>
    </div>
  );
}
