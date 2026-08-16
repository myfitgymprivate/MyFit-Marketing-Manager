import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

import { ProfileButton } from "./profile-button";

const navigation = [
  { id: "today", href: "/today", icon: "⌂", label: "Dnes" },
  { id: "calendar", href: "/calendar", icon: "□", label: "Kalendář" },
  { id: "ai", href: "/ai", icon: "✦", label: "MyFit AI" },
  { id: "tasks", href: "/tasks", icon: "✓", label: "Úkoly" },
  { id: "more", href: "/more", icon: "•••", label: "Více" },
] as const;

type NavigationId = (typeof navigation)[number]["id"];

export function AppShell({
  active,
  children,
}: {
  active: NavigationId;
  children: ReactNode;
}) {
  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Hlavní navigace">
        <Link className="brand-mark" href="/today" aria-label="MyFit">
          <Image
            alt="MyFit Private Fitness"
            height={104}
            priority
            src="/myfit-logo.svg"
            width={200}
          />
        </Link>
        <nav>
          {navigation.map((item) => (
            <Link
              className={`nav-item ${active === item.id ? "active" : ""}`}
              href={item.href}
              key={item.id}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-status">
          <span className="status-dot" /> Marketing běží podle plánu
        </div>
      </aside>

      <section className="content-area">{children}</section>

      <nav className="mobile-nav" aria-label="Mobilní navigace">
        {navigation.map((item) => (
          <Link
            className={active === item.id ? "active" : ""}
            href={item.href}
            key={item.id}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="topbar page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ?? <ProfileButton />}
    </header>
  );
}
