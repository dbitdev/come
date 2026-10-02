import "server-only";
import { FieldValue, type DocumentData, type Query } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth, adminDb } from "./firebase-admin";
import { PRIVACIDAD_VERSION, TERMINOS_VERSION } from "./legal";
import {
  ESTADOS, OCUPAN_CUPO, TRANSICIONES_GESTION, codigoReserva, fechaEnVentana, fechaLegible, horaReservable,
  horasDelDia, idCupo, instanteLocal, normalizarConfig,
  type ConfigReservas, type EstadoReserva, type HorarioDisponible, type Reserva,
} from "./reservas";

const ADMIN_EMAILS = new Set(["dbitdev@gmail.com", "admin@come.mx", "parradabito@gmail.com"]);
const RESERVAS = "reservations";
const CUPOS = "reservation_slots";
/**
 * Datos privados de la configuración (el correo de avisos). La colección `come`
 * es de lectura pública, así que lo que no debe ver cualquiera vive aquí, sólo
 * accesible desde el servidor.
 */
const PRIVADO = "reservation_settings";

async function correoAvisosDe(lugarId: string): Promise<string> {
  const d = await adminDb.collection(PRIVADO).doc(lugarId).get();
  return typeof d.data()?.correoAvisos === "string" ? d.data()!.correoAvisos : "";
}

/** Configuración completa para quien gestiona: pública + privada. */
export async function configCompleta(lugarId: string, lugar: DocumentData): Promise<ConfigReservas> {
  return normalizarConfig({ ...(lugar.reservas || {}), correoAvisos: await correoAvisosDe(lugarId) });
}
const SITIO = (process.env.NEXT_PUBLIC_APP_URL || "https://comeapp.com.mx").replace(/\/$/, "");

/** Error con código para que las rutas respondan el status correcto. */
export class ErrorReserva extends Error {
  constructor(public codigo: string, mensaje: string, public status = 400) {
    super(mensaje);
  }
}

export async function usuarioDe(request: Request): Promise<DecodedIdToken> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new ErrorReserva("UNAUTHORIZED", "Inicia sesión para continuar.", 401);
  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    throw new ErrorReserva("UNAUTHORIZED", "Tu sesión expiró. Vuelve a iniciar sesión.", 401);
  }
}

/** Admin: correo de arranque verificado, o rol 'admin' en su ficha (lo pone otro admin). */
export async function esAdmin(usuario: DecodedIdToken): Promise<boolean> {
  if (usuario.email && ADMIN_EMAILS.has(usuario.email) && usuario.email_verified !== false) return true;
  const ficha = await adminDb.collection("users").doc(usuario.uid).get();
  return ficha.data()?.role === "admin";
}

async function leerLugar(lugarId: string) {
  if (!lugarId || lugarId.includes("/")) throw new ErrorReserva("LUGAR", "Restaurante inválido.", 400);
  const doc = await adminDb.collection("come").doc(lugarId).get();
  if (!doc.exists) throw new ErrorReserva("LUGAR", "Este restaurante ya no existe.", 404);
  return { id: doc.id, data: doc.data() as DocumentData };
}

export const nombreLugar = (d: DocumentData) => String(d.restaurantName || d.name || "Restaurante");

/** Admin, o dueño del perfil (perfil reclamado). Los curadores no gestionan reservas. */
export async function puedeGestionar(usuario: DecodedIdToken, lugar: DocumentData): Promise<boolean> {
  if (lugar.userId && lugar.userId === usuario.uid) return true;
  return esAdmin(usuario);
}

const docAReserva = (id: string, d: DocumentData): Reserva => ({
  id,
  codigo: d.codigo || "",
  lugarId: d.lugarId,
  lugarNombre: d.lugarNombre || "",
  userId: d.userId,
  nombre: d.nombre || "",
  telefono: d.telefono || "",
  correo: d.correo || "",
  personas: Number(d.personas) || 0,
  fecha: d.fecha,
  hora: d.hora,
  inicioMs: Number(d.inicioMs) || 0,
  notas: d.notas || "",
  estado: d.estado,
  origen: d.origen === "app" ? "app" : "web",
  creadoMs: d.creadoEn?.toMillis?.() ?? 0,
});

// ── Disponibilidad ─────────────────────────────────────────────────────────

