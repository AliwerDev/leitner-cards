import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeScript } from "@/components/layout/theme-script";
import { uz } from "@/lib/i18n/uz";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: uz.app.name,
    template: `%s — ${uz.app.name}`,
  },
  description: uz.app.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
