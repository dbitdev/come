import type { Metadata } from "next";

// Página privada o de herramienta: no debe aparecer en buscadores.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
