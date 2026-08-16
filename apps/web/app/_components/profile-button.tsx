"use client";

import { useState } from "react";

export function ProfileButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="profile-menu-wrap">
      <button
        aria-expanded={open}
        aria-label="Otevřít profil"
        className="avatar"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        MM
      </button>
      {open ? (
        <div className="profile-popover">
          <strong>Majitelka MyFit</strong>
          <span>Workspace: MyFit</span>
          <span>Časová zóna: Europe/Prague</span>
          <button onClick={() => setOpen(false)} type="button">
            Zavřít
          </button>
        </div>
      ) : null}
    </div>
  );
}
