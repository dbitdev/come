import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ordenar a domicilio | Come",
  description: "Pide de grandes restaurantes con entrega o para recoger, en una sola experiencia.",
  alternates: { canonical: "/ordenar" },
  openGraph: {
    title: "Ordenar a domicilio | Come",
    description: "Pide de grandes restaurantes con entrega o para recoger, en una sola experiencia.",
    url: "/ordenar",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
