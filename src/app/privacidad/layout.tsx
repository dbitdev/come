import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de privacidad | Come",
  description:
    "Qué datos personales recaba Come, para qué los usa, con quién los comparte y cómo ejercer tus derechos ARCO.",
  alternates: { canonical: "/privacidad" },
  openGraph: {
    title: "Aviso de privacidad | Come",
    description:
      "Qué datos personales recaba Come, para qué los usa, con quién los comparte y cómo ejercer tus derechos ARCO.",
    url: "/privacidad",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
