"use client";

import { useEffect, useState } from "react";

import {
  loadMarketingState,
  MARKETING_STATE_EVENT,
  saveMarketingState,
} from "../_lib/marketing-store";
import { defaultTasks } from "../_lib/demo-data";

type Task = {
  id: string;
  title: string;
  detail: string;
  priority: "Běžná" | "Vysoká";
  dueDate: string;
  recurrence: "Žádné" | "Denně" | "Týdně";
  completed: boolean;
};

const initialTasks: Task[] = defaultTasks;

export function TasksWorkspace() {
  const [tasks, setTasks] = useState(initialTasks);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("2026-08-14");
  const [priority, setPriority] = useState<Task["priority"]>("Běžná");
  const [recurrence, setRecurrence] = useState<Task["recurrence"]>("Žádné");

  useEffect(() => {
    function hydrate() {
      const marketingState = loadMarketingState();
      if (marketingState.tasks.length) {
        setTasks(marketingState.tasks);
      } else {
        saveMarketingState({ ...marketingState, tasks: initialTasks });
        setTasks(initialTasks);
      }
      window.localStorage.removeItem("myfit-tasks");
    }
    const frameId = window.requestAnimationFrame(hydrate);
    window.addEventListener(MARKETING_STATE_EVENT, hydrate);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener(MARKETING_STATE_EVENT, hydrate);
    };
  }, []);

  function persist(nextTasks: Task[]) {
    setTasks(nextTasks);
    const marketingState = loadMarketingState();
    saveMarketingState({ ...marketingState, tasks: nextTasks });
  }

  function addTask() {
    if (!title.trim()) return;
    persist([
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        detail: `${new Intl.DateTimeFormat("cs-CZ").format(new Date(`${dueDate}T12:00:00`))} · ${recurrence === "Žádné" ? "jednorázově" : recurrence}`,
        priority,
        dueDate,
        recurrence,
        completed: false,
      },
      ...tasks,
    ]);
    setTitle("");
    setFormOpen(false);
  }

  function toggleTask(id: string) {
    persist(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  const openTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  return (
    <>
      <div className="header-action-row">
        <button
          className="primary-button"
          onClick={() => setFormOpen((current) => !current)}
          type="button"
        >
          {formOpen ? "Zavřít" : "+ Nový úkol"}
        </button>
      </div>
      {formOpen ? (
        <section className="panel quick-task-form">
          <label>
            Co je potřeba udělat?
            <input
              autoFocus
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addTask();
              }}
              value={title}
            />
          </label>
          <label>
            Termín
            <input
              onChange={(event) => setDueDate(event.target.value)}
              type="date"
              value={dueDate}
            />
          </label>
          <label>
            Priorita
            <select
              onChange={(event) =>
                setPriority(event.target.value as Task["priority"])
              }
              value={priority}
            >
              <option>Běžná</option>
              <option>Vysoká</option>
            </select>
          </label>
          <label>
            Opakování
            <select
              onChange={(event) =>
                setRecurrence(event.target.value as Task["recurrence"])
              }
              value={recurrence}
            >
              <option>Žádné</option>
              <option>Denně</option>
              <option>Týdně</option>
            </select>
          </label>
          <button
            className="primary-button"
            disabled={!title.trim()}
            onClick={addTask}
            type="button"
          >
            Přidat úkol
          </button>
        </section>
      ) : null}
      <div className="task-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow accent">Tento týden</p>
              <h2>Marketingová realizace</h2>
            </div>
            <span className="type-badge">{openTasks.length}</span>
          </div>
          <ul className="task-list">
            {openTasks.map((task) => (
              <li key={task.id}>
                <button
                  aria-label={`Dokončit: ${task.title}`}
                  onClick={() => toggleTask(task.id)}
                  type="button"
                >
                  ○
                </button>
                <div>
                  <strong>{task.title}</strong>
                  <small>{task.detail}</small>
                </div>
                <span
                  className={`priority-tag ${task.priority === "Vysoká" ? "high" : ""}`}
                >
                  {task.priority}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Dokončeno</p>
              <h2>Poslední kontroly</h2>
            </div>
          </div>
          <ul className="task-list completed-list">
            {completedTasks.map((task) => (
              <li key={task.id}>
                <button
                  aria-label={`Vrátit mezi otevřené: ${task.title}`}
                  onClick={() => toggleTask(task.id)}
                  type="button"
                >
                  ✓
                </button>
                <div>
                  <strong>{task.title}</strong>
                  <small>{task.detail}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
