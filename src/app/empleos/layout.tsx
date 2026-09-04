import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Empleos en gastronomía | Come",
  description: "Vacantes en cocinas, salones y barras de restaurantes de México.",
  alternates: { canonical: "/empleos" },
  openGraph: {
    title: "Empleos en gastronomía | Come",
    description: "Vacantes en cocinas, salones y barras de restaurantes de México.",
    url: "/empleos",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
