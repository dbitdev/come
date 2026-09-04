import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restaurantes en México | Come",
  description: "Explora restaurantes por cocina, chef, colonia y ocasión: de la fonda de barrio a la mesa de autor.",
  alternates: { canonical: "/restaurantes" },
  openGraph: {
    title: "Restaurantes en México | Come",
    description: "Explora restaurantes por cocina, chef, colonia y ocasión: de la fonda de barrio a la mesa de autor.",
    url: "/restaurantes",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