export async function disponibilidad(lugarId: string, fecha: string, personas: number) {
  const lugar = await leerLugar(lugarId);
  const config = normalizarConfig(lugar.data.reservas);
  if (!config.activo) throw new ErrorReserva("INACTIVO", "Este restaurante no está tomando reservaciones en línea.", 409);
  if (!fechaEnVentana(config, fecha)) return { config: publica(config), horarios: [] as HorarioDisponible[] };
  const horas = horasDelDia(config, fecha);
  const refs = horas.map((h) => adminDb.collection(CUPOS).doc(idCupo(lugarId, fecha, h)));
  const cupos = refs.length ? await adminDb.getAll(...refs) : [];
  const horarios = horas.map((hora, i) => {
    const ocupadas = Number(cupos[i]?.data()?.personas) || 0;
    const restantes = Math.max(0, config.cupoPorTurno - ocupadas);
    return {
      hora,
      restantes,
      disponible: restantes >= personas && personas <= config.maxPersonas && horaReservable(config, fecha, hora),
    };
  });
  return { config: publica(config), horarios };
}

/** Lo que el comensal puede ver de la configuración (sin el correo interno). */
export function publica(config: ConfigReservas) {
  const { correoAvisos: _oculto, ...resto } = config;
  return resto;
}

// ── Alta ───────────────────────────────────────────────────────────────────

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function crearReserva(usuario: DecodedIdToken, entrada: Record<string, unknown>) {
  const lugarId = texto(entrada.lugarId, 120);
  const fecha = texto(entrada.fecha, 10);
  const hora = texto(entrada.hora, 5);
  const personas = Math.round(Number(entrada.personas));
  const nombre = texto(entrada.nombre, 120);
  const telefono = texto(entrada.telefono, 40);
  const correo = texto(entrada.correo, 180) || usuario.email || "";
  const notas = texto(entrada.notas, 500);
  const origen = entrada.origen === "app" ? "app" : "web";

  if (!nombre) throw new ErrorReserva("DATOS", "Escribe el nombre para la reservación.");
  if (telefono.replace(/\D/g, "").length < 8) throw new ErrorReserva("DATOS", "Escribe un teléfono válido para que el restaurante pueda contactarte.");
  if (!/^\S+@\S+\.\S+$/.test(correo)) throw new ErrorReserva("DATOS", "Escribe un correo válido.");
  if (!Number.isFinite(personas) || personas < 1) throw new ErrorReserva("DATOS", "Indica para cuántas personas.");
  // Consentimiento expreso para compartir los datos (y las notas, que pueden
  // incluir alergias: dato sensible) con el restaurante.
  if (entrada.consentimiento !== true) {
    throw new ErrorReserva("CONSENTIMIENTO", "Para reservar, acepta compartir tus datos con el restaurante.");
  }

  const lugar = await leerLugar(lugarId);
  const config = normalizarConfig(lugar.data.reservas);
  if (!config.activo) throw new ErrorReserva("INACTIVO", "Este restaurante no está tomando reservaciones en línea.", 409);
  if (personas > config.maxPersonas) {
    throw new ErrorReserva("PERSONAS", `En línea se reserva hasta para ${config.maxPersonas} personas. Para grupos más grandes, llama al restaurante.`);
  }
  if (!fechaEnVentana(config, fecha) || !horasDelDia(config, fecha).includes(hora)) {
    throw new ErrorReserva("HORARIO", "Ese horario no está disponible. Elige otro.", 409);
  }
  if (!horaReservable(config, fecha, hora)) {
    throw new ErrorReserva("HORARIO", "Ese horario ya pasó o está muy cerca. Elige uno más adelante.", 409);
  }

  const estado: EstadoReserva = config.modo === "aprobacion" ? "pendiente" : "confirmada";
  const refReserva = adminDb.collection(RESERVAS).doc();
  const refCupo = adminDb.collection(CUPOS).doc(idCupo(lugarId, fecha, hora));
  const codigo = codigoReserva();
  const inicioMs = instanteLocal(fecha, hora, config.zonaHoraria);

  await adminDb.runTransaction(async (tx) => {
    // Una reserva activa por persona, lugar y día: evita duplicados por doble clic.
    const previas = await tx.get(
      adminDb.collection(RESERVAS).where("userId", "==", usuario.uid).where("lugarId", "==", lugarId).where("fecha", "==", fecha),
    );
    if (previas.docs.some((d) => OCUPAN_CUPO.includes(d.data().estado))) {
      throw new ErrorReserva("DUPLICADA", "Ya tienes una reservación en este restaurante ese día. Puedes verla en tu perfil.", 409);
    }
    const cupo = await tx.get(refCupo);
    const ocupadas = Number(cupo.data()?.personas) || 0;
    if (ocupadas + personas > config.cupoPorTurno) {
      throw new ErrorReserva("SIN_CUPO", "Se acaba de llenar ese horario. Elige otro.", 409);
    }
    tx.set(refCupo, { lugarId, fecha, hora, personas: ocupadas + personas, actualizadoEn: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(refReserva, {
      codigo, lugarId, lugarNombre: nombreLugar(lugar.data), lugarDueno: lugar.data.userId || null,
      userId: usuario.uid, nombre, telefono, correo, personas, fecha, hora, inicioMs, notas, estado, origen,
      zonaHoraria: config.zonaHoraria,
      consentimiento: { privacidad: PRIVACIDAD_VERSION, terminos: TERMINOS_VERSION, enMs: Date.now() },
      historial: [{ estado, porUid: usuario.uid, enMs: Date.now() }],
      creadoEn: FieldValue.serverTimestamp(), actualizadoEn: FieldValue.serverTimestamp(),
    });
  });

  const reserva: Reserva = {
    id: refReserva.id, codigo, lugarId, lugarNombre: nombreLugar(lugar.data), userId: usuario.uid, nombre, telefono, correo,
    personas, fecha, hora, inicioMs, notas, estado, origen, creadoMs: Date.now(),
  };
  // Los correos nunca deben tumbar una reserva ya guardada.
  await Promise.allSettled([
    correoAlComensal(reserva, config, estado === "confirmada" ? "confirmada" : "recibida"),
    correoAlRestaurante(reserva, config, lugar.data, "nueva"),
  ]);
  return reserva;
}

// ── Cambios de estado ──────────────────────────────────────────────────────

export async function cambiarEstado(usuario: DecodedIdToken, reservaId: string, nuevo: EstadoReserva) {
  if (!(nuevo in ESTADOS)) throw new ErrorReserva("ESTADO", "Estado inválido.");
  const ref = adminDb.collection(RESERVAS).doc(reservaId);
  const inicial = await ref.get();
  if (!inicial.exists) throw new ErrorReserva("NO_EXISTE", "La reservación ya no existe.", 404);
  const lugar = await leerLugar(inicial.data()!.lugarId);
  const config = normalizarConfig(lugar.data.reservas);
  const esComensal = inicial.data()!.userId === usuario.uid;
  const gestiona = await puedeGestionar(usuario, lugar.data);
  if (!esComensal && !gestiona) throw new ErrorReserva("FORBIDDEN", "No puedes modificar esta reservación.", 403);

  let anterior: EstadoReserva = inicial.data()!.estado;
  let canceloComensal = false as boolean;
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.data()!;
    anterior = d.estado;
    if (anterior === nuevo) return;

    // Quien gestiona sigue el flujo del restaurante; el comensal sólo puede
    // cancelar lo suyo mientras siga activo y antes de la hora.
    const permitidaGestion = gestiona && TRANSICIONES_GESTION[anterior].includes(nuevo);
    const permitidaComensal = esComensal && nuevo === "cancelada" && OCUPAN_CUPO.includes(anterior) && Number(d.inicioMs) > Date.now();
    if (!permitidaGestion && !permitidaComensal) {
      if (esComensal && !gestiona) {
        const motivo = nuevo !== "cancelada"
          ? "Desde tu cuenta sólo puedes cancelar tu reservación."
          : Number(d.inicioMs) <= Date.now() ? "La hora de la reservación ya pasó." : "Esta reservación ya no se puede cancelar.";
        throw new ErrorReserva("ESTADO", motivo, 409);
      }
      throw new ErrorReserva("ESTADO", `No se puede pasar de “${ESTADOS[anterior]}” a “${ESTADOS[nuevo]}”.`, 409);
    }
    canceloComensal = !permitidaGestion && permitidaComensal;

    const ocupaba = OCUPAN_CUPO.includes(anterior);
    const ocupara = OCUPAN_CUPO.includes(nuevo);
    if (ocupaba !== ocupara) {
      const refCupo = adminDb.collection(CUPOS).doc(idCupo(d.lugarId, d.fecha, d.hora));
      const cupo = await tx.get(refCupo);
      const ocupadas = Number(cupo.data()?.personas) || 0;
      const personas = Number(d.personas) || 0;
      if (ocupara && ocupadas + personas > config.cupoPorTurno) {
        throw new ErrorReserva("SIN_CUPO", "Ese horario ya está lleno; no se puede volver a confirmar.", 409);
      }
      tx.set(refCupo, {
        lugarId: d.lugarId, fecha: d.fecha, hora: d.hora,
        personas: Math.max(0, ocupadas + (ocupara ? personas : -personas)),
        actualizadoEn: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    tx.update(ref, {
      estado: nuevo,
      actualizadoEn: FieldValue.serverTimestamp(),
      historial: FieldValue.arrayUnion({ estado: nuevo, porUid: usuario.uid, enMs: Date.now() }),
    });
  });

  const final = docAReserva(reservaId, { ...inicial.data(), estado: nuevo });
  if (anterior !== nuevo) {
    await Promise.allSettled([
      ["confirmada", "rechazada", "cancelada"].includes(nuevo) && !canceloComensal
        ? correoAlComensal(final, config, nuevo as "confirmada" | "rechazada" | "cancelada")
        : Promise.resolve(),
      canceloComensal ? correoAlRestaurante(final, config, lugar.data, "cancelada") : Promise.resolve(),
    ]);
  }
  return final;
}

// ── Gestión ────────────────────────────────────────────────────────────────

/**
 * Lista para el panel. Sólo filtros de igualdad, que Firestore resuelve sin
 * índices compuestos: un día concreto o las pendientes.
 */
export async function listarReservas(filtro: { lugarId?: string; fecha?: string; estado?: EstadoReserva }) {
  let q: Query = adminDb.collection(RESERVAS);
  if (filtro.lugarId) q = q.where("lugarId", "==", filtro.lugarId);
  if (filtro.fecha) q = q.where("fecha", "==", filtro.fecha);
  if (filtro.estado) q = q.where("estado", "==", filtro.estado);
  const snap = await q.limit(500).get();
  return snap.docs
    .map((d) => docAReserva(d.id, d.data()))
    .sort((a, b) => a.inicioMs - b.inicioMs);
}

export async function guardarConfig(lugarId: string, raw: unknown) {
  const config = normalizarConfig(raw);
  const { correoAvisos, ...publica } = config;
  // update() reemplaza el mapa `reservas` completo (set+merge lo fusionaría y
  // dejaría vivo un correoAvisos viejo en el documento público).
  await adminDb.collection("come").doc(lugarId).update({ reservas: publica, lastUpdated: FieldValue.serverTimestamp() });
  await adminDb.collection(PRIVADO).doc(lugarId).set({ correoAvisos, actualizadoEn: FieldValue.serverTimestamp() }, { merge: true });
  return config;
}

export async function lugaresDe(usuario: DecodedIdToken) {
  const admin = await esAdmin(usuario);
  const q = admin ? adminDb.collection("come") : adminDb.collection("come").where("userId", "==", usuario.uid);
  const snap = await q.select("restaurantName", "name", "reservas", "userId").get();
  return {
    admin,
    lugares: snap.docs
      .map((d) => ({ id: d.id, nombre: nombreLugar(d.data()), activo: d.data().reservas?.activo === true }))
      .sort((a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre, "es")),
  };
}

// ── Correos (Resend) ───────────────────────────────────────────────────────

const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function enviarCorreo(para: string, asunto: string, cuerpo: string) {
  const clave = process.env.RESEND_API_KEY;
  if (!clave || !para) {
    if (!clave) console.info(`[reservas] Correo omitido (falta RESEND_API_KEY): ${asunto}`);
    return;
  }
  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Come <reservas@comeapp.com.mx>",
      to: [para],
      subject: asunto,
      html: plantilla(asunto, cuerpo),
    }),
  });
  if (!respuesta.ok) console.error("[reservas] Resend falló", respuesta.status, await respuesta.text().catch(() => ""));
}

