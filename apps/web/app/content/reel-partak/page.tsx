import { AppShell, PageHeader } from "../../_components/app-shell";
import { FormatContentDetail } from "../../_components/format-content-detail";
import { reelPartnerPackage } from "../../_lib/content-formats";

export default function ReelContentDetailPage() {
  return (
    <AppShell active="calendar">
      <PageHeader
        description="Instagram Reel · 7. srpna · cíl Zapojení"
        eyebrow="Detail obsahu"
        title="5 důvodů vzít parťáka"
      />
      <FormatContentDetail content={reelPartnerPackage} />
    </AppShell>
  );
}
