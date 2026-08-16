import { AppShell, PageHeader } from "../_components/app-shell";
import { TodayLiveDashboard } from "../_components/today-live-dashboard";

function formatToday() {
  const formatted = new Intl.DateTimeFormat("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Prague",
  }).format(new Date());

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default function TodayPage() {
  return (
    <AppShell active="today">
      <PageHeader eyebrow="Co dnes musím udělat?" title={formatToday()} />
      <TodayLiveDashboard />
    </AppShell>
  );
}
