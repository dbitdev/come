import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isCanonicalPublicPlace, rutaLugar } from "@/lib/utils";
import { normalizarSeo, SEO_CIUDADES, SEO_COCINAS } from "@/lib/seoCatalog";
import styles from "./page.module.css";

type Lugar = { id: string; name: string; category: string; address: string; city: string; image: string; description: string };

function configuracion(tipo: string, slug: string) {
  if (tipo === "ciudad") return SEO_CIUDADES.find((item) => item.slug === slug);
  if (tipo === "cocina") return SEO_COCINAS.find((item) => item.slug === slug);
  return undefined;
}

async function lugares(tipo: string, slug: string): Promise<Lugar[]> {
  if (!db) return [];
  const config = configuracion(tipo, slug);
  if (!config) return [];
  const snapshot = await getDocs(collection(db, "come"));
  return snapshot.docs.filter((doc) => isCanonicalPublicPlace(doc.id, doc.data())).map((doc) => {
    const data = doc.data();
    return { id: doc.id, name: data.restaurantName || data.name || "Restaurante", category: data.category || "Cocina mexicana", address: data.address || "México", city: data.city || data.ciudad || data.estado || data.state || "", image: data.image || data.menu?.[0]?.image || "/og-come.jpg", description: data.description || "" };
  }).filter((lugar) => {
    const texto = normalizarSeo(`${lugar.name} ${lugar.category} ${lugar.description} ${lugar.address} ${lugar.city}`);
    if (tipo === "ciudad" && "filtro" in config) return texto.includes(normalizarSeo(config.filtro));
    return "terminos" in config && config.terminos.some((termino) => texto.includes(normalizarSeo(termino)));
  });
}

export async function generateStaticParams() {
  return [
    ...SEO_CIUDADES.map(({ slug }) => ({ tipo: "ciudad", slug })),
    ...SEO_COCINAS.map(({ slug }) => ({ tipo: "cocina", slug })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ tipo: string; slug: string }> }): Promise<Metadata> {
  const { tipo, slug } = await params;
  const config = configuracion(tipo, slug);
  if (!config) return { title: "Colección no encontrada | Come", robots: { index: false, follow: false } };
  const title = tipo === "ciudad" ? `Restaurantes en ${config.nombre} | Come` : `${config.nombre}: restaurantes en México | Come`;
  const description = `Descubre ${config.nombre.toLowerCase()}: restaurantes, direcciones, menús, chefs y recomendaciones seleccionadas por Come, la guía gastronómica de México.`;
  const canonical = `/restaurantes/${tipo}/${slug}`;
  return { title, description, alternates: { canonical }, keywords: [config.nombre, `restaurantes ${config.nombre}`, `comida ${config.nombre}`, "Come", "ComeApp", "guía gastronómica de México"], openGraph: { title, description, url: canonical, images: ["/og-come.jpg"] } };
}

export default async function ColeccionSeo({ params }: { params: Promise<{ tipo: string; slug: string }> }) {
  const { tipo, slug } = await params;
  const config = configuracion(tipo, slug);
  if (!config) notFound();
  const resultados = await lugares(tipo, slug);
  const canonical = `https://comeapp.com.mx/restaurantes/${tipo}/${slug}`;
  const jsonLd = [{ "@context": "https://schema.org", "@type": "CollectionPage", name: config.nombre, url: canonical, inLanguage: "es-MX" }, { "@context": "https://schema.org", "@type": "ItemList", itemListElement: resultados.map((lugar, index) => ({ "@type": "ListItem", position: index + 1, name: lugar.name, url: `https://comeapp.com.mx${rutaLugar(lugar.name, lugar.id)}` })) }];
  return <main className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <header className={styles.head}><small>Guía Come · México</small><h1>{config.nombre}</h1><p>{resultados.length} lugares seleccionados para descubrir restaurantes, menús y experiencias gastronómicas.</p></header>
    <section className={styles.grid}>{resultados.map((lugar) => <Link className={styles.card} href={rutaLugar(lugar.name, lugar.id)} key={lugar.id}><img className={styles.image} src={lugar.image} alt={`${lugar.name}, ${lugar.category}`} /><h2>{lugar.name}</h2><p>{lugar.category}</p><p>{lugar.address}</p></Link>)}</section>
    <Link className={styles.back} href="/restaurantes">Ver todos los restaurantes →</Link>
  </main>;
}
