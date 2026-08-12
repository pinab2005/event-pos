import type { Metadata } from "next";
import "./globals.css";
import Nav from "./nav";

export const metadata: Metadata = {
  title: "Event POS",
  description: "Point of sale",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col bg-zinc-50">
        <Nav />
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
