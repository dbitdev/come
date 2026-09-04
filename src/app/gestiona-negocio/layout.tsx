import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestiona tu negocio | Come",
  description: "Administra la ficha, el menú y la información de tu restaurante en Come.",
  alternates: { canonical: "/gestiona-negocio" },
  openGraph: {
    title: "Gestiona tu negocio | Come",
    description: "Administra la ficha, el menú y la información de tu restaurante en Come.",
    url: "/gestiona-negocio",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
