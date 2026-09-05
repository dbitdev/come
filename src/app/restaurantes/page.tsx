"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { MapPin, Search, Star } from "lucide-react";
import { db } from "@/lib/firebase";
import { isPublished, slugify } from "@/lib/utils";
import styles from "./restaurants.module.css";

type Lugar = {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  direccion: string;
  imagen: string;
  calificacion: number;
  esMichelin: boolean;
  tieneMenu: boolean;
};

const COCINAS: [string, string][] = [
  ["Tacos", "🌮"],
  ["Mariscos", "🦐"],
  ["Antojitos", "🫓"],
  ["Birria", "🍲"],
  ["Carne asada", "🥩"],
  ["Hamburguesas", "🍔"],
  ["Pizza", "🍕"],
  ["Sushi", "🍣"],
  ["Desayunos", "🍳"],
  ["Postres", "🍰"],
  ["Café", "☕️"],
];

const RESERVA = "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=900&q=85";

/** Rango de precio aproximado mientras no haya un campo propio. */
const rangoPrecio = (c: number) => (c >= 4.9 ? "$$$" : c >= 4.7 ? "$$" : "$");

/** Tiempo estimado estable por lugar, derivado del id. */
function tiempoEstimado(id: string) {
  let suma = 0;
  for (let i = 0; i < id.length; i += 1) suma += id.charCodeAt(i);
  const base = 20 + (suma % 25);
  return `${base}-${base + 10} min`;
}

export default function RestaurantesPage() {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [termino, setTermino] = useState("");
  const [cocina, setCocina] = useState<string | null>(null);
  const [modo, setModo] = useState<"entrega" | "recoger">("entrega");
  const [orden, setOrden] = useState<"recomendados" | "calificacion">("recomendados");
  const [soloMichelin, setSoloMichelin] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      if (!db) return setCargando(false);
      try {
        const snapshot = await getDocs(collection(db, "come"));
        setLugares(
          snapshot.docs
            .filter((doc) => isPublished(doc.data()))
            .map((doc) => {
              const d = doc.data();
              const menu = Array.isArray(d.menu) ? d.menu : [];
              return {
                id: doc.id,
                nombre: d.restaurantName || d.name || "Restaurante",
                categoria: d.category || "Cocina mexicana",
                descripcion: d.description || "Una propuesta que vale la pena descubrir.",
                direccion: d.address || "México",
                imagen: d.image || menu[0]?.image || RESERVA,
                calificacion: Number(d.rating) || 4.8,
                esMichelin: Boolean(d.isMichelin),
                tieneMenu: menu.length > 0,
              };
            })
        );
      } catch {
        setLugares([]);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const visibles = useMemo(() => {
    const aguja = (cocina ?? termino).trim().toLowerCase();
    const filtrados = lugares.filter((l) => {
      const porTexto = !aguja || `${l.nombre} ${l.categoria} ${l.direccion}`.toLowerCase().includes(aguja);
      const porMichelin = !soloMichelin || l.esMichelin;
      // "Recoger" no cambia el catálogo todavía; con menú digital es lo que hoy
      // se puede pedir, así que al menos filtra por eso en vez de mentir.
      const porModo = modo === "entrega" || l.tieneMenu;
      return porTexto && porMichelin && porModo;
    });
    return orden === "calificacion"
      ? [...filtrados].sort((a, b) => b.calificacion - a.calificacion)
      : filtrados;
  }, [lugares, termino, cocina, soloMichelin, modo, orden]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1>Nuestros restaurantes</h1>
        <p>
          Nos asociamos con restaurantes extraordinarios de todo México para acercarte una colección de
          sabores que vale la pena descubrir.
        </p>
      </section>

      <section className={styles.catalog}>
        <div className={styles.cuisines}>
          {COCINAS.map(([nombre, emoji]) => {
            const activa = cocina === nombre;
            return (
              <button
                key={nombre}
                type="button"
                className={activa ? styles.cuisineActive : styles.cuisine}
                onClick={() => {
                  setCocina(activa ? null : nombre);
                  setTermino("");
                }}
              >
                <span className={styles.cuisineIcon} aria-hidden="true">{emoji}</span>
                <span>{nombre}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.toolbar}>
          <div className={styles.modeSwitch} role="group" aria-label="Tipo de pedido">
            {(["entrega", "recoger"] as const).map((opcion) => (
              <button
                key={opcion}
                type="button"
                className={modo === opcion ? styles.modeActive : ""}
                aria-pressed={modo === opcion}
                onClick={() => setModo(opcion)}
              >
                {opcion === "entrega" ? "Entrega" : "Recoger"}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={soloMichelin ? styles.pillActive : styles.pill}
            aria-pressed={soloMichelin}
            onClick={() => setSoloMichelin((v) => !v)}
          >
            <Star size={14} /> Michelin
          </button>
          <button
            type="button"
            className={orden === "calificacion" ? styles.pillActive : styles.pill}
            aria-pressed={orden === "calificacion"}
            onClick={() => setOrden(orden === "calificacion" ? "recomendados" : "calificacion")}
          >
            Mejor calificados
          </button>

          <label className={styles.search}>
            <Search size={18} />
            <input
              value={termino}
              onChange={(e) => {
                setTermino(e.target.value);
                setCocina(null);
              }}
              placeholder="Buscar restaurante o colonia"
              aria-label="Buscar restaurante"
            />
          </label>
        </div>

        <div className={styles.seal}>
          <span className={styles.sealMark}>c</span>
          <p>
            {cocina
              ? `Lugares de ${cocina.toLowerCase()} elegidos por la redacción.`
              : "Lugares elegidos uno por uno por la redacción de Come."}
          </p>
        </div>

        {cargando ? (
          <div className={styles.empty}>Cargando restaurantes…</div>
        ) : (
          <div className={styles.grid}>
            {visibles.map((lugar) => (
              <article key={lugar.id}>
                <Link href={`/lugares/${slugify(lugar.nombre)}`} className={styles.photo}>
                  <img src={lugar.imagen} alt={lugar.nombre} />
                  {lugar.esMichelin && <span className={styles.badge}><Star size={11} /> MICHELIN</span>}
                </Link>
                <div className={styles.copy}>
                  <h2>
                    <Link href={`/lugares/${slugify(lugar.nombre)}`}>{lugar.nombre}</Link>
                  </h2>
                  <p className={styles.meta}>
                    <Star size={13} /> {lugar.calificacion.toFixed(1)} · {lugar.categoria} ·{" "}
                    {rangoPrecio(lugar.calificacion)} · {tiempoEstimado(lugar.id)}
                  </p>
                  <p className={styles.address}>
                    <MapPin size={13} /> {lugar.direccion}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        {!cargando && visibles.length === 0 && (
          <div className={styles.empty}>
            {modo === "recoger"
              ? "Todavía no hay lugares con menú disponible para recoger."
              : "No encontramos restaurantes con esos filtros."}
          </div>
        )}
      </section>
    </main>
  );
}
