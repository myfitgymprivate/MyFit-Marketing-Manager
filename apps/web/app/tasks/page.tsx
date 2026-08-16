import { AppShell, PageHeader } from "../_components/app-shell";
import { TaskCompleteButton } from "../_components/task-complete-button";
import { TasksWorkspace } from "../_components/tasks-workspace";

export default function TasksPage() {
  return (
    <AppShell active="tasks">
      <PageHeader
        description="Jednorázové a opakované úkoly, které podporují realizaci marketingového plánu."
        eyebrow="Úkoly a kontroly"
        title="Co je potřeba dokončit"
      />

      <section className="panel priority-panel task-hero">
        <div className="panel-heading">
          <div>
            <p className="eyebrow danger">Denní kumulovaná kontrola</p>
            <h2>Vstupy zdarma za úrovně</h2>
          </div>
          <span className="alert-badge">3 dny od kontroly</span>
        </div>
        <p className="muted">
          Při nesplnění nevznikají duplicity. Počet dnů pouze roste u jediné
          otevřené položky.
        </p>
        <TaskCompleteButton />
      </section>

      <TasksWorkspace />
    </AppShell>
  );
}
