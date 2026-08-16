import { AppShell, PageHeader } from "../../_components/app-shell";
import { ContentWorkspace } from "../../_components/content-workspace";
import { storyFrames } from "../../_lib/demo-data";

export default function ContentDetailPage() {
  return (
    <AppShell active="calendar">
      <PageHeader
        action={<span className="status-chip ready">Připraveno</span>}
        description="Instagram Story · středa 5. srpna · cíl Akvizice"
        eyebrow="Detail obsahu"
        title="Soukromí bez čekání"
      />
      <ContentWorkspace initialFrames={storyFrames} />
    </AppShell>
  );
}
