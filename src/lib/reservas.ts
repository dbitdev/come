/**
 * Reservaciones: tipos y reglas puras (sin Firebase), compartidas por el
 * servidor y los componentes. Todo cálculo de horarios se hace en la zona
 * horaria del restaurante, nunca en la del navegador ni la del servidor.
 */

export type ModoReserva = "automatica" | "aprobacion";

export type EstadoReserva =
  | "pendiente"
  | "confirmada"
  | "rechazada"
  | "cancelada"
  | "completada"
  | "no_show";

/** Un tramo de servicio: "13:00" a "17:00". */
export interface Turno {
  abre: string;
  cierra: string;
}

/** Claves "0" (domingo) a "6" (sábado), como Date#getDay. */
export type HorarioSemanal = Record<string, Turno[]>;

export interface ConfigReservas {
  activo: boolean;
  modo: ModoReserva;
  horario: HorarioSemanal;
  /** Cada cuántos minutos arranca un horario reservable. */
  intervaloMin: number;
  /** Personas que caben en cada horario de llegada. */
  cupoPorTurno: number;
  maxPersonas: number;
  anticipacionDias: number;
  /** No se puede reservar con menos de esto de anticipación. */
  avisoMinimoMin: number;
  zonaHoraria: string;
  politica: string;
  /** A dónde avisar de reservas nuevas; si está vacío, al dueño del perfil. */
  correoAvisos: string;
}

export interface Reserva {
  id: string;
  codigo: string;
  lugarId: string;
  lugarNombre: string;
  userId: string;
  nombre: string;
  telefono: string;
  correo: string;
  personas: number;
  fecha: string; // YYYY-MM-DD en la zona del restaurante
  hora: string; // HH:mm
  inicioMs: number;
  notas: string;
  estado: EstadoReserva;
  origen: "web" | "app";
  creadoMs: number;
}

export interface HorarioDisponible {
  hora: string;
  disponible: boolean;
  /** Lugares que quedan en ese horario (sólo informativo). */
  restantes: number;
}

export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const ESTADOS: Record<EstadoReserva, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
  completada: "Completada",
  no_show: "No llegó",
};

/** Estados que ocupan cupo. */
export const OCUPAN_CUPO: EstadoReserva[] = ["pendiente", "confirmada"];

const HORARIO_BASE: HorarioSemanal = {
  "0": [{ abre: "13:00", cierra: "18:00" }],
  "1": [],
  "2": [{ abre: "13:00", cierra: "22:00" }],
  "3": [{ abre: "13:00", cierra: "22:00" }],
  "4": [{ abre: "13:00", cierra: "22:00" }],
  "5": [{ abre: "13:00", cierra: "23:00" }],
  "6": [{ abre: "13:00", cierra: "23:00" }],
};

export const CONFIG_BASE: ConfigReservas = {
  activo: false,
  modo: "automatica",
  horario: HORARIO_BASE,
  intervaloMin: 30,
  cupoPorTurno: 20,
  maxPersonas: 8,
  anticipacionDias: 30,
  avisoMinimoMin: 60,
  zonaHoraria: "America/Mexico_City",
  politica: "",
  correoAvisos: "",
};

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const entero = (v: unknown, min: number, max: number, base: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : base;
};
const aMinutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const aHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

function zonaValida(zona: unknown): string {
  if (typeof zona !== "string" || !zona) return CONFIG_BASE.zonaHoraria;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zona });
    return zona;
  } catch {
    return CONFIG_BASE.zonaHoraria;
  }
}

/** Limpia lo que venga de Firestore o de un formulario: nunca confiar en la forma. */
export function normalizarConfig(raw: unknown): ConfigReservas {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const horarioRaw = (d.horario && typeof d.horario === "object" ? d.horario : HORARIO_BASE) as Record<string, unknown>;
  const horario: HorarioSemanal = {};
  for (let dia = 0; dia < 7; dia++) {
    const lista = Array.isArray(horarioRaw[String(dia)]) ? (horarioRaw[String(dia)] as unknown[]) : [];
    horario[String(dia)] = lista
      .map((t) => t as Partial<Turno>)
      .filter((t) => typeof t?.abre === "string" && typeof t?.cierra === "string" && HHMM.test(t.abre) && HHMM.test(t.cierra))
      .filter((t) => aMinutos(t.cierra!) > aMinutos(t.abre!))
      .slice(0, 3)
      .map((t) => ({ abre: t.abre!, cierra: t.cierra! }));
  }
  return {
    activo: d.activo === true,
    modo: d.modo === "aprobacion" ? "aprobacion" : "automatica",
    horario,
    intervaloMin: [15, 30, 45, 60].includes(Number(d.intervaloMin)) ? Number(d.intervaloMin) : 30,
    cupoPorTurno: entero(d.cupoPorTurno, 1, 500, CONFIG_BASE.cupoPorTurno),
    maxPersonas: entero(d.maxPersonas, 1, 30, CONFIG_BASE.maxPersonas),
    anticipacionDias: entero(d.anticipacionDias, 1, 180, CONFIG_BASE.anticipacionDias),
    avisoMinimoMin: entero(d.avisoMinimoMin, 0, 2880, CONFIG_BASE.avisoMinimoMin),
    zonaHoraria: zonaValida(d.zonaHoraria),
    politica: typeof d.politica === "string" ? d.politica.trim().slice(0, 600) : "",
    correoAvisos: typeof d.correoAvisos === "string" ? d.correoAvisos.trim().slice(0, 180) : "",
  };
}

