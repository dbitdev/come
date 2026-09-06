"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { ChefHat, MapPin, Search, Utensils, X } from "lucide-react";
import { db } from "@/lib/firebase";
import styles from "./SearchOverlay.module.css";
import { isPublished, rutaLugar } from "@/lib/utils";

const ANTOJOS = ["Tacos al pastor", "Birria", "Mariscos", "Pozole", "Mole", "Cochinita pibil", "Chilaquiles", "Café de olla"];
const COCINAS = ["Mexicana", "Antojitos", "Carne asada", "Hamburguesas", "Pizza", "Sushi", "Ramen", "Italiana", "Desayunos", "Postres"];

type Hit = { id: string; name: string; category: string; address: string };

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [places, setPlaces] = useState<Hit[]>([]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Se carga una sola vez y el filtrado vive en el cliente: resultados al instante.
  useEffect(() => {
    (async () => {
      if (!db) return;
      try {
        const snapshot = await getDocs(query(collection(db, "come"), limit(60)));
        setPlaces(snapshot.docs.filter((document) => isPublished(document.data())).map((document) => {
          const data = document.data();
          return {
            id: document.id,
            name: data.restaurantName || data.name || "Restaurante",
            category: data.category || "Cocina mexicana",
            address: data.address || "México",
          };
        }));
      } catch {
        /* sin conexión: el buscador sigue sirviendo para ir a /restaurantes */
      }
    })();
  }, []);

  const resultados = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (needle.length < 2) return { lugares: [] as Hit[], sugerencias: [] as string[] };
    const coincide = (text: string) => text.toLowerCase().includes(needle);
    return {
      lugares: places.filter((place) => coincide(place.name) || coincide(place.category) || coincide(place.address)).slice(0, 6),
      sugerencias: [...ANTOJOS, ...COCINAS].filter(coincide).slice(0, 6),
    };
  }, [term, places]);

  function ir(destino: string) {
    onClose();
    router.push(destino);
  }

  function enviar(event: React.FormEvent) {
    event.preventDefault();
    if (!term.trim()) return;
    ir(`/restaurantes?search=${encodeURIComponent(term.trim())}`);
  }

  const vacio = term.trim().length < 2;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Buscar en Come">
      <button className={styles.close} onClick={onClose} aria-label="Cerrar buscador"><X size={26} /></button>
      <div className={styles.shell}>
        <form onSubmit={enviar} className={styles.field}>
          <Search size={30} />
          <input
            autoFocus
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Busca tacos, un restaurante, un chef…"
            aria-label="Qué quieres comer"
          />
        </form>

        {vacio ? (
          <div className={styles.blocks}>
            <div>
              <h3>Se te antoja</h3>
              <div className={styles.chips}>{ANTOJOS.map((a) => <button key={a} type="button" onClick={() => ir(`/restaurantes?search=${encodeURIComponent(a)}`)}>{a}</button>)}</div>
            </div>
            <div>
              <h3>Por cocina</h3>
              <div className={styles.chips}>{COCINAS.map((c) => <button key={c} type="button" onClick={() => ir(`/restaurantes?search=${encodeURIComponent(c)}`)}>{c}</button>)}</div>
            </div>
            <div>
              <h3>Ir a</h3>
              <div className={styles.links}>
                <Link href="/restaurantes" onClick={onClose}><Utensils size={18} /> Restaurantes</Link>
                <Link href="/chefs" onClick={onClose}><ChefHat size={18} /> Chefs</Link>
                <Link href="/mapa" onClick={onClose}><MapPin size={18} /> Mapa</Link>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.results}>
            {resultados.sugerencias.length > 0 && (
              <>
                <h3>Sugerencias</h3>
                <div className={styles.chips}>{resultados.sugerencias.map((s) => <button key={s} type="button" onClick={() => ir(`/restaurantes?search=${encodeURIComponent(s)}`)}>{s}</button>)}</div>
              </>
            )}
            {resultados.lugares.length > 0 && (
              <>
                <h3>Lugares</h3>
                <ul>
                  {resultados.lugares.map((place) => (
                    <li key={place.id}>
                      <Link href={rutaLugar(place.name, place.id)} onClick={onClose}>
                        <b>{place.name}</b><small>{place.category} · {place.address}</small>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {resultados.lugares.length === 0 && resultados.sugerencias.length === 0 && (
              <p className={styles.hint}>Nada por aquí todavía. Pulsa Enter para buscarlo en todos los restaurantes.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
