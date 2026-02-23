import type { Metadata, Viewport } from "next";
import { Anton, Montserrat } from "next/font/google";

import "@/app/globals.css";

const headingFont = Anton({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400"]
});

const bodyFont = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "LOLA Client Hub",
  description: "CRM do zarządzania sprzedażą i obsługą wydarzeń premium."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${headingFont.variable} ${bodyFont.variable} bg-canvas font-[var(--font-body)] text-ink`}>
        {children}
      </body>
    </html>
  );
}
