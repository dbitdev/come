"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, Clock, Minus, Plus, Users, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DIAS, diaSemana, fechaLegible, hoyEn, sumarDias,
  type ConfigReservas, type HorarioDisponible, type Reserva,
} from "@/lib/reservas";
import styles from "./reservas.module.css";

export type ConfigPublica = Omit<ConfigReservas, "correoAvisos">;

type Paso = "mesa" | "datos" | "listo";

/** Botón "Reservar mesa" + modal de reserva en tres pasos. */
export default function ReservaWidget({
  lugarId, lugarNombre, config, rutaRegreso, className,
}: {
  lugarId: string;
  lugarNombre: string;
  config: ConfigPublica;
  /** A dónde volver después de iniciar sesión. */
  rutaRegreso: string;
  className?: string;
}) {
  const { user } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState<Paso>("mesa");
  const [personas, setPersonas] = useState(Math.min(2, config.maxPersonas));
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [horarios, setHorarios] = useState<HorarioDisponible[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [notas, setNotas] = useState("");
  const [consiente, setConsiente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [reserva, setReserva] = useState<Reserva | null>(null);

  // Días que el restaurante abre dentro de su ventana de anticipación.
  const dias = useMemo(() => {
    const hoy = hoyEn(config.zonaHoraria);
    const lista: string[] = [];
    for (let i = 0; i <= config.anticipacionDias && lista.length < 30; i++) {
      const f = sumarDias(hoy, i);
      if ((config.horario[String(diaSemana(f))] || []).length) lista.push(f);
    }
    return lista;
  }, [config]);

  const abrir = () => {
    setAbierto(true);
    setPaso("mesa");
    setError("");
    setReserva(null);
    setHora("");
    if (!fecha && dias[0]) setFecha(dias[0]);
    if (user) {
      setNombre((n) => n || user.displayName || "");
      setCorreo((c) => c || user.email || "");
    }
  };
  const cerrar = useCallback(() => setAbierto(false), []);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", alTeclear);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener("keydown", alTeclear);
    };
  }, [abierto, cerrar]);

  // Disponibilidad en vivo cada vez que cambia el día o el número de personas.
  useEffect(() => {
    if (!abierto || !fecha || paso !== "mesa") return;
    let vigente = true;
    setCargando(true);
    setError("");
    fetch(`/api/reservas/disponibilidad?lugar=${encodeURIComponent(lugarId)}&fecha=${fecha}&personas=${personas}`, { cache: "no-store" })
      .then(async (r) => {
        const datos = await r.json();
        if (!r.ok) throw new Error(datos.error || "No se pudo consultar la disponibilidad.");
        return datos.horarios as HorarioDisponible[];
      })
      .then((lista) => {
        if (!vigente) return;
        setHorarios(lista);
        setHora((h) => (lista.some((x) => x.hora === h && x.disponible) ? h : ""));
      })
      .catch((e: Error) => vigente && (setHorarios([]), setError(e.message)))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [abierto, fecha, personas, lugarId, paso]);

  const confirmar = async () => {
    if (!user) return;
    setEnviando(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const r = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lugarId, fecha, hora, personas, nombre, telefono, correo, notas, origen: "web", consentimiento: consiente }),
      });
      const datos = await r.json();
      if (!r.ok) {
        // Si se llenó mientras llenaba sus datos, lo regresamos a elegir horario.
        if (datos.codigo === "SIN_CUPO" || datos.codigo === "HORARIO") {
          setPaso("mesa");
          setHora("");
        }
        throw new Error(datos.error || "No se pudo reservar.");
      }
      setReserva(datos.reserva);
      setPaso("listo");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo reservar.");
    } finally {
      setEnviando(false);
    }
  };

  const disponibles = horarios.filter((h) => h.disponible).length;
  const datosCompletos = nombre.trim() && telefono.replace(/\D/g, "").length >= 8 && /^\S+@\S+\.\S+$/.test(correo.trim());

  return (
    <>
      <button type="button" className={className || styles.botonReservar} onClick={abrir}>
        <CalendarDays size={18} /> Reservar mesa
      </button>

      {abierto && (
        <div className={styles.fondo} onClick={cerrar}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`Reservar en ${lugarNombre}`} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalCabeza}>
              <div>
                <span className={styles.ceja}>RESERVAR MESA</span>
                <h2>{lugarNombre}</h2>
              </div>
              <button type="button" className={styles.cerrar} onClick={cerrar} aria-label="Cerrar">
                <X size={20} />
              </button>
            </header>

            {paso !== "listo" && (
              <ol className={styles.pasos}>
                <li className={paso === "mesa" ? styles.pasoActivo : styles.pasoHecho}>1 · Mesa</li>
                <li className={paso === "datos" ? styles.pasoActivo : ""}>2 · Tus datos</li>
              </ol>
            )}

            <div className={styles.modalCuerpo}>
              {paso === "mesa" && (
                <>
                  <div className={styles.fila}>
                    <span className={styles.etiqueta}><Users size={16} /> Personas</span>
                    <div className={styles.contador}>
                      <button type="button" onClick={() => setPersonas((p) => Math.max(1, p - 1))} disabled={personas <= 1} aria-label="Menos personas"><Minus size={16} /></button>
                      <b>{personas}</b>
                      <button type="button" onClick={() => setPersonas((p) => Math.min(config.maxPersonas, p + 1))} disabled={personas >= config.maxPersonas} aria-label="Más personas"><Plus size={16} /></button>
                    </div>
                  </div>
                  {personas >= config.maxPersonas && (
                    <p className={styles.ayuda}>Para más de {config.maxPersonas} personas, llama directamente al restaurante.</p>
                  )}

                  <span className={styles.etiqueta}><CalendarDays size={16} /> Día</span>
                  {dias.length === 0 ? (
                    <p className={styles.vacio}>Por ahora no hay días con reservaciones abiertas.</p>
                  ) : (
                    <div className={styles.dias}>
                      {dias.map((f) => {
                        const [, , d] = f.split("-");
                        return (
                          <button type="button" key={f} className={f === fecha ? styles.diaActivo : styles.dia} onClick={() => setFecha(f)}>
                            <small>{DIAS[diaSemana(f)].slice(0, 3)}</small>
                            <b>{Number(d)}</b>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <span className={styles.etiqueta}><Clock size={16} /> Hora {fecha && <em>· {fechaLegible(fecha)}</em>}</span>
                  {cargando ? (
                    <p className={styles.vacio}>Buscando mesas…</p>
                  ) : horarios.length === 0 ? (
                    <p className={styles.vacio}>{error || "Ese día no hay horarios. Prueba otro."}</p>
                  ) : (
                    <>
                      <div className={styles.horas}>
                        {horarios.map((h) => (
                          <button
                            type="button"
                            key={h.hora}
                            disabled={!h.disponible}
                            className={h.hora === hora ? styles.horaActiva : styles.hora}
                            onClick={() => setHora(h.hora)}
                          >
                            {h.hora}
                          </button>
                        ))}
                      </div>
                      {disponibles === 0 && <p className={styles.ayuda}>No quedan mesas para {personas} ese día. Prueba con otro día o menos personas.</p>}
                    </>
                  )}
                </>
              )}

              {paso === "datos" && (
                !user ? (
                  <div className={styles.sinSesion}>
                    <p>Para apartar tu mesa necesitas una cuenta de Come: así puedes ver y cancelar tus reservaciones.</p>
                    <Link href={`/login?next=${encodeURIComponent(rutaRegreso)}`} className={styles.botonPrimario}>Iniciar sesión</Link>
                    <Link href={`/register?next=${encodeURIComponent(rutaRegreso)}`} className={styles.botonSecundario}>Crear cuenta</Link>
                  </div>
                ) : (
                  <>
                    <div className={styles.resumen}>
                      <span><CalendarDays size={15} /> {fechaLegible(fecha, hora)}</span>
                      <span><Users size={15} /> {personas} {personas === 1 ? "persona" : "personas"}</span>
                    </div>
                    <label className={styles.campo}>Nombre para la reservación
                      <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" maxLength={120} />
                    </label>
                    <label className={styles.campo}>Teléfono
                      <input value={telefono} onChange={(e) => setTelefono(e.target.value)} type="tel" autoComplete="tel" inputMode="tel" placeholder="55 1234 5678" maxLength={40} />
                    </label>
                    <label className={styles.campo}>Correo
                      <input value={correo} onChange={(e) => setCorreo(e.target.value)} type="email" autoComplete="email" maxLength={180} />
                    </label>
                    <label className={styles.campo}>Notas para el restaurante <em>(opcional)</em>
                      <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} maxLength={500} placeholder="Cumpleaños, alergias, silla para bebé…" />
                    </label>
                    {config.politica && <p className={styles.politica}>{config.politica}</p>}
                    {config.modo === "aprobacion" && (
                      <p className={styles.ayuda}>Este restaurante confirma cada reservación; te avisaremos por correo.</p>
                    )}
                    <label className={styles.consentimiento}>
                      <input type="checkbox" checked={consiente} onChange={(e) => setConsiente(e.target.checked)} />
                      <span>
                        Acepto que Come comparta estos datos —incluidas las notas, como alergias— con {lugarNombre} para
                        gestionar mi reservación, conforme al <Link href="/privacidad" target="_blank">Aviso de privacidad</Link> y
                        los <Link href="/terminos#reservaciones" target="_blank">Términos</Link>.
                      </span>
                    </label>
                  </>
                )
              )}

              {paso === "listo" && reserva && (
                <div className={styles.listo}>
                  <span className={styles.listoIcono}><Check size={28} /></span>
                  <h3>{reserva.estado === "confirmada" ? "¡Mesa confirmada!" : "Solicitud enviada"}</h3>
                  <p>
                    {reserva.estado === "confirmada"
                      ? `Te esperan en ${lugarNombre}. Te mandamos los detalles a ${reserva.correo}.`
                      : `${lugarNombre} revisará tu solicitud y te avisaremos por correo.`}
                  </p>
                  <div className={styles.resumen}>
                    <span><CalendarDays size={15} /> {fechaLegible(reserva.fecha, reserva.hora)}</span>
                    <span><Users size={15} /> {reserva.personas}</span>
                    <span>Código <b className={styles.codigo}>{reserva.codigo}</b></span>
                  </div>
                  <Link href="/perfil#reservas" className={styles.botonPrimario}>Ver mis reservaciones</Link>
                </div>
              )}

              {error && paso !== "mesa" && <p className={styles.error}>{error}</p>}
            </div>

            {paso === "mesa" && (
              <footer className={styles.modalPie}>
                <button type="button" className={styles.botonPrimario} disabled={!hora} onClick={() => { setError(""); setPaso("datos"); }}>
                  {hora ? `Continuar · ${hora}` : "Elige una hora"}
                </button>
              </footer>
            )}
            {paso === "datos" && user && (
              <footer className={styles.modalPie}>
                <button type="button" className={styles.botonSecundario} onClick={() => setPaso("mesa")}>Atrás</button>
                <button type="button" className={styles.botonPrimario} disabled={!datosCompletos || !consiente || enviando} onClick={confirmar}>
                  {enviando ? "Reservando…" : config.modo === "aprobacion" ? "Enviar solicitud" : "Confirmar reservación"}
                </button>
              </footer>
            )}
          </div>
        </div>
      )}
    </>
  );
}
