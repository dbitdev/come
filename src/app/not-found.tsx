import Link from "next/link";
import styles from "./status.module.css";

export const metadata = { title: "Página no encontrada | Come" };

export default function NotFound() {
  return (
    <main className={styles.wrap}>
      <span>ERROR 404</span>
      <h1>Aquí no hay nada que comer.</h1>
      <p>La página que buscas cambió de lugar o nunca existió. Empieza de nuevo desde el directorio.</p>
      <div className={styles.actions}>
        <Link href="/">Ir al inicio</Link>
        <Link href="/restaurantes" className={styles.secondary}>Ver restaurantes</Link>
      </div>
    </main>
  );
}
