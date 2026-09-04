import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registra tu negocio | Come",
  description: "Suma tu restaurante a Come y obtén tu menú digital gratis.",
  alternates: { canonical: "/registra-negocio" },
  openGraph: {
    title: "Registra tu negocio | Come",
    description: "Suma tu restaurante a Come y obtén tu menú digital gratis.",
    url: "/registra-negocio",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
