import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Controller | Financieel Dashboard",
  description: "Financiële managementtool gekoppeld aan Exact Online",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
