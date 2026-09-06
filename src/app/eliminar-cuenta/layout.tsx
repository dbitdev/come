import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eliminar tu cuenta | Come",
  description:
    "Cómo solicitar la eliminación de tu cuenta de Come y de los datos personales asociados, qué se borra y qué se conserva.",
  alternates: { canonical: "/eliminar-cuenta" },
  openGraph: {
    title: "Eliminar tu cuenta | Come",
    description:
      "Cómo solicitar la eliminación de tu cuenta de Come y de los datos personales asociados.",
    url: "/eliminar-cuenta",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
