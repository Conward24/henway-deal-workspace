import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Henway Deal Workspace",
  description: "Living, finance-aware deal workspace for search fund operators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased min-h-screen bg-surface text-zinc-100">
        {children}
      </body>
    </html>
  );
}
