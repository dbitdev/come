import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Historias y noticias | Come",
  description: "Lo que pasa en la gastronomía mexicana: aperturas, chefs, premios y tendencias.",
  alternates: { canonical: "/noticias" },
  openGraph: {
    title: "Historias y noticias | Come",
    description: "Lo que pasa en la gastronomía mexicana: aperturas, chefs, premios y tendencias.",
    url: "/noticias",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
