"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  CONFIG_BASE, DIAS, ESTADOS, TRANSICIONES_GESTION, fechaLegible, hoyEn, sumarDias,
  type ConfigReservas, type EstadoReserva, type Reserva, type Turno,
} from "@/lib/reservas";
import styles from "./reservas.module.css";

interface LugarGestionado { id: string; nombre: string; activo: boolean }

const ACCION: Partial<Record<EstadoReserva, string>> = {
  confirmada: "Confirmar",
  rechazada: "Rechazar",
  completada: "Llegó",
  no_show: "No llegó",
  cancelada: "Cancelar",
};

/** Llama a la API de reservas con el token de quien está en sesión. */
function useApi() {
  const { user } = useAuth();
  return useCallback(async (ruta: string, init?: RequestInit) => {
    if (!user) throw new Error("Inicia sesión.");
    const r = await fetch(ruta, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}`, ...(init?.headers || {}) },
      cache: "no-store",
    });
    const datos = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(datos.error || "Algo salió mal.");
    return datos;
  }, [user]);
}

/**
 * Panel de reservaciones: agenda y configuración. Lo usan el admin (todos los
 * restaurantes) y el dueño de un perfil (sólo los suyos); la API decide qué ve
 * cada quien, este componente sólo pinta.
 */
export default function PanelReservas({ lugarInicial }: { lugarInicial?: string }) {
  const api = useApi();
  const [lugares, setLugares] = useState<LugarGestionado[]>([]);
  const [esAdmin, setEsAdmin] = useState(false);
  const [lugarId, setLugarId] = useState(lugarInicial || "");
  const [pestana, setPestana] = useState<"agenda" | "config">("agenda");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api("/api/reservas/config")
      .then((d: { admin: boolean; lugares: LugarGestionado[] }) => {
        setLugares(d.lugares);
        setEsAdmin(d.admin);
        setLugarId((actual) => actual || (d.admin ? "" : d.lugares[0]?.id || ""));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [api]);

  if (cargando) return <div className={styles.vacio}>Cargando reservaciones…</div>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!esAdmin && lugares.length === 0) {
    return <div className={styles.vacio}>No administras ningún restaurante todavía. Reclama tu perfil para gestionar sus reservaciones.</div>;
  }

  const lugarActual = lugares.find((l) => l.id === lugarId);

  return (
    <div>
      <div className={styles.panelTop}>
        <label className={styles.campo}>Restaurante
          <select value={lugarId} onChange={(e) => setLugarId(e.target.value)}>
            {esAdmin && <option value="">Todos los restaurantes</option>}
            {lugares.map((l) => (
              <option key={l.id} value={l.id}>{l.nombre}{l.activo ? " · reservas activas" : ""}</option>
            ))}
          </select>
        </label>
        <div className={styles.pestanas} role="tablist">
          <button type="button" role="tab" className={pestana === "agenda" ? styles.pestanaActiva : styles.pestana} onClick={() => setPestana("agenda")}>Agenda</button>
          <button type="button" role="tab" className={pestana === "config" ? styles.pestanaActiva : styles.pestana} onClick={() => setPestana("config")}>Configuración</button>
        </div>
      </div>

      {pestana === "agenda" ? (
        <Agenda lugarId={lugarId} mostrarLugar={!lugarId} />
      ) : lugarId && lugarActual ? (
        <Configuracion
          key={lugarId}
          lugarId={lugarId}
          nombre={lugarActual.nombre}
          onGuardado={(activo) => setLugares((ls) => ls.map((l) => (l.id === lugarId ? { ...l, activo } : l)))}
        />
      ) : (
        <div className={styles.vacio}>Elige un restaurante para configurar sus reservaciones.</div>
      )}
    </div>
  );
}

// ── Agenda ─────────────────────────────────────────────────────────────────

function Agenda({ lugarId, mostrarLugar }: { lugarId: string; mostrarLugar: boolean }) {
  const api = useApi();
  const hoy = hoyEn(CONFIG_BASE.zonaHoraria);
  const [fecha, setFecha] = useState(hoy);
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [trabajando, setTrabajando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError("");
    const params = new URLSearchParams();
    if (lugarId) params.set("lugar", lugarId);
    if (soloPendientes) params.set("estado", "pendiente");
    else params.set("fecha", fecha);
    try {
      const d = await api(`/api/reservas?${params}`);
      setReservas(d.reservas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la agenda.");
    } finally {
      setCargando(false);
    }
  }, [api, lugarId, fecha, soloPendientes]);

  useEffect(() => {
    setCargando(true);
    cargar();
    // Las reservas llegan solas: se refresca cada minuto mientras está abierta.
    const t = setInterval(cargar, 60_000);
    return () => clearInterval(t);
  }, [cargar]);

  const cambiar = async (r: Reserva, estado: EstadoReserva) => {
    if (["rechazada", "cancelada"].includes(estado) && !window.confirm(`¿${ACCION[estado]} la reservación de ${r.nombre}? Se le avisará por correo.`)) return;
    setTrabajando(r.id);
    setError("");
    try {
      const d = await api(`/api/reservas/${r.id}`, { method: "PATCH", body: JSON.stringify({ estado }) });
      setReservas((lista) => (soloPendientes && estado !== "pendiente" ? lista.filter((x) => x.id !== r.id) : lista.map((x) => (x.id === r.id ? d.reserva : x))));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar.");
    } finally {
      setTrabajando(null);
    }
  };

  const resumen = useMemo(() => {
    const activas = reservas.filter((r) => r.estado === "confirmada" || r.estado === "pendiente");
    return {
      total: activas.length,
      personas: activas.reduce((s, r) => s + r.personas, 0),
      pendientes: reservas.filter((r) => r.estado === "pendiente").length,
    };
  }, [reservas]);

  return (
    <div>
      <div className={styles.navDia}>
        <button type="button" className={!soloPendientes && fecha === hoy ? styles.activo : ""} onClick={() => { setSoloPendientes(false); setFecha(hoy); }}>Hoy</button>
        <button type="button" onClick={() => { setSoloPendientes(false); setFecha((f) => sumarDias(f, -1)); }} aria-label="Día anterior">‹</button>
        <input type="date" value={fecha} onChange={(e) => { setSoloPendientes(false); if (e.target.value) setFecha(e.target.value); }} />
        <button type="button" onClick={() => { setSoloPendientes(false); setFecha((f) => sumarDias(f, 1)); }} aria-label="Día siguiente">›</button>
        <button type="button" className={soloPendientes ? styles.activo : ""} onClick={() => setSoloPendientes((v) => !v)}>Pendientes</button>
        <button type="button" onClick={() => { setCargando(true); cargar(); }}>Actualizar</button>
      </div>

      <div className={styles.resumenDia}>
        <span>{soloPendientes ? "Todas las pendientes" : fechaLegible(fecha)}</span>
        <span>{resumen.total} reservaciones</span>
        <span>{resumen.personas} personas</span>
        {resumen.pendientes > 0 && <span>{resumen.pendientes} por confirmar</span>}
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {cargando ? (
        <div className={styles.vacio}>Cargando…</div>
      ) : reservas.length === 0 ? (
        <div className={styles.vacio}>{soloPendientes ? "No hay solicitudes por confirmar." : "No hay reservaciones este día."}</div>
      ) : (
        <div className={styles.agenda}>
          {reservas.map((r) => (
            <div key={r.id} className={styles.agendaFila}>
              <div className={styles.agendaHora}>{r.hora}</div>
              <div className={styles.agendaQuien}>
                <b>{r.nombre} · {r.personas} {r.personas === 1 ? "persona" : "personas"}</b>
                <small>
                  {soloPendientes ? `${fechaLegible(r.fecha)} · ` : ""}
                  {mostrarLugar ? `${r.lugarNombre} · ` : ""}
                  <a href={`tel:${r.telefono}`}>{r.telefono}</a> · {r.correo} · {r.codigo} · {r.origen === "app" ? "App" : "Web"}
                </small>
                {r.notas && <span className={styles.agendaNotas}>{r.notas}</span>}
              </div>
              <div className={styles.agendaAcciones}>
                <span className={`${styles.estado} ${styles[`estado_${r.estado}`]}`}>{ESTADOS[r.estado]}</span>
                {TRANSICIONES_GESTION[r.estado].map((destino) => (
                  <button
                    key={destino}
                    type="button"
                    disabled={trabajando === r.id}
                    className={`${styles.accion} ${destino === "confirmada" || destino === "completada" ? styles.accionPositiva : ""}`}
                    onClick={() => cambiar(r, destino)}
                  >
                    {ACCION[destino] || ESTADOS[destino]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Configuración ──────────────────────────────────────────────────────────

function Configuracion({ lugarId, nombre, onGuardado }: { lugarId: string; nombre: string; onGuardado: (activo: boolean) => void }) {
  const api = useApi();
  const [config, setConfig] = useState<ConfigReservas | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/reservas/config?lugar=${encodeURIComponent(lugarId)}`)
      .then((d) => setConfig(d.config))
      .catch((e: Error) => setError(e.message));
  }, [api, lugarId]);

  if (error && !config) return <p className={styles.error}>{error}</p>;
  if (!config) return <div className={styles.vacio}>Cargando configuración…</div>;

  const cambiar = <K extends keyof ConfigReservas>(campo: K, valor: ConfigReservas[K]) => {
    setMensaje("");
    setConfig({ ...config, [campo]: valor });
  };
  const cambiarTramos = (dia: number, tramos: Turno[]) => cambiar("horario", { ...config.horario, [String(dia)]: tramos });

  const guardar = async () => {
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const d = await api("/api/reservas/config", { method: "PUT", body: JSON.stringify({ lugarId, config }) });
      setConfig(d.config);
      onGuardado(d.config.activo);
      setMensaje("Guardado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.config}>
      <section className={styles.configGrupo}>
        <h3>Reservaciones en línea</h3>
        <label className={styles.interruptor}>
          <span>Aceptar reservaciones de {nombre}</span>
          <input type="checkbox" checked={config.activo} onChange={(e) => cambiar("activo", e.target.checked)} />
        </label>
        <div className={styles.configRejilla}>
          <label className={styles.campo}>Confirmación
            <select value={config.modo} onChange={(e) => cambiar("modo", e.target.value as ConfigReservas["modo"])}>
              <option value="automatica">Automática si hay cupo</option>
              <option value="aprobacion">El restaurante aprueba cada una</option>
            </select>
          </label>
          <label className={styles.campo}>Personas por horario
            <input type="number" min={1} max={500} value={config.cupoPorTurno} onChange={(e) => cambiar("cupoPorTurno", Number(e.target.value))} />
          </label>
          <label className={styles.campo}>Máximo por reservación
            <input type="number" min={1} max={30} value={config.maxPersonas} onChange={(e) => cambiar("maxPersonas", Number(e.target.value))} />
          </label>
          <label className={styles.campo}>Cada cuánto hay horario
            <select value={config.intervaloMin} onChange={(e) => cambiar("intervaloMin", Number(e.target.value))}>
              {[15, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutos</option>)}
            </select>
          </label>
          <label className={styles.campo}>Reservar con hasta
            <select value={config.anticipacionDias} onChange={(e) => cambiar("anticipacionDias", Number(e.target.value))}>
              {[7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>{d} días de anticipación</option>)}
            </select>
          </label>
          <label className={styles.campo}>Aviso mínimo
            <select value={config.avisoMinimoMin} onChange={(e) => cambiar("avisoMinimoMin", Number(e.target.value))}>
              {[[0, "Sin mínimo"], [30, "30 minutos"], [60, "1 hora"], [120, "2 horas"], [240, "4 horas"], [1440, "1 día"]].map(([v, t]) => (
                <option key={v} value={v}>{t}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={styles.configGrupo}>
        <h3>Horario de reservaciones</h3>
        <p className={styles.ayuda}>La última llegada se ofrece un intervalo antes del cierre. Puedes partir el día en turnos (comida y cena).</p>
        {[1, 2, 3, 4, 5, 6, 0].map((dia) => {
          const tramos = config.horario[String(dia)] || [];
          return (
            <div key={dia} className={styles.diaConfig}>
              <span className={styles.diaNombre}>{DIAS[dia]}</span>
              <div className={styles.tramos}>
                {tramos.length === 0 && <span className={styles.cerradoTexto}>Sin reservaciones</span>}
                {tramos.map((t, i) => (
                  <div key={i} className={styles.tramo}>
                    <input type="time" value={t.abre} onChange={(e) => cambiarTramos(dia, tramos.map((x, j) => (j === i ? { ...x, abre: e.target.value } : x)))} />
                    <span>a</span>
                    <input type="time" value={t.cierra} onChange={(e) => cambiarTramos(dia, tramos.map((x, j) => (j === i ? { ...x, cierra: e.target.value } : x)))} />
                    <button type="button" onClick={() => cambiarTramos(dia, tramos.filter((_, j) => j !== i))}>Quitar</button>
                  </div>
                ))}
                {tramos.length < 3 && (
                  <button
                    type="button"
                    className={styles.agregarTramo}
                    onClick={() => cambiarTramos(dia, [...tramos, tramos.length ? { abre: "19:00", cierra: "23:00" } : { abre: "13:00", cierra: "22:00" }])}
                  >
                    + Agregar turno
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section className={styles.configGrupo}>
        <h3>Detalles</h3>
        <label className={styles.campo}>Política que verá el comensal <em>(opcional)</em>
          <textarea rows={3} maxLength={600} value={config.politica} onChange={(e) => cambiar("politica", e.target.value)} placeholder="Tolerancia de 15 minutos. Para grupos de más de 8, llámanos." />
        </label>
        <label className={styles.campo}>Correo para avisos de reservaciones <em>(si lo dejas vacío, se usa el del dueño del perfil)</em>
          <input type="email" value={config.correoAvisos} onChange={(e) => cambiar("correoAvisos", e.target.value)} placeholder="reservas@turestaurante.com" />
        </label>
      </section>

      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.guardarBarra}>
        <span>{mensaje ? <span className={styles.ok}>✓ {mensaje}</span> : config.activo ? "Las reservaciones están activas" : "Las reservaciones están apagadas"}</span>
        <button type="button" className={styles.botonPrimario} onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}
