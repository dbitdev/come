import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nomina un chef | Come",
  description: "Propón a un chef para el directorio de Come.",
  alternates: { canonical: "/nomina-chef" },
  openGraph: {
    title: "Nomina un chef | Come",
    description: "Propón a un chef para el directorio de Come.",
    url: "/nomina-chef",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
