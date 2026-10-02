import type { Metadata } from "next";

// La página es de cliente y no puede declarar metadata: sin esto heredaba el
// canonical de la sección y Google la trataba como duplicado.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { alternates: { canonical: `/lugares/menu/${encodeURIComponent(slug)}` } };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
