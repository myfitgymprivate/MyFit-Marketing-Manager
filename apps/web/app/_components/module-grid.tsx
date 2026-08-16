"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  loadMarketingState,
  MARKETING_STATE_EVENT,
  type MarketingState,
  updateMarketingState,
} from "../_lib/marketing-store";
import { DEFAULT_AGENT_MEMORY } from "../_lib/agent-memory";
import {
  isValidTrendSource,
  trendFreshnessLabel,
} from "../_lib/trend-validation";

type Module = {
  title: string;
  description: string;
  icon: string;
  status: string;
};

export function ModuleGrid({ modules }: { modules: readonly Module[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [state, setState] = useState<MarketingState | null>(null);
  const [idea, setIdea] = useState("");
  const [trend, setTrend] = useState("");
  const [trendSource, setTrendSource] = useState("");
  const [trendError, setTrendError] = useState("");
  const [campaign, setCampaign] = useState("");
  const [offer, setOffer] = useState("");
  const [memoryFact, setMemoryFact] = useState("");
  const [textMemory, setTextMemory] = useState("");
  const [imageMemory, setImageMemory] = useState("");
  const [memoryNotice, setMemoryNotice] = useState("");

  useEffect(() => {
    function hydrate() {
      const nextState = loadMarketingState();
      setState(nextState);
      setTextMemory(nextState.agentMemory.textInstructions);
      setImageMemory(nextState.agentMemory.imageInstructions);
    }
    const frameId = window.requestAnimationFrame(hydrate);
    window.addEventListener(MARKETING_STATE_EVENT, hydrate);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener(MARKETING_STATE_EVENT, hydrate);
    };
  }, []);

  function changeState(updater: (current: MarketingState) => MarketingState) {
    const next = updateMarketingState(updater);
    setState(next);
  }

  function addIdea() {
    if (!idea.trim()) return;
    const createdAt = new Date().toISOString();
    changeState((current) => ({
      ...current,
      ideas: [
        {
          id: crypto.randomUUID(),
          text: idea.trim(),
          createdAt,
          status: "idea",
        },
        ...current.ideas,
      ],
    }));
    setIdea("");
  }

  function addTrend() {
    if (!trend.trim()) {
      setTrendError("Doplň název trendu.");
      return;
    }
    if (!isValidTrendSource(trendSource.trim())) {
      setTrendError(
        "Doplň platný odkaz na zdroj začínající http:// nebo https://.",
      );
      return;
    }
    setTrendError("");
    changeState((current) => ({
      ...current,
      trends: [
        {
          id: crypto.randomUUID(),
          title: trend.trim(),
          sourceUrl: trendSource.trim(),
          recommendation:
            "Posoudit podle soukromí, klidu a přínosu pro boutique MyFit.",
          capturedAt: new Date().toISOString(),
        },
        ...current.trends,
      ],
    }));
    setTrend("");
    setTrendSource("");
  }

  function addCampaign() {
    if (!campaign.trim() || !offer.trim()) return;
    changeState((current) => ({
      ...current,
      campaigns: [
        {
          id: crypto.randomUUID(),
          title: campaign.trim(),
          offer: offer.trim(),
          status: "draft",
          createdAt: new Date().toISOString(),
        },
        ...current.campaigns,
      ],
    }));
    setCampaign("");
    setOffer("");
  }

  function approveCampaign(id: string) {
    changeState((current) => {
      const selected = current.campaigns.find((item) => item.id === id);
      if (!selected) return current;
      return {
        ...current,
        campaigns: current.campaigns.map((item) =>
          item.id === id ? { ...item, status: "approved" } : item,
        ),
        audit: [
          {
            id: crypto.randomUUID(),
            action: "approve_campaign",
            summary: `Schválena kampaň „${selected.title}“ včetně nabídky „${selected.offer}“.`,
            createdAt: new Date().toISOString(),
            reversible: false,
          },
          ...current.audit,
        ],
      };
    });
  }

  function addMemoryFact() {
    if (!memoryFact.trim()) return;
    changeState((current) => ({
      ...current,
      memoryFacts: [
        {
          id: crypto.randomUUID(),
          text: memoryFact.trim(),
          createdAt: new Date().toISOString(),
        },
        ...current.memoryFacts,
      ],
    }));
    setMemoryFact("");
  }

  function saveAgentMemory() {
    changeState((current) => ({
      ...current,
      agentMemory: {
        textInstructions: textMemory.trim(),
        imageInstructions: imageMemory.trim(),
      },
    }));
    setMemoryNotice("Paměť je uložená a použije se při dalším AI zadání.");
  }

  function resetAgentMemory() {
    setTextMemory(DEFAULT_AGENT_MEMORY.textInstructions);
    setImageMemory(DEFAULT_AGENT_MEMORY.imageInstructions);
    changeState((current) => ({
      ...current,
      agentMemory: { ...DEFAULT_AGENT_MEMORY },
    }));
    setMemoryNotice("Obnoveno výchozí nastavení MY FIT.");
  }

  function renderModule(title: string) {
    if (!state) return <p className="muted">Načítám data…</p>;

    if (title === "Idea Bank")
      return (
        <div className="module-workspace">
          <div className="module-inline-form">
            <input
              aria-label="Nový nápad"
              onChange={(event) => setIdea(event.target.value)}
              placeholder="Např. ranní Story se sluncem"
              value={idea}
            />
            <button className="primary-button" onClick={addIdea} type="button">
              Uložit nápad
            </button>
          </div>
          <ul className="module-record-list">
            {state.ideas.map((item) => (
              <li key={item.id}>
                <strong>{item.text}</strong>
                <small>
                  {item.status === "planned" ? "V plánu" : "Bez termínu"}
                </small>
              </li>
            ))}
          </ul>
        </div>
      );

    if (title === "Trend Radar")
      return (
        <div className="module-workspace">
          <div className="module-inline-form">
            <input
              aria-label="Název trendu"
              onChange={(event) => setTrend(event.target.value)}
              placeholder="Trend nebo inspirace"
              value={trend}
            />
            <input
              aria-label="Zdroj trendu"
              onChange={(event) => setTrendSource(event.target.value)}
              placeholder="Odkaz na zdroj"
              type="url"
              value={trendSource}
            />
            {trendError ? (
              <p className="field-error" role="alert">
                {trendError}
              </p>
            ) : null}
            <button className="primary-button" onClick={addTrend} type="button">
              Přidat trend
            </button>
          </div>
          <ul className="module-record-list">
            {state.trends.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <small>{item.recommendation}</small>
                <small>
                  {isValidTrendSource(item.sourceUrl)
                    ? trendFreshnessLabel(item.capturedAt)
                    : "Zdroj chybí · nepoužívat"}{" "}
                  · uloženo{" "}
                  {new Intl.DateTimeFormat("cs-CZ", {
                    dateStyle: "medium",
                  }).format(new Date(item.capturedAt))}
                </small>
                {item.sourceUrl ? (
                  <a href={item.sourceUrl} rel="noreferrer" target="_blank">
                    Otevřít zdroj
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      );

    if (title === "Kampaně")
      return (
        <div className="module-workspace">
          <div className="module-inline-form">
            <input
              aria-label="Název kampaně"
              onChange={(event) => setCampaign(event.target.value)}
              placeholder="Název kampaně"
              value={campaign}
            />
            <input
              aria-label="Finanční nabídka"
              onChange={(event) => setOffer(event.target.value)}
              placeholder="Nabídka ke schválení"
              value={offer}
            />
            <button
              className="primary-button"
              onClick={addCampaign}
              type="button"
            >
              Připravit návrh
            </button>
          </div>
          <ul className="module-record-list">
            {state.campaigns.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <small>{item.offer}</small>
                <button
                  className={`secondary-button ${item.status === "approved" ? "completed-button" : ""}`}
                  disabled={item.status === "approved"}
                  onClick={() => approveCampaign(item.id)}
                  type="button"
                >
                  {item.status === "approved"
                    ? "✓ Schváleno"
                    : "Schválit nabídku"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      );

    if (title === "Marketing Brain")
      return (
        <div className="module-workspace">
          <div className="agent-memory-editor">
            <div>
              <p className="eyebrow accent">Paměť pro AI texty</p>
              <p className="muted">
                Napiš, jak má agent tvořit hooky, captiony, CTA a tón textů.
              </p>
            </div>
            <label>
              Pokyny pro tvorbu textů
              <textarea
                aria-label="Pokyny pro tvorbu textů"
                onChange={(event) => setTextMemory(event.target.value)}
                rows={6}
                value={textMemory}
              />
            </label>
            <div>
              <p className="eyebrow accent">Paměť pro AI obrázky</p>
              <p className="muted">
                Napiš preferované světlo, kompozici, prostředí a prvky, kterým
                se má agent vyhnout.
              </p>
            </div>
            <label>
              Pokyny pro tvorbu obrázků
              <textarea
                aria-label="Pokyny pro tvorbu obrázků"
                onChange={(event) => setImageMemory(event.target.value)}
                rows={6}
                value={imageMemory}
              />
            </label>
            <div className="button-row wrap-buttons">
              <button
                className="primary-button"
                onClick={saveAgentMemory}
                type="button"
              >
                Uložit AI paměť
              </button>
              <button
                className="secondary-button"
                onClick={resetAgentMemory}
                type="button"
              >
                Obnovit výchozí pravidla
              </button>
            </div>
            {memoryNotice ? (
              <p className="notice-bar" role="status">
                {memoryNotice}
              </p>
            ) : null}
          </div>
          <div className="module-divider" />
          <h3>Ověřená fakta o MY FIT</h3>
          <div className="module-inline-form">
            <input
              aria-label="Ověřený fakt"
              onChange={(event) => setMemoryFact(event.target.value)}
              placeholder="Ověřený fakt nebo preference značky"
              value={memoryFact}
            />
            <button
              className="primary-button"
              onClick={addMemoryFact}
              type="button"
            >
              Uložit fakt
            </button>
          </div>
          <ul className="module-record-list">
            {state.memoryFacts.map((item) => (
              <li key={item.id}>
                <strong>{item.text}</strong>
                <small>Potvrzeno uživatelkou</small>
              </li>
            ))}
          </ul>
        </div>
      );

    if (title === "Marketing Memory")
      return (
        <div className="module-workspace">
          <h3>Publikovaná historie</h3>
          <ul className="module-record-list">
            {state.published.map((item) => (
              <li key={item.id}>
                <strong>{item.topic}</strong>
                <small>
                  {item.date} · {item.type}
                </small>
              </li>
            ))}
          </ul>
          <h3>Audit změn</h3>
          <ul className="module-record-list">
            {state.audit.slice(0, 8).map((item) => (
              <li key={item.id}>
                <strong>{item.summary}</strong>
                <small>
                  {new Intl.DateTimeFormat("cs-CZ", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.createdAt))}
                </small>
              </li>
            ))}
          </ul>
        </div>
      );

    return (
      <div className="module-workspace">
        <p>Grafiky vytvoříš u konkrétní události nebo Story série.</p>
        <Link className="primary-button link-button" href="/calendar">
          Otevřít kalendář
        </Link>
      </div>
    );
  }

  return (
    <div className="module-grid">
      {modules.map((module) => (
        <article className="panel module-card" key={module.title}>
          <div className="module-icon">{module.icon}</div>
          <div>
            <p className="eyebrow accent">{module.status}</p>
            <h2>{module.title}</h2>
            <p className="muted">{module.description}</p>
            {open === module.title ? renderModule(module.title) : null}
          </div>
          <button
            className="secondary-button"
            onClick={() =>
              setOpen((current) =>
                current === module.title ? null : module.title,
              )
            }
            type="button"
          >
            {open === module.title ? "Zavřít" : "Otevřít modul"}
          </button>
        </article>
      ))}
    </div>
  );
}
