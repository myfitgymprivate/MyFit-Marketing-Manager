"use client";

import Link from "next/link";
import { useState } from "react";

import {
  contentPackageToText,
  type ContentPackage,
} from "../_lib/content-formats";

export function FormatContentDetail({ content }: { content: ContentPackage }) {
  const [notice, setNotice] = useState("");
  const exportText = contentPackageToText(content);
  const exportUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(exportText)}`;

  async function copyPackage() {
    try {
      await navigator.clipboard.writeText(exportText);
      setNotice("Celý publikační balíček je zkopírovaný.");
    } catch {
      setNotice("Kopírování prohlížeč nepovolil. Použij stažení TXT.");
    }
  }

  return (
    <div className="detail-layout">
      <section className="panel detail-main format-detail">
        <p className="eyebrow accent">
          {content.type} · připraveno k realizaci
        </p>
        <h2>{content.title}</h2>

        {content.type === "Reel" ? (
          <>
            <section className="content-package-section highlight-section">
              <p className="eyebrow">Hook</p>
              <h3>{content.hook}</h3>
              <small>Doporučená délka: {content.duration}</small>
            </section>
            <section className="content-package-section">
              <p className="eyebrow accent">Časovaný scénář</p>
              <div className="script-timeline">
                {content.script.map((step) => (
                  <article key={step.time}>
                    <strong>{step.time}</strong>
                    <p>{step.shot}</p>
                    <span>{step.text}</span>
                  </article>
                ))}
              </div>
            </section>
            <section className="content-package-grid">
              <div className="content-package-section">
                <p className="eyebrow accent">Shotlist</p>
                <ol>
                  {content.shotlist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
              <div className="content-package-section">
                <p className="eyebrow accent">Texty do videa</p>
                <ul>
                  {content.overlays.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="content-package-section highlight-section">
              <p className="eyebrow">Hlavní sdělení</p>
              <h3>{content.headline}</h3>
              <p>{content.message}</p>
            </section>
            <section className="content-package-section">
              <p className="eyebrow accent">Vizuální zadání</p>
              <ul>
                {content.visualBrief.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="alt-text-box">
                <strong>Alt text</strong>
                <p>{content.altText}</p>
              </div>
            </section>
          </>
        )}

        <section className="content-package-section caption-section">
          <p className="eyebrow accent">
            {content.type === "Post" ? "Finální caption" : "Caption"}
          </p>
          <p>{content.caption}</p>
          <strong>{content.cta}</strong>
        </section>

        {notice ? (
          <div className="notice-bar" role="status">
            {notice}
          </div>
        ) : null}
        <div className="button-row wrap-buttons">
          <button
            className="primary-button"
            onClick={copyPackage}
            type="button"
          >
            Kopírovat publikační balíček
          </button>
          <a
            className="secondary-button link-button"
            download={`myfit-${content.type.toLocaleLowerCase("cs-CZ")}-${content.title.toLocaleLowerCase("cs-CZ").replaceAll(" ", "-")}.txt`}
            href={exportUrl}
          >
            Stáhnout podklady TXT
          </a>
          <Link
            className="secondary-button link-button"
            href={`/ai?intent=change-content&title=${encodeURIComponent(content.title)}`}
          >
            Upravit s AI
          </Link>
        </div>
      </section>

      <aside className="panel detail-sidebar">
        <p className="eyebrow">Publikační metadata</p>
        <dl className="facts-list">
          <div>
            <dt>Datum</dt>
            <dd>{content.date}</dd>
          </div>
          <div>
            <dt>Formát</dt>
            <dd>{content.type}</dd>
          </div>
          <div>
            <dt>Cíl</dt>
            <dd>{content.goal}</dd>
          </div>
          <div>
            <dt>CTA</dt>
            <dd>{content.cta}</dd>
          </div>
          <div>
            <dt>Stav</dt>
            <dd>Připraveno</dd>
          </div>
        </dl>
        <Link className="secondary-button link-button" href="/calendar">
          Otevřít v kalendáři
        </Link>
      </aside>
    </div>
  );
}
