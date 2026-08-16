import { AppShell, PageHeader } from "../../_components/app-shell";
import { FormatContentDetail } from "../../_components/format-content-detail";
import { postBenefitsPackage } from "../../_lib/content-formats";

export default function PostContentDetailPage() {
  return (
    <AppShell active="calendar">
      <PageHeader
        description="Instagram Post · 12. srpna · cíl Akvizice"
        eyebrow="Detail obsahu"
        title="Benefity MyFit"
      />
      <FormatContentDetail content={postBenefitsPackage} />
    </AppShell>
  );
}
