import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, MapPin, Users } from "lucide-react";
import { traerChefs } from "@/lib/chefs";
import RetratoChef from "@/components/RetratoChef";
import styles from "../cocina-tradicional/tradicional.module.css";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Cocineras tradicionales de México | Come",
  description: "Conoce a las cocineras tradicionales que conservan técnicas, ingredientes y memorias culinarias de México.",
  alternates: { canonical: "/cocineras-tradicionales" },
};

export default async function CocinerasTradicionalesPage() {
  const cocineras = (await traerChefs()).filter((chef) => chef.isTraditionalCook);
  return (
    <main className={styles.pagina}>
      <section className={styles.portada}>
        <div className={styles.portadaCopy}>
          <span><Users size={16} /> COCINERAS TRADICIONALES</span>
          <h1>Las manos que guardan la memoria.</h1>
          <p>Una sección dedicada a quienes preservan saberes comunitarios, temporadas, semillas y técnicas transmitidas entre generaciones.</p>
          <div className={styles.portadaAcciones}>
            <Link href="/cocina-tradicional">Explorar cocina tradicional</Link>
            <Link href="/nomina-chef" className={styles.secundario}>Nominar una cocinera</Link>
          </div>
        </div>
      </section>

      {cocineras.length ? (
        <section className={styles.bloqueChefs}>
          <div className={styles.encabezado}>
            <div><span>DIRECTORIO VIVO</span><h2>Cocineras documentadas</h2></div>
            <Link href="/chefs">Ver todo el directorio <ArrowRight size={18} /></Link>
          </div>
          <div className={styles.rejillaChefs}>
            {cocineras.map((chef) => (
              <Link href={`/chefs/${chef.slug}`} key={chef.id}>
                <div className={styles.retrato}><RetratoChef src={chef.image} nombre={chef.name} /></div>
                <span>{chef.role}</span><h3>{chef.name}</h3>
                {chef.ubicacion && <p><MapPin size={13} />{chef.ubicacion}</p>}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className={styles.vacio}>
          <Users size={32} /><h2>Estamos preparando el primer directorio verificado.</h2>
          <p>Las fichas aparecen aquí cuando la redacción las identifica explícitamente como cocineras tradicionales; no inferimos esa identidad por nombre o fotografía.</p>
          <Link href="/nomina-chef">Nominar una cocinera</Link>
        </section>
      )}
    </main>
  );
}
