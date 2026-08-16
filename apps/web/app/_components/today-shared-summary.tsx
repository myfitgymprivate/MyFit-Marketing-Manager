"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  loadMarketingState,
  MARKETING_STATE_EVENT,
  type MarketingState,
} from "../_lib/marketing-store";

export function TodaySharedSummary() {
  const [state, setState] = useState<MarketingState | null>(null);

  useEffect(() => {
    function hydrate() {
      setState(loadMarketingState());
    }
    const frameId = window.requestAnimationFrame(hydrate);
    window.addEventListener(MARKETING_STATE_EVENT, hydrate);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener(MARKETING_STATE_EVENT, hydrate);
    };
  }, []);

  const openTasks = state?.tasks.filter((task) => !task.completed) ?? [];

  return (
    <section className="panel compact-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Další úkoly</p>
          <h2>Co ještě hlídat</h2>
        </div>
        <span className="type-badge">{openTasks.length} otevřené</span>
      </div>
      <ul className="clean-list">
        {openTasks.slice(0, 2).map((task) => (
          <li key={task.id}>
            <span>○</span>
            <div>
              <strong>{task.title}</strong>
              <small>{task.detail}</small>
            </div>
          </li>
        ))}
      </ul>
      <Link className="text-link" href="/tasks">
        Všechny úkoly →
      </Link>
    </section>
  );
}
