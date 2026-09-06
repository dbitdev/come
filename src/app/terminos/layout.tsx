import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y condiciones | Come",
  description: "Términos de uso del sitio, la app y los servicios de Come.",
  alternates: { canonical: "/terminos" },
  openGraph: {
    title: "Términos y condiciones | Come",
    description: "Términos de uso del sitio, la app y los servicios de Come.",
    url: "/terminos",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
