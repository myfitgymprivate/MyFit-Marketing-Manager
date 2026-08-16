import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { PwaRegister } from "./_components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MyFit Marketing Manager",
    template: "%s · MyFit",
  },
  description: "Každodenní marketingový přehled a AI pomocník pro MyFit.",
  applicationName: "MyFit Marketing Manager",
};

export const viewport: Viewport = {
  themeColor: "#0a0b0e",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
