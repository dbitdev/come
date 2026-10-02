import type { Metadata } from "next";

// La página es de cliente y no puede declarar metadata: sin esto heredaba el
// canonical de la sección y Google la trataba como duplicado.
export const metadata: Metadata = { alternates: { canonical: "/lugares/con-estrellas" } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