/** Día de la semana de una fecha local "YYYY-MM-DD" (independiente de zonas). */
export function diaSemana(fecha: string): number {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function esFechaValida(fecha: unknown): fecha is string {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [y, m, d] = fecha.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Minutos que la zona va adelantada respecto a UTC en un instante dado. */
function desfaseMin(zona: string, utcMs: number): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: zona, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const v = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  const comoUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second"));
  return Math.round((comoUtc - utcMs) / 60000);
}

/** Instante (ms UTC) de una fecha y hora locales en la zona del restaurante. */
export function instanteLocal(fecha: string, hora: string, zona: string): number {
  const [y, m, d] = fecha.split("-").map(Number);
  const ingenuo = Date.UTC(y, m - 1, d, Number(hora.slice(0, 2)), Number(hora.slice(3, 5)));
  const primero = ingenuo - desfaseMin(zona, ingenuo) * 60000;
  // Segunda pasada por si el desfase cambia justo en ese día (horario de verano).
  return ingenuo - desfaseMin(zona, primero) * 60000;
}

/** "Hoy" en la zona del restaurante. */
export function hoyEn(zona: string, ahoraMs = Date.now()): string {
  return new Date(ahoraMs + desfaseMin(zona, ahoraMs) * 60000).toISOString().slice(0, 10);
}

/** Horas de llegada que ofrece el restaurante ese día, en orden. */
export function horasDelDia(config: ConfigReservas, fecha: string): string[] {
  const turnos = config.horario[String(diaSemana(fecha))] || [];
  const horas = new Set<string>();
  for (const turno of turnos) {
    // La última llegada es un intervalo antes del cierre.
    for (let t = aMinutos(turno.abre); t + config.intervaloMin <= aMinutos(turno.cierra); t += config.intervaloMin) {
      horas.add(aHHMM(t));
    }
  }
  return [...horas].sort();
}

/** Si una fecha cae dentro de la ventana que acepta el restaurante. */
export function fechaEnVentana(config: ConfigReservas, fecha: string, ahoraMs = Date.now()): boolean {
  const hoy = hoyEn(config.zonaHoraria, ahoraMs);
  return fecha >= hoy && fecha <= sumarDias(hoy, config.anticipacionDias);
}

/** Si a una hora concreta todavía se puede llegar respetando el aviso mínimo. */
export function horaReservable(config: ConfigReservas, fecha: string, hora: string, ahoraMs = Date.now()): boolean {
  return instanteLocal(fecha, hora, config.zonaHoraria) >= ahoraMs + config.avisoMinimoMin * 60000;
}

export const idCupo = (lugarId: string, fecha: string, hora: string) => `${lugarId}_${fecha}_${hora.replace(":", "")}`;

/** Código corto legible para el comensal (sin 0/O ni 1/I). */
export function codigoReserva(): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 6; i++) c += letras[Math.floor(Math.random() * letras.length)];
  return c;
}

/** Texto amable: "sáb 4 oct · 20:30". */
export function fechaLegible(fecha: string, hora?: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const texto = new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(y, m - 1, d)))
    .replace(/\./g, "");
  return hora ? `${texto} · ${hora}` : texto;
}

/** Transiciones de estado que puede hacer quien gestiona el restaurante. */
export const TRANSICIONES_GESTION: Record<EstadoReserva, EstadoReserva[]> = {
  pendiente: ["confirmada", "rechazada"],
  confirmada: ["completada", "no_show", "cancelada"],
  rechazada: ["confirmada"],
  cancelada: ["confirmada"],
  completada: ["confirmada"],
  no_show: ["confirmada", "completada"],
};
