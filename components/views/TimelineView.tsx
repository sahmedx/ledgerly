import ScenarioRibbon from '@/components/timeline/ScenarioRibbon';
import VendorTimeline from '@/components/timeline/VendorTimeline';

export default function TimelineView() {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ScenarioRibbon />
      <VendorTimeline />
    </div>
  );
}
