import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapa gastronómico | Come",
  description: "Encuentra restaurantes, taquerías y marisquerías cerca de ti en el mapa de Come.",
  alternates: { canonical: "/mapa" },
  openGraph: {
    title: "Mapa gastronómico | Come",
    description: "Encuentra restaurantes, taquerías y marisquerías cerca de ti en el mapa de Come.",
    url: "/mapa",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
