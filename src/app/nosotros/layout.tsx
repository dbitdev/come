import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre Come | Come",
  description: "Qué es Come y por qué existe: la guía gastronómica de México.",
  alternates: { canonical: "/nosotros" },
  openGraph: {
    title: "Sobre Come | Come",
    description: "Qué es Come y por qué existe: la guía gastronómica de México.",
    url: "/nosotros",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
