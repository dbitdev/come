import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guías gastronómicas | Come",
  description: "Rutas interactivas para comer mejor en México, seleccionadas por expertos.",
  alternates: { canonical: "/guias" },
  openGraph: {
    title: "Guías gastronómicas | Come",
    description: "Rutas interactivas para comer mejor en México, seleccionadas por expertos.",
    url: "/guias",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
