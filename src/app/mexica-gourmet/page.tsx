import type { Metadata } from "next";
import Link from "next/link"; import styles from "../static-pages.module.css";
export const metadata: Metadata = {
  title: "Mexica Gourmet: series y documentales gastronómicos | Come",
  description: "Series, documentales y encuentros con las personas que están transformando la gastronomía mexicana.",
  alternates: { canonical: "/mexica-gourmet" },
};

export default function Gourmet(){return <main className={styles.page}><section className={`${styles.hero} ${styles.dark}`}><div><span className={styles.eyebrow}>COME PRESENTA</span><h1>Historias que abren el apetito.</h1><p>Series, documentales y encuentros con las personas que están transformando la gastronomía mexicana.</p><div className={styles.actions}><Link href="/noticias">Explorar historias</Link><Link href="/">Volver al inicio</Link></div></div></section></main>}
