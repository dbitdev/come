import Link from "next/link";
import type { Metadata } from "next";
import { collection, getDocs } from "firebase/firestore";
import { ArrowRight, MapPin, Soup, UtensilsCrossed } from "lucide-react";
import { db } from "@/lib/firebase";
import { isPublished, rutaLugar } from "@/lib/utils";
import { traerChefs } from "@/lib/chefs";
import RetratoChef from "@/components/RetratoChef";
import styles from "./tradicional.module.css";

export const revalidate = 3600;

const TITULO = "Cocina Tradicional Mexicana | Come";
const DESCRIPCION =
  "Fondas, mercados, cocineras y guisos de siempre. La cocina que se aprende en casa y se hereda, reunida en un solo lugar.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: "/cocina-tradicional" },
  openGraph: { title: TITULO, description: DESCRIPCION, url: "/cocina-tradicional" },
};

/**
 * "Tradicional" no vive en un solo campo: unos documentos lo traen en la
 * categoría ("Cocina Tradicional", "Oaxaqueña Tradicional") y otros sólo en la
 * descripción. Buscar la palabra cubre los dos casos sin obligar a reetiquetar
 * a mano todo el directorio.
 */
const esTradicional = (texto: string) => /tradicional|fonda|mercado|guiso|casera|de barrio/i.test(texto);

type Lugar = {
  id: string;
  nombre: string;
  categoria: string;
  direccion: string;
  imagen: string;
  estado?: string;
};

async function traerLugaresTradicionales(): Promise<Lugar[]> {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, "come"));
    return snapshot.docs
      .filter((doc) => isPublished(doc.data()))
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          nombre: d.restaurantName || d.name || "Restaurante",
          categoria: d.category || "Cocina local",
          direccion: d.address || "México",
          imagen: d.image || d.menu?.[0]?.image || "",
          estado: d.estado,
        };
      })
      .filter((lugar) => esTradicional(`${lugar.categoria} ${lugar.nombre}`));
  } catch {
    return [];
  }
}

export default async function CocinaTradicional() {
  const [lugares, todosLosChefs] = await Promise.all([traerLugaresTradicionales(), traerChefs()]);
  const chefs = todosLosChefs.filter((chef) => esTradicional(`${chef.role} ${chef.restaurant ?? ""}`));

  // Los estados que ya tienen algo publicado: es lo que hace navegable la página
  // cuando el directorio crezca.
  const porEstado: Record<string, number> = {};
  lugares.forEach((lugar) => {
    if (lugar.estado) porEstado[lugar.estado] = (porEstado[lugar.estado] || 0) + 1;
  });
  const estados = Object.entries(porEstado).sort((a, b) => b[1] - a[1]);

  return (
    <main className={styles.pagina}>
      <section className={styles.portada}>
        <div className={styles.portadaCopy}>
          <span>
            <Soup size={16} /> COCINA TRADICIONAL
          </span>
          <h1>
            La comida que se
            <br />
            aprende en casa.
          </h1>
          <p>
            Antes que el menú de degustación estuvo el comal. Fondas, mercados, cocineras que llevan
            décadas con la misma receta y guisos que sólo salen bien cuando alguien los enseñó. Esto
            es lo que sostiene todo lo demás.
          </p>
          <div className={styles.portadaAcciones}>
            <Link href="/restaurantes?search=Tradicional">Ver el directorio</Link>
            <Link href="/nomina-lugar" className={styles.secundario}>
              Nomina una fonda
            </Link>
          </div>
        </div>
      </section>

      {estados.length > 0 && (
        <section className={styles.estados}>
          <h2>Dónde la estamos documentando</h2>
          <div className={styles.chips}>
            {estados.map(([nombre, total]) => (
              <Link key={nombre} href={`/restaurantes?search=${encodeURIComponent(nombre)}`}>
                {nombre} <em>{total}</em>
              </Link>
            ))}
          </div>
        </section>
      )}

      {lugares.length > 0 ? (
        <section className={styles.bloque}>
          <div className={styles.encabezado}>
            <div>
              <span>DÓNDE COMERLA</span>
              <h2>Mesas de siempre</h2>
            </div>
            <Link href="/restaurantes">Ver todos <ArrowRight size={18} /></Link>
          </div>
          <div className={styles.rejilla}>
            {lugares.map((lugar) => (
              <Link href={rutaLugar(lugar.nombre, lugar.id)} key={lugar.id}>
                {lugar.imagen ? <img src={lugar.imagen} alt={lugar.nombre} /> : <div className={styles.sinFoto} />}
                <div>
                  <span>{lugar.categoria}</span>
                  <h3>{lugar.nombre}</h3>
                  <p>
                    <MapPin size={14} />
                    {lugar.direccion}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className={styles.vacio}>
          <UtensilsCrossed size={30} />
          <h2>Todavía no hay lugares publicados en esta categoría.</h2>
          <p>
            Si conoces una fonda, un puesto de mercado o una cocinera que merezca estar aquí,
            dínoslo y la revisamos.
          </p>
          <Link href="/nomina-lugar">Nominar un lugar</Link>
        </section>
      )}

      {chefs.length > 0 && (
        <section className={styles.bloqueChefs}>
          <div className={styles.encabezado}>
            <div>
              <span>QUIÉN LA COCINA</span>
              <h2>Las manos detrás del guiso</h2>
            </div>
            <Link href="/chefs">Ver chefs <ArrowRight size={18} /></Link>
          </div>
          <div className={styles.rejillaChefs}>
            {chefs.map((chef) => (
              <Link href={`/chefs/${chef.slug}`} key={chef.id}>
                <div className={styles.retrato}>
                  <RetratoChef src={chef.image} nombre={chef.name} />
                </div>
                <span>{chef.role}</span>
                <h3>{chef.name}</h3>
                {chef.ubicacion && (
                  <p>
                    <MapPin size={13} />
                    {chef.ubicacion}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={styles.cierre}>
        <span>PARTICIPA</span>
        <h2>Toda fonda buena tiene quien la defienda.</h2>
        <p>
          Esta sección crece con lo que la gente nomina. Si hay un lugar que llevas años visitando,
          mándanoslo: lo verificamos y lo publicamos.
        </p>
        <Link href="/nomina-lugar">Nomina un lugar</Link>
      </section>
    </main>
  );
}
