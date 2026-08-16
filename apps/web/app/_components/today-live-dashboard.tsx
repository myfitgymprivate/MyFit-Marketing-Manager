"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { calendarItems, defaultTasks } from "../_lib/demo-data";
import {
  loadMarketingState,
  MARKETING_STATE_EVENT,
  saveMarketingState,
  type MarketingState,
} from "../_lib/marketing-store";
import { nextMonth } from "../_lib/monthly-plan";
import { pragueDateKey } from "../_lib/task-schedule";
import { TaskCompleteButton } from "./task-complete-button";

const fallbackCalendar = calendarItems.map((item, index) => ({
  id: `august-${index + 1}`,
  date: `2026-08-${String(item.day).padStart(2, "0")}`,
  type: item.type,
  title: item.title,
  state: item.state,
}));

function contentHref(id: string) {
  if (id === "august-2") return "/content/story-soukromi";
  if (id === "august-3") return "/content/reel-partak";
  if (id === "august-5") return "/content/post-benefity";
  return "/calendar";
}

function weekBounds(today: string) {
  const date = new Date(`${today}T12:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - mondayOffset);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    from: monday.toISOString().slice(0, 10),
    to: sunday.toISOString().slice(0, 10),
  };
}

function formatMonth(month: string) {
  const [yearText = "2026", monthText = "01"] = month.split("-");
  return new Intl.DateTimeFormat("cs-CZ", {
    month: "long",
    year: "numeric",
  }).format(new Date(Number(yearText), Number(monthText) - 1, 1));
}

export function TodayLiveDashboard() {
  const [state, setState] = useState<MarketingState | null>(null);
  const today = pragueDateKey();

  useEffect(() => {
    function hydrate() {
      const current = loadMarketingState(fallbackCalendar);
      if (!current.tasks.length) {
        const initialized = { ...current, tasks: defaultTasks };
        setState(initialized);
        saveMarketingState(initialized);
        return;
      }
      setState(current);
    }
    const frameId = window.requestAnimationFrame(hydrate);
    window.addEventListener(MARKETING_STATE_EVENT, hydrate);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener(MARKETING_STATE_EVENT, hydrate);
    };
  }, []);

  const dashboard = useMemo(() => {
    if (!state)
      return {
        score: 0,
        openTasks: [],
        nextContent: undefined,
        weekItems: [],
        weekComplete: 0,
        activePlan: undefined,
        planMonth: nextMonth(today.slice(0, 7)),
      };
    const openTasks = state.tasks.filter((task) => !task.completed);
    const completedTasks = state.tasks.filter((task) => task.completed).length;
    const taskRatio = state.tasks.length
      ? completedTasks / state.tasks.length
      : 0;
    const activePlan = [...state.monthlyPlans]
      .filter(
        (plan) => plan.status !== "ARCHIVED" && plan.month >= today.slice(0, 7),
      )
      .sort((first, second) => first.month.localeCompare(second.month))[0];
    const score = Math.min(
      100,
      Math.round(
        55 +
          Math.min(state.published.length, 4) * 5 +
          taskRatio * 15 +
          (activePlan?.status === "APPROVED" ? 10 : 0),
      ),
    );
    const nextContent = [...state.calendarItems]
      .filter((item) => item.type !== "ÚKOL" && item.date >= today)
      .sort((first, second) => first.date.localeCompare(second.date))[0];
    const bounds = weekBounds(today);
    const weekItems = state.calendarItems
      .filter(
        (item) =>
          item.type !== "ÚKOL" &&
          item.date >= bounds.from &&
          item.date <= bounds.to,
      )
      .sort((first, second) => first.date.localeCompare(second.date));
    const weekComplete = weekItems.filter((item) =>
      ["published", "ready"].includes(item.state),
    ).length;
    return {
      score,
      openTasks,
      nextContent,
      weekItems,
      weekComplete,
      activePlan,
      planMonth: activePlan?.month ?? nextMonth(today.slice(0, 7)),
    };
  }, [state, today]);

  return (
    <>
      <div className="welcome-card">
        <div>
          <p className="eyebrow light">AI marketingový manažer</p>
          <h2>
            {dashboard.openTasks.length
              ? `Dnes hlídám ${dashboard.openTasks.length} otevřené úkoly.`
              : "Dnešní úkoly jsou hotové."}
          </h2>
          <p>Skóre se počítá z publikování, úkolů a schváleného plánu.</p>
        </div>
        <div
          aria-label={`Marketingové zdraví ${dashboard.score} procent`}
          className="health-score"
        >
          <strong>{dashboard.score}</strong>
          <span>Marketing Health</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel priority-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow danger">Denní priorita</p>
              <h2>Vstupy zdarma za úrovně</h2>
            </div>
            <span className="alert-badge">Denně</span>
          </div>
          <p className="muted">
            Jedna kumulovaná kontrola. Po dokončení se další termín nastaví na
            zítřek podle Europe/Prague.
          </p>
          <TaskCompleteButton />
        </section>

        <section className="panel content-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow accent">Nejbližší obsah</p>
              <h2>{dashboard.nextContent?.title ?? "Kalendář je volný"}</h2>
            </div>
            {dashboard.nextContent ? (
              <span className="type-badge">{dashboard.nextContent.type}</span>
            ) : null}
          </div>
          {dashboard.nextContent ? (
            <>
              <p className="muted">
                {new Intl.DateTimeFormat("cs-CZ", {
                  dateStyle: "long",
                }).format(
                  new Date(`${dashboard.nextContent.date}T12:00:00`),
                )}{" "}
                · stav {dashboard.nextContent.state}
              </p>
              <div className="button-row wrap-buttons">
                <Link
                  className="primary-button link-button"
                  href={contentHref(dashboard.nextContent.id)}
                >
                  Otevřít podklady
                </Link>
                <Link
                  className="secondary-button link-button"
                  href={`/ai?intent=change-content&title=${encodeURIComponent(dashboard.nextContent.title)}`}
                >
                  Upravit s AI
                </Link>
              </div>
            </>
          ) : (
            <Link className="primary-button link-button" href="/calendar">
              Přidat obsah
            </Link>
          )}
        </section>

        <section className="panel week-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Stav týdne</p>
              <h2>Obsah podle kalendáře</h2>
            </div>
            <span className="week-score">
              {dashboard.weekComplete} / {dashboard.weekItems.length}
            </span>
          </div>
          <div className="week-flow">
            {dashboard.weekItems.map((item) => (
              <div className={`week-item ${item.state}`} key={item.id}>
                <span>
                  {new Intl.DateTimeFormat("cs-CZ", {
                    weekday: "short",
                  }).format(new Date(`${item.date}T12:00:00`))}
                </span>
                <strong>{item.type}</strong>
              </div>
            ))}
          </div>
          <Link className="text-link" href="/calendar">
            Zobrazit celý plán →
          </Link>
        </section>

        <section className="panel compact-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Další úkoly</p>
              <h2>Co ještě hlídat</h2>
            </div>
            <span className="type-badge">
              {dashboard.openTasks.length} otevřené
            </span>
          </div>
          <ul className="clean-list">
            {dashboard.openTasks.slice(0, 2).map((task) => (
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

        <section className="panel notification-panel">
          <div className="notification-icon">
            {dashboard.activePlan?.status === "APPROVED" ? "✓" : "!"}
          </div>
          <div>
            <p className="eyebrow accent">Měsíční plán</p>
            <h2>
              {dashboard.activePlan?.status === "APPROVED"
                ? `Plán na ${formatMonth(dashboard.planMonth)} je schválený`
                : dashboard.activePlan
                  ? `Plán na ${formatMonth(dashboard.planMonth)} čeká na schválení`
                  : `Plán na ${formatMonth(dashboard.planMonth)} ještě není připravený`}
            </h2>
            <p className="muted">
              Stav se přebírá přímo ze společného kalendáře.
            </p>
          </div>
          <Link
            className="secondary-button link-button"
            href="/calendar#monthly-plan"
          >
            {dashboard.activePlan?.status === "APPROVED"
              ? "Zobrazit"
              : "Zkontrolovat"}
          </Link>
        </section>

        <section className="panel ai-panel">
          <div className="sparkle">✦</div>
          <div>
            <p className="eyebrow light">MyFit AI</p>
            <h2>Napiš mi, co se změnilo.</h2>
            <p>Uprav plán, zapiš publikovaný obsah nebo změň paměť tvorby.</p>
          </div>
          <Link className="ai-button link-button" href="/ai">
            Otevřít chat →
          </Link>
        </section>
      </div>
    </>
  );
}
