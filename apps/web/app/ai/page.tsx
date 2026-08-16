import { AppShell, PageHeader } from "../_components/app-shell";
import { ChatComposer } from "../_components/chat-composer";

export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; title?: string }>;
}) {
  const { intent, title } = await searchParams;
  return (
    <AppShell active="ai">
      <PageHeader
        description="Chat čte kontext MyFit, připravuje obsah a mění data pouze přes řízené a dohledatelné akce."
        eyebrow="Hlavní pracovní rozhraní"
        title="MyFit AI"
      />

      <div className="ai-layout">
        <aside className="panel context-panel">
          <p className="eyebrow accent">Aktivní kontext</p>
          <h2>Co AI právě ví</h2>
          <ul className="context-list">
            <li>
              <span>✓</span> Brand pravidla MyFit
            </li>
            <li>
              <span>✓</span> Krémový, černý a zlatý vizuální systém
            </li>
            <li>
              <span>✓</span> Srpnový plán a dnešní Story
            </li>
            <li>
              <span>✓</span> Publikovaná historie
            </li>
            <li>
              <span>✓</span> Otevřené úkoly a kampaně
            </li>
          </ul>
          <div className="safety-note">
            <strong>Bezpečné akce</strong>
            <p>
              Komplexní nebo finanční změny se nejdřív zobrazí jako návrh k
              potvrzení.
            </p>
          </div>
        </aside>

        <div>
          <ChatComposer contentTitle={title} intent={intent} />
        </div>
      </div>
    </AppShell>
  );
}