function plantilla(titulo: string, cuerpo: string) {
  return `<!doctype html><html><body style="margin:0;background:#fffdf7;font-family:Helvetica,Arial,sans-serif;color:#14211b">
<div style="max-width:560px;margin:0 auto;padding:28px 22px">
<div style="font-size:26px;font-weight:800;color:#075438;letter-spacing:-1px;margin-bottom:18px">come</div>
<h1 style="font-size:22px;line-height:1.25;margin:0 0 14px">${escapar(titulo)}</h1>
${cuerpo}
<p style="font-size:12px;color:#6b7a72;margin-top:28px;border-top:1px solid #e3e7e1;padding-top:14px">
Come · <a href="${SITIO}" style="color:#075438">comeapp.com.mx</a></p></div></body></html>`;
}

const tablaReserva = (r: Reserva) => `<table style="width:100%;border-collapse:collapse;font-size:15px;margin:6px 0 18px">
<tr><td style="padding:6px 0;color:#6b7a72">Restaurante</td><td style="padding:6px 0;font-weight:700;text-align:right">${escapar(r.lugarNombre)}</td></tr>
<tr><td style="padding:6px 0;color:#6b7a72">Cuándo</td><td style="padding:6px 0;font-weight:700;text-align:right">${escapar(fechaLegible(r.fecha, r.hora))}</td></tr>
<tr><td style="padding:6px 0;color:#6b7a72">Personas</td><td style="padding:6px 0;font-weight:700;text-align:right">${r.personas}</td></tr>
<tr><td style="padding:6px 0;color:#6b7a72">Código</td><td style="padding:6px 0;font-weight:700;text-align:right;letter-spacing:2px">${escapar(r.codigo)}</td></tr>
</table>`;

