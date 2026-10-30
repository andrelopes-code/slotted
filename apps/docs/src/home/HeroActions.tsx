import { ArrowRight } from 'lucide-react';

import { ButtonLink } from '@slotted/react/button';

/** Rendered on the server only: two links, no script. */
export default function HeroActions() {
  return (
    <div className="hero-actions">
      <ButtonLink href="/foundations/introduction/" size="lg">
        Get started
      </ButtonLink>
      <ButtonLink
        href="/react/components/field/"
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
