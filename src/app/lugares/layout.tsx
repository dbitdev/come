import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lugares para comer | Come",
  description: "Directorio de lugares para comer en México, con menús, fotos y ubicación.",
  alternates: { canonical: "/lugares" },
  openGraph: {
    title: "Lugares para comer | Come",
    description: "Directorio de lugares para comer en México, con menús, fotos y ubicación.",
    url: "/lugares",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