async function correoAlComensal(r: Reserva, config: ConfigReservas, tipo: "confirmada" | "recibida" | "rechazada" | "cancelada") {
  const asuntos = {
    confirmada: `Tu mesa en ${r.lugarNombre} está confirmada`,
    recibida: `Recibimos tu solicitud en ${r.lugarNombre}`,
    rechazada: `${r.lugarNombre} no pudo confirmar tu reservación`,
    cancelada: `Tu reservación en ${r.lugarNombre} fue cancelada`,
  };
  const intro = {
    confirmada: `<p>¡Listo, ${escapar(r.nombre)}! Te esperan:</p>`,
    recibida: `<p>Hola ${escapar(r.nombre)}, el restaurante revisará tu solicitud y te avisaremos en cuanto la confirme.</p>`,
    rechazada: `<p>Hola ${escapar(r.nombre)}, el restaurante no tiene lugar para esta solicitud. Puedes intentar con otro horario.</p>`,
    cancelada: `<p>Hola ${escapar(r.nombre)}, el restaurante canceló esta reservación. Si tienes dudas, contáctalos directamente.</p>`,
  };
  const politica = config.politica && tipo !== "rechazada" ? `<p style="font-size:13px;color:#6b7a72">${escapar(config.politica)}</p>` : "";
  await enviarCorreo(r.correo, asuntos[tipo], `${intro[tipo]}${tablaReserva(r)}${politica}
<p><a href="${SITIO}/perfil" style="display:inline-block;background:#075438;color:#fff;padding:11px 18px;border-radius:6px;text-decoration:none;font-weight:700">Ver mis reservaciones</a></p>`);
}

