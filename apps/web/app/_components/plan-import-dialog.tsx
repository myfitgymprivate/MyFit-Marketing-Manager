"use client";

import { useState } from "react";

import {
  commitPlanImport,
  loadMarketingState,
  saveMarketingState,
  summarizePlanImport,
  type CalendarStoreItem,
  type ImportResolution,
  type MarketingState,
} from "../_lib/marketing-store";
import {
  PLAN_IMPORT_FIELDS,
  type PlanImportField,
  type PlanImportItem,
  type PlanImportMapping,
  type PlanImportPreview,
} from "../_lib/plan-import";

type ImportPayload = {
  fileName: string;
  fileHash: string;
  source: "XLSX_IMPORT" | "CSV_IMPORT";
  sheetName: string;
  headerRow: number;
  mapping: PlanImportMapping;
  items: PlanImportItem[];
};

type PreviewResponse = {
  data?: {
    sheets: string[];
    preview: PlanImportPreview;
    payload: ImportPayload;
    previewToken: string;
  };
  error?: { message: string };
};

const fieldLabels: Record<PlanImportField, string> = {
  date: "Datum *",
  type: "Formát *",
  title: "Název / téma *",
  platform: "Platforma",
  format_label: "Původní formát",
  external_id: "Externí ID",
  goal: "Cíl",
  campaign: "Kampaň",
  cta: "CTA",
  caption: "Caption",
  graphic_text: "Text do grafiky",
  hashtags: "Hashtagy",
  status: "Stav",
  notes: "Poznámka",
  story_slide_count: "Počet slidů Story",
  visual_direction: "Vizuální zadání",
  source_url: "Zdroj / odkaz",
};

