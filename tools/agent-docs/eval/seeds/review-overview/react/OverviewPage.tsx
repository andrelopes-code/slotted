import { Section, SectionBody, SectionHeader, SectionTitle } from '@slotted/react/section';
import {
  StatCard,
  StatCardDelta,
  StatCardFigure,
  StatCardHeader,
  StatCardLabel,
  StatCardValue,
} from '@slotted/react/stat-card';

export function OverviewPage() {
  return (
    <Section ground="surface">
      <SectionHeader>
        <SectionTitle>Revenue this month</SectionTitle>
      </SectionHeader>
      <SectionBody>
        <StatCard delta={0.124}>
          <StatCardHeader>
            <StatCardLabel>Revenue</StatCardLabel>
          </StatCardHeader>
          <StatCardFigure>
            <StatCardValue value={48200} />
            <StatCardDelta />
          </StatCardFigure>
        </StatCard>
      </SectionBody>
    </Section>
  );
}