async function correoAlRestaurante(r: Reserva, config: ConfigReservas, lugar: DocumentData, tipo: "nueva" | "cancelada") {
  let para = config.correoAvisos || (await correoAvisosDe(r.lugarId));
  if (!para && lugar.userId) para = String((await adminDb.collection("users").doc(lugar.userId).get()).data()?.email || "");
  if (!para) return;
  const titulo = tipo === "nueva"
    ? (r.estado === "pendiente" ? `Nueva solicitud de reservación · ${r.personas} personas` : `Nueva reservación · ${r.personas} personas`)
    : `Reservación cancelada por el comensal`;
  await enviarCorreo(para, `${titulo} · ${fechaLegible(r.fecha, r.hora)}`, `<p>${escapar(r.nombre)} · ${escapar(r.telefono)} · ${escapar(r.correo)}</p>
${tablaReserva(r)}${r.notas ? `<p style="font-size:14px"><b>Notas:</b> ${escapar(r.notas)}</p>` : ""}
${r.estado === "pendiente" && tipo === "nueva" ? "<p><b>Esta solicitud espera tu confirmación.</b></p>" : ""}
<p><a href="${SITIO}/negocio/reservas?lugar=${encodeURIComponent(r.lugarId)}" style="display:inline-block;background:#075438;color:#fff;padding:11px 18px;border-radius:6px;text-decoration:none;font-weight:700">Abrir reservaciones</a></p>`);
}

/** Traduce cualquier error a una respuesta HTTP. */
export function responderError(error: unknown) {
  if (error instanceof ErrorReserva) return Response.json({ error: error.message, codigo: error.codigo }, { status: error.status });
  console.error("[reservas]", error);
  return Response.json({ error: "No se pudo completar la operación. Intenta de nuevo." }, { status: 500 });
}