export function PlanImportDialog({
  fallbackItems,
  onCommitted,
}: {
  fallbackItems: CalendarStoreItem[];
  onCommitted: (state: MarketingState, message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewResponse["data"]>();
  const [mapping, setMapping] = useState<PlanImportMapping>({});
  const [sheetName, setSheetName] = useState("");
  const [headerRow, setHeaderRow] = useState(1);
  const [mode, setMode] = useState<"merge" | "update" | "replace">("merge");
  const [resolutions, setResolutions] = useState<
    Record<number, ImportResolution>
  >({});
  const [replaceApproved, setReplaceApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    setError("");
  }

  async function preparePreview(useMapping = false) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const state = loadMarketingState(fallbackItems);
      const formData = new FormData();
      formData.set("file", file);
      formData.set("headerRow", String(headerRow));
      if (sheetName) formData.set("sheetName", sheetName);
      if (useMapping) formData.set("mapping", JSON.stringify(mapping));
      formData.set(
        "existingItems",
        JSON.stringify(
          state.calendarItems.map((item) => ({
            id: item.id,
            date: item.date,
            type: item.type,
            title: item.title,
            externalId: item.externalId,
          })),
        ),
      );
      const response = await fetch("/api/v1/plan-imports/preview", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as PreviewResponse;
      if (!response.ok || !result.data)
        throw new Error(
          result.error?.message ?? "Náhled se nepodařilo načíst.",
        );
      setPreviewData(result.data);
      setMapping(result.data.preview.mapping);
      setSheetName(result.data.payload.sheetName);
      setHeaderRow(result.data.payload.headerRow);
      setResolutions(
        Object.fromEntries(
          result.data.preview.items
            .filter((item) => item.duplicateOf)
            .map((item) => [item.rowNumber, "skip"]),
        ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Import se nepodařilo připravit.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function commitImport() {
    if (!previewData) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/plan-imports/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewToken: previewData.previewToken,
          payload: previewData.payload,
        }),
      });
      const result = (await response.json()) as {
        data?: { verified: boolean };
        error?: { message: string };
      };
      if (!response.ok || !result.data?.verified)
        throw new Error(result.error?.message ?? "Import nebyl potvrzen.");
      const current = loadMarketingState(fallbackItems);
      const importCommit = {
        fileName: previewData.payload.fileName,
        previewToken: previewData.previewToken,
        source: previewData.payload.source,
        mode,
        items: previewData.payload.items,
        resolutions,
        allowReplaceApproved: replaceApproved,
      };
      const changeSummary = summarizePlanImport(importCommit);
      const next = commitPlanImport(current, importCommit);
      if (changeSummary.changed > 0) saveMarketingState(next);
      onCommitted(
        next,
        `Import dokončen: ${changeSummary.changed} změn, ${changeSummary.skipped} přeskočeno.`,
      );
      close();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Import se nepodařilo dokončit.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="secondary-button"
        onClick={() => setOpen(true)}
        type="button"
      >
        Importovat plán
      </button>
      {open ? (
        <div className="dialog-backdrop" role="presentation">
          <section
            aria-labelledby="plan-import-title"
            aria-modal="true"
            className="panel calendar-dialog import-dialog"
            role="dialog"
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow accent">Excel / CSV</p>
                <h2 id="plan-import-title">Import marketingového plánu</h2>
                <p className="muted">
                  Nejdřív uvidíš náhled. Bez potvrzení se nic nezapíše.
                </p>
                <a
                  className="text-link"
                  download
                  href="/myfit-plan-import-template.csv"
                >
                  Stáhnout vzorovou tabulku →
                </a>
              </div>
              <button
                aria-label="Zavřít import"
                className="dialog-close"
                onClick={close}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="import-source-grid">
              <label>
                Soubor XLSX nebo CSV · max. 5 MB
                <input
                  accept=".xlsx,.csv"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setPreviewData(undefined);
                  }}
                  type="file"
                />
              </label>
              {previewData?.sheets.length ? (
                <label>
                  List
                  <select
                    onChange={(event) => setSheetName(event.target.value)}
                    value={sheetName}
                  >
                    {previewData.sheets.map((sheet) => (
                      <option key={sheet}>{sheet}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label>
                Řádek hlavičky
                <input
                  max={50}
                  min={1}
                  onChange={(event) => setHeaderRow(Number(event.target.value))}
                  type="number"
                  value={headerRow}
                />
              </label>
              <button
                className="primary-button"
                disabled={!file || busy}
                onClick={() => preparePreview(false)}
                type="button"
              >
                {busy ? "Načítám…" : "Připravit náhled"}
              </button>
            </div>

            {error ? (
              <div className="form-error" role="alert">
                {error}
              </div>
            ) : null}

            {previewData ? (
              <>
                <section className="import-section">
                  <div className="section-heading-compact">
                    <div>
                      <p className="eyebrow">Mapování sloupců</p>
                      <h3>Zkontroluj přiřazená pole</h3>
                    </div>
                    <button
                      className="secondary-button"
                      disabled={busy}
                      onClick={() => preparePreview(true)}
                      type="button"
                    >
                      Použít mapování
                    </button>
                  </div>
                  <div className="import-mapping-grid">
                    {PLAN_IMPORT_FIELDS.map((field) => (
                      <label key={field}>
                        {fieldLabels[field]}
                        <select
                          onChange={(event) =>
                            setMapping((current) => ({
                              ...current,
                              [field]: event.target.value || undefined,
                            }))
                          }
                          value={mapping[field] ?? ""}
                        >
                          <option value="">Nepoužít</option>
                          {previewData.preview.headers.map((header) => (
                            <option key={header}>{header}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </section>

                <div className="import-summary-grid">
                  <div>
                    <strong>{previewData.preview.items.length}</strong>
                    <span>Připravené</span>
                  </div>
                  <div>
                    <strong>{previewData.preview.errors.length}</strong>
                    <span>Chyby</span>
                  </div>
                  <div>
                    <strong>{previewData.preview.duplicateCount}</strong>
                    <span>Duplicity</span>
                  </div>
                </div>

                {previewData.preview.errors.length ? (
                  <section className="import-section">
                    <h3>Řádky, které se neimportují</h3>
                    <ul className="clean-list import-errors">
                      {previewData.preview.errors.slice(0, 10).map((item) => (
                        <li key={`${item.rowNumber}-${item.message}`}>
                          <strong>Řádek {item.rowNumber}</strong>
                          <span>{item.message}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section className="import-section">
                  <h3>Náhled platných položek</h3>
                  <div className="import-table-wrap">
                    <table className="import-table">
                      <thead>
                        <tr>
                          <th>Řádek</th>
                          <th>Datum</th>
                          <th>Formát</th>
                          <th>Platforma</th>
                          <th>Název</th>
                          <th>Konflikt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.preview.items.slice(0, 30).map((item) => (
                          <tr key={item.rowNumber}>
                            <td>{item.rowNumber}</td>
                            <td>{item.date}</td>
                            <td>{item.type}</td>
                            <td>{item.platform ?? "—"}</td>
                            <td>{item.title}</td>
                            <td>
                              {item.duplicateOf ? (
                                <select
                                  aria-label={`Řešení duplicity na řádku ${item.rowNumber}`}
                                  onChange={(event) =>
                                    setResolutions((current) => ({
                                      ...current,
                                      [item.rowNumber]: event.target
                                        .value as ImportResolution,
                                    }))
                                  }
                                  value={resolutions[item.rowNumber] ?? "skip"}
                                >
                                  <option value="skip">Přeskočit</option>
                                  <option value="update">Aktualizovat</option>
                                  <option value="add">Přidat jako nový</option>
                                </select>
                              ) : (
                                "Bez konfliktu"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="import-section import-commit-section">
                  <label>
                    Režim importu
                    <select
                      onChange={(event) => {
                        const nextMode = event.target.value as
                          "merge" | "update" | "replace";
                        setMode(nextMode);
                        if (nextMode !== "replace")
                          setResolutions(
                            Object.fromEntries(
                              previewData.preview.items
                                .filter((item) => item.duplicateOf)
                                .map((item) => [
                                  item.rowNumber,
                                  nextMode === "update" ? "update" : "skip",
                                ]),
                            ),
                          );
                      }}
                      value={mode}
                    >
                      <option value="merge">
                        Sloučit se stávajícím plánem
                      </option>
                      <option value="update">Aktualizovat podle ID</option>
                      <option value="replace">Nahradit dotčené měsíce</option>
                    </select>
                  </label>
                  {mode === "replace" ? (
                    <label className="checkbox-label">
                      <input
                        checked={replaceApproved}
                        onChange={(event) =>
                          setReplaceApproved(event.target.checked)
                        }
                        type="checkbox"
                      />
                      Rozumím, že nahrazení může vytvořit novou verzi již
                      schváleného plánu.
                    </label>
                  ) : null}
                  <button
                    className="primary-button"
                    disabled={
                      busy ||
                      !previewData.preview.items.length ||
                      (mode === "replace" && !replaceApproved)
                    }
                    onClick={commitImport}
                    type="button"
                  >
                    {busy ? "Zapisuji…" : "Potvrdit a importovat"}
                  </button>
                </section>
              </>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
