import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nomina un lugar | Come",
  description: "¿Conoces un lugar que merece estar en Come? Cuéntanos cuál.",
  alternates: { canonical: "/nomina-lugar" },
  openGraph: {
    title: "Nomina un lugar | Come",
    description: "¿Conoces un lugar que merece estar en Come? Cuéntanos cuál.",
    url: "/nomina-lugar",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
