"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, Search, Star } from "lucide-react";
import { isPublished, slugify } from "@/lib/utils";
import type { CatalogResponse, CatalogRestaurant } from "@/types/catalog";
import { SEO_CIUDADES, SEO_COCINAS } from "@/lib/seoCatalog";
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
  ciudad: string;
  estado: string;
  contenido: string;
};

const POR_PAGINA = 9;
const normalizar = (valor: unknown) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const aliasUbicacion = (valor: string) => {
  const limpio = normalizar(valor);
  return limpio.replace(/\b(ciudad de mexico|mexico city)\b/g, "cdmx");
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

/**
 * La página se pinta dentro de un Suspense porque useSearchParams obliga a ello
 * cuando la ruta se prerenderiza.
 */
export default function RestaurantesPage() {
  return (
    <Suspense fallback={null}>
      <ListadoDesdeUrl />
    </Suspense>
  );
}

function ListadoDesdeUrl() {
  // Media docena de sitios enlazan aquí con ?search=: las cocinas de la
  // portada, las colecciones, el buscador de pantalla completa, el formulario
  // de la portada con sesión y la página de cocina tradicional. La página
  // ignoraba el parámetro, así que todos esos enlaces caían en el listado
  // completo, sin filtrar.
  const parametros = useSearchParams();
  const busquedaInicial = parametros.get("search") ?? parametros.get("q") ?? "";
  const ubicacionInicial = parametros.get("location") ?? parametros.get("city") ?? "";
  const cocinaInicial = parametros.get("cuisine") ?? "";
  const paginaInicial = Math.max(1, Number.parseInt(parametros.get("page") || "1", 10) || 1);
  return <Listado key={parametros.toString()} busquedaInicial={busquedaInicial} ubicacionInicial={ubicacionInicial} cocinaInicial={cocinaInicial} paginaInicial={paginaInicial} />;
}

function Listado({ busquedaInicial, ubicacionInicial, cocinaInicial, paginaInicial }: {
  busquedaInicial: string;
  ubicacionInicial: string;
  cocinaInicial: string;
  paginaInicial: number;
}) {

  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [termino, setTermino] = useState(busquedaInicial);
  const [cocina, setCocina] = useState<string | null>(cocinaInicial || null);
  const [pagina, setPagina] = useState(paginaInicial);
  const [modo, setModo] = useState<"entrega" | "recoger">("entrega");
  const [orden, setOrden] = useState<"recomendados" | "calificacion">("recomendados");
  const [soloMichelin, setSoloMichelin] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/restaurants");
        const payload = await response.json() as CatalogResponse;
        if (!response.ok) throw new Error(payload.error || "No se pudo cargar el catálogo.");
        setLugares(
          payload.restaurants
            .filter((d) => isPublished(d))
            .map((d: CatalogRestaurant) => {
              const menu = Array.isArray(d.menu) ? d.menu : [];
              return {
                id: d.id,
                nombre: d.restaurantName || d.name || "Restaurante",
                categoria: d.category || "Cocina mexicana",
                descripcion: d.description || "Una propuesta que vale la pena descubrir.",
                direccion: d.address || "México",
                imagen: d.image || menu[0]?.image || RESERVA,
                calificacion: Number(d.rating) || 4.8,
                esMichelin: Boolean(d.isMichelin),
                tieneMenu: menu.length > 0,
                ciudad: d.city || d.ciudad || "",
                estado: d.estado || d.state || "",
                contenido: [d.description, d.chef, ...(Array.isArray(d.tags) ? d.tags : []), ...menu.map((item: { name?: string; description?: string }) => `${item.name || ""} ${item.description || ""}`)].join(" "),
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
    const aguja = normalizar(termino);
    const agujaCocina = normalizar(cocina);
    const agujaUbicacion = aliasUbicacion(ubicacionInicial);
    const filtrados = lugares.filter((l) => {
      const indiceTexto = normalizar(`${l.nombre} ${l.categoria} ${l.direccion} ${l.ciudad} ${l.estado} ${l.contenido}`);
      const indiceUbicacion = aliasUbicacion(`${l.ciudad} ${l.estado} ${l.direccion}`);
      const porTexto = !aguja || indiceTexto.includes(aguja);
      const porCocina = !agujaCocina || normalizar(`${l.categoria} ${l.contenido}`).includes(agujaCocina);
      const porUbicacion = !agujaUbicacion || indiceUbicacion.includes(agujaUbicacion);
      const porMichelin = !soloMichelin || l.esMichelin;
      // "Recoger" no cambia el catálogo todavía; con menú digital es lo que hoy
      // se puede pedir, así que al menos filtra por eso en vez de mentir.
      const porModo = modo === "entrega" || l.tieneMenu;
      return porTexto && porCocina && porUbicacion && porMichelin && porModo;
    });
    return orden === "calificacion"
      ? [...filtrados].sort((a, b) => b.calificacion - a.calificacion)
      : filtrados;
  }, [lugares, termino, cocina, ubicacionInicial, soloMichelin, modo, orden]);

  const totalPaginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginados = visibles.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

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
        <nav className={styles.seoNav} aria-label="Explorar restaurantes por ciudad y cocina">
          {[...SEO_CIUDADES.map((item) => ({ href: `/restaurantes/ciudad/${item.slug}`, nombre: item.nombre })), ...SEO_COCINAS.map((item) => ({ href: `/restaurantes/cocina/${item.slug}`, nombre: item.nombre }))].map((item) => (
            <Link key={item.href} href={item.href}>{item.nombre}</Link>
          ))}
        </nav>
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
                  setPagina(1);
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
                onClick={() => { setModo(opcion); setPagina(1); }}
              >
                {opcion === "entrega" ? "Entrega" : "Recoger"}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={soloMichelin ? styles.pillActive : styles.pill}
            aria-pressed={soloMichelin}
            onClick={() => { setSoloMichelin((v) => !v); setPagina(1); }}
          >
            <Star size={14} /> Michelin
          </button>
          <button
            type="button"
            className={orden === "calificacion" ? styles.pillActive : styles.pill}
            aria-pressed={orden === "calificacion"}
            onClick={() => { setOrden(orden === "calificacion" ? "recomendados" : "calificacion"); setPagina(1); }}
          >
            Mejor calificados
          </button>

          <label className={styles.search}>
            <Search size={18} />
            <input
              value={termino}
              onChange={(e) => {
                setTermino(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar restaurante o colonia"
              aria-label="Buscar restaurante"
            />
          </label>
        </div>

        {cargando ? (
          <div className={styles.empty}>Cargando restaurantes…</div>
        ) : (
          <div className={styles.grid}>
            {paginados.map((lugar) => (
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

        {!cargando && visibles.length > 0 && totalPaginas > 1 && (
          <nav className={styles.pagination} aria-label="Páginas de restaurantes">
            <button type="button" disabled={paginaActual === 1} onClick={() => setPagina((valor) => Math.max(1, valor - 1))}>Anterior</button>
            {Array.from({ length: totalPaginas }, (_, indice) => indice + 1).map((numero) => (
              <button key={numero} type="button" className={numero === paginaActual ? styles.pageActive : ""} aria-current={numero === paginaActual ? "page" : undefined} onClick={() => setPagina(numero)}>{numero}</button>
            ))}
            <button type="button" disabled={paginaActual === totalPaginas} onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}>Siguiente</button>
          </nav>
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
