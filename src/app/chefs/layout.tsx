import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chefs de México | Come",
  description: "Conoce a quienes están redefiniendo la cocina mexicana: trayectoria, restaurantes y reconocimientos.",
  alternates: { canonical: "/chefs" },
  openGraph: {
    title: "Chefs de México | Come",
    description: "Conoce a quienes están redefiniendo la cocina mexicana: trayectoria, restaurantes y reconocimientos.",
    url: "/chefs",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
