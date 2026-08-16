"use client";

import { useEffect, useState } from "react";

import { calendarItems } from "../_lib/demo-data";
import {
  applyMarketingProposal,
  canUndoLastMarketingAction,
  loadMarketingState,
  MARKETING_STATE_EVENT,
  saveMarketingState,
  undoLastMarketingAction,
} from "../_lib/marketing-store";

type Proposal = {
  id: string;
  tool: "reschedule_content" | "record_published_content" | "create_idea";
  title: string;
  description: string;
  args: Record<string, string>;
  risk: "R1" | "R2";
};
type ChatEntry = {
  role: "user" | "assistant";
  text: string;
  proposals?: Proposal[];
};
type AgentResponse = {
  data?: { mode: "live" | "demo"; text: string; proposals: Proposal[] };
  error?: { message: string };
};

type QuickAction = { label: string; description: string; prompt: string };

const fallbackCalendar = calendarItems.map((item, index) => ({
  id: `august-${index + 1}`,
  date: `2026-08-${String(item.day).padStart(2, "0")}`,
  type: item.type,
  title: item.title,
  state: item.state,
}));

function quickActions(intent?: string, contentTitle?: string): QuickAction[] {
  if (intent === "change-content") {
    const title = contentTitle || "vybraný obsah";
    return [
      {
        label: "Změnit koncept",
        description: "Navrhne jiný způsob zpracování stejného cíle.",
        prompt: `Změň celý koncept obsahu „${title}“, ale zachovej jeho marketingový cíl.`,
      },
      {
        label: "Zjednodušit realizaci",
        description: "Připraví variantu s menší náročností.",
        prompt: `Zjednoduš realizaci obsahu „${title}“ tak, aby nevyžadoval náročné natáčení.`,
      },
      {
        label: "Změnit text nebo tón",
        description: "Upraví délku, tón, hook nebo CTA.",
        prompt: `Uprav text a tón obsahu „${title}“. Nejdřív mi ukaž varianty.`,
      },
      {
        label: "Přesunout termín",
        description: "Ukáže dopad změny před potvrzením.",
        prompt: `Navrhni nový termín pro obsah „${title}“ a ukaž dopad do kalendáře.`,
      },
    ];
  }

  return [
    {
      label: "Upravit dnešní plán",
      description: "Nahradit náročný obsah jednodušší variantou.",
      prompt: "Dnes nemám čas natáčet. Navrhni jednodušší obsah a ukaž změny.",
    },
    {
      label: "Zapsat publikovaný obsah",
      description: "Doplnit skutečně zveřejněný výstup do historie.",
      prompt: "Včera jsem zveřejnila Story. Pomoz mi ji zapsat do historie.",
    },
    {
      label: "Přesunout obsah",
      description: "Vybrat nový termín a zkontrolovat návaznosti.",
      prompt: "Potřebuji přesunout naplánovaný obsah. Nejdřív mi ukaž dopad.",
    },
    {
      label: "Uložit nápad",
      description: "Rychle uložit nápad do Idea Bank.",
      prompt: "Chci uložit nový nápad do Idea Bank: ",
    },
  ];
}

