import { AppShell, PageHeader } from "../_components/app-shell";
import { CalendarWorkspace } from "../_components/calendar-workspace";

export default function CalendarPage() {
  return (
    <AppShell active="calendar">
      <PageHeader
        description="Marketingový plán propojuje Story, Reel, Post, kampaně a úkoly do jednoho tématu."
        eyebrow="Marketingový kalendář"
        title="Plán obsahu"
      />
      <CalendarWorkspace />
    </AppShell>
  );
}
