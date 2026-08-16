"use client";

import { useEffect, useState } from "react";

import {
  createDailyCompletion,
  isDailyTaskCompleted,
  parseDailyCompletion,
} from "../_lib/task-schedule";

export function TaskCompleteButton({
  storageKey = "myfit-daily-task",
}: {
  storageKey?: string;
}) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const completion = parseDailyCompletion(
        window.localStorage.getItem(storageKey),
      );
      setCompleted(isDailyTaskCompleted(completion));
      if (!completion) window.localStorage.removeItem(storageKey);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [storageKey]);

  function toggleCompleted() {
    setCompleted((value) => {
      const nextValue = !value;
      if (nextValue) {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify(createDailyCompletion()),
        );
      } else {
        window.localStorage.removeItem(storageKey);
      }
      return nextValue;
    });
  }

  return (
    <button
      className={`primary-button ${completed ? "completed-button" : ""}`}
      onClick={toggleCompleted}
      type="button"
    >
      {completed ? "✓ Hotovo · další kontrola zítra" : "✓ Zkontrolováno"}
    </button>
  );
}