export function ChatComposer({
  intent,
  contentTitle,
}: {
  intent?: string;
  contentTitle?: string;
}) {
  const actions = quickActions(intent, contentTitle);
  const [entries, setEntries] = useState<ChatEntry[]>([
    {
      role: "assistant",
      text:
        intent === "change-content"
          ? `Pracuji s obsahem „${contentTitle || "vybraný obsah"}“. Můžeš změnit tón, délku, náročnost, termín nebo celý koncept. Nejdřív vždy ukážu návrh a dopad.`
          : "Co dnes potřebuješ vyřešit? Umím připravit obsah, upravit kalendář, zapsat publikovaný výstup nebo uložit nápad. Významné změny nejdřív ukážu k potvrzení.",
    },
  ]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [executed, setExecuted] = useState<string[]>([]);
  const [executionError, setExecutionError] = useState("");
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    fetch("/api/v1/ai/status")
      .then((response) => response.json())
      .then(
        (result: { data?: { mode: "live" | "demo" } }) =>
          result.data && setMode(result.data.mode),
      )
      .catch(() => setMode("demo"));

    function hydrateUndo() {
      setCanUndo(
        canUndoLastMarketingAction(loadMarketingState(fallbackCalendar)),
      );
    }
    hydrateUndo();
    window.addEventListener(MARKETING_STATE_EVENT, hydrateUndo);
    return () => window.removeEventListener(MARKETING_STATE_EVENT, hydrateUndo);
  }, []);

  async function submitMessage(nextMessage = message) {
    const trimmedMessage = nextMessage.trim();
    if (!trimmedMessage || busy) return;
    setMessage("");
    setEntries((current) => [
      ...current,
      { role: "user", text: trimmedMessage },
    ]);
    setBusy(true);
    try {
      const response = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedMessage,
          memory: loadMarketingState(fallbackCalendar).agentMemory,
        }),
      });
      const result = (await response.json()) as AgentResponse;
      if (!response.ok || !result.data)
        throw new Error(result.error?.message ?? "Agent neodpověděl.");
      setMode(result.data.mode);
      setEntries((current) => [
        ...current,
        {
          role: "assistant",
          text: result.data!.text,
          proposals: result.data!.proposals,
        },
      ]);
    } catch (error) {
      setEntries((current) => [
        ...current,
        {
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "Agent je dočasně nedostupný.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function confirmProposal(proposal: Proposal) {
    setExecutionError("");
    try {
      const current = loadMarketingState(fallbackCalendar);
      const next = applyMarketingProposal(current, proposal);
      saveMarketingState(next);
      setExecuted((executedIds) => [...executedIds, proposal.id]);
      setCanUndo(true);
    } catch (error) {
      setExecutionError(
        error instanceof Error
          ? error.message
          : "Změnu se nepodařilo bezpečně uložit.",
      );
    }
  }

  function undoLastAction() {
    setExecutionError("");
    try {
      const current = loadMarketingState(fallbackCalendar);
      const next = undoLastMarketingAction(current);
      saveMarketingState(next);
      setCanUndo(canUndoLastMarketingAction(next));
      setExecuted([]);
    } catch (error) {
      setExecutionError(
        error instanceof Error ? error.message : "Změnu nelze vrátit.",
      );
    }
  }

  return (
    <>
      <div className={`agent-mode-banner ${mode}`}>
        <span className="status-dot" />
        <strong>
          {mode === "live" ? "Živý MyFit Agent" : "MyFit Agent · demo režim"}
        </strong>
        <small>
          {mode === "live"
            ? "Napojeno na OpenAI"
            : "Funkční lokálně, bez placeného AI volání"}
        </small>
      </div>
      <section className="quick-actions" aria-labelledby="quick-actions-title">
        <div className="quick-actions-heading">
          <p className="eyebrow accent">Rychlé akce</p>
          <h2 id="quick-actions-title">
            {intent === "change-content"
              ? "Co chceš u obsahu změnit?"
              : "Co potřebuješ udělat?"}
          </h2>
        </div>
        <div className="quick-action-grid">
          {actions.map((action) => (
            <button
              className="quick-action-card"
              disabled={busy}
              key={action.label}
              onClick={() => setMessage(action.prompt)}
              type="button"
            >
              <strong>{action.label}</strong>
              <small>{action.description}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="chat-workspace">
        {executionError ? (
          <div className="notice-bar" role="alert">
            {executionError}
          </div>
        ) : null}
        {canUndo ? (
          <div className="chat-undo-bar">
            <span>Změna je uložená ve společné historii.</span>
            <button
              className="secondary-button"
              onClick={undoLastAction}
              type="button"
            >
              Vrátit poslední změnu
            </button>
          </div>
        ) : null}
        <div className="chat-thread" aria-live="polite">
          {entries.map((entry, index) => (
            <div
              className={`chat-entry ${entry.role}`}
              key={`${entry.role}-${index}`}
            >
              <div className={`chat-bubble ${entry.role}`}>{entry.text}</div>
              {entry.proposals?.map((proposal) => {
                const isExecuted = executed.includes(proposal.id);
                return (
                  <article className="agent-proposal" key={proposal.id}>
                    <div>
                      <span className="risk-chip">
                        {proposal.risk === "R2"
                          ? "Vyžaduje potvrzení"
                          : "Bezpečná akce"}
                      </span>
                      <strong>{proposal.title}</strong>
                      <p>{proposal.description}</p>
                    </div>
                    <button
                      className={`primary-button ${isExecuted ? "completed-button" : ""}`}
                      disabled={isExecuted}
                      onClick={() => confirmProposal(proposal)}
                      type="button"
                    >
                      {isExecuted ? "✓ Provedeno" : "Potvrdit změnu"}
                    </button>
                  </article>
                );
              })}
            </div>
          ))}
          {busy ? (
            <div className="chat-bubble assistant typing">Agent přemýšlí…</div>
          ) : null}
        </div>
        <div className="chat-input-row">
          <label className="sr-only" htmlFor="ai-message">
            Zpráva pro MyFit AI
          </label>
          <textarea
            id="ai-message"
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitMessage();
              }
            }}
            placeholder="Napiš přirozeně, co potřebuješ změnit…"
            rows={3}
            value={message}
          />
          <button
            className="primary-button"
            disabled={busy || !message.trim()}
            onClick={() => submitMessage()}
            type="button"
          >
            {busy ? "Pracuji…" : "Odeslat"}
          </button>
        </div>
      </section>
    </>
  );
}
