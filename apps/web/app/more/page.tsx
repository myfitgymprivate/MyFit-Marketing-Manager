import { AppShell, PageHeader } from "../_components/app-shell";
import { ModuleGrid } from "../_components/module-grid";
import { moduleCards } from "../_lib/demo-data";
import { logout } from "../login/actions";

export default function MorePage() {
  return (
    <AppShell active="more">
      <PageHeader
        description="Další části osobního AI marketingového manažera podle schváleného MVP."
        eyebrow="Marketingový systém"
        title="Další moduly"
      />
      <ModuleGrid modules={moduleCards} />
      <section className="panel future-card">
        <div>
          <p className="eyebrow">Účet</p>
          <h2>Bezpečný přístup</h2>
          <p className="muted">Po práci se můžeš odhlásit z tohoto zařízení.</p>
        </div>
        <form action={logout}>
          <button className="secondary-button" type="submit">
            Odhlásit se
          </button>
        </form>
      </section>
      <section className="panel future-card">
        <div>
          <p className="eyebrow">Budoucí fáze</p>
          <h2>Insights, Meta publikování a Newsletter</h2>
          <p className="muted">
            Tyto integrace jsou připravené jako budoucí rozšíření, ale záměrně
            nejsou součástí MVP.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
