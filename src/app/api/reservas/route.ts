import { ESTADOS, esFechaValida, type EstadoReserva } from "@/lib/reservas";
import { crearReserva, esAdmin, listarReservas, puedeGestionar, responderError, usuarioDe } from "@/lib/reservas-server";
import { adminDb } from "@/lib/firebase-admin";

/** Alta de una reservación (comensal con sesión). */
export async function POST(request: Request) {
  try {
    const usuario = await usuarioDe(request);
    const entrada = await request.json().catch(() => ({}));
    const reserva = await crearReserva(usuario, entrada as Record<string, unknown>);
    return Response.json({ reserva }, { status: 201 });
  } catch (error) {
    return responderError(error);
  }
}

/**
 * Lista para el panel: un día (`fecha`) o las pendientes (`estado=pendiente`).
 * Sin `lugar` sólo la ve el admin; con `lugar`, el admin o su dueño.
 */
export async function GET(request: Request) {
  try {
    const usuario = await usuarioDe(request);
    const url = new URL(request.url);
    const lugarId = url.searchParams.get("lugar") || undefined;
    const fecha = url.searchParams.get("fecha") || undefined;
    const estadoParam = url.searchParams.get("estado") || undefined;
    const estado = estadoParam && estadoParam in ESTADOS ? (estadoParam as EstadoReserva) : undefined;
    if (fecha && !esFechaValida(fecha)) return Response.json({ error: "Fecha inválida." }, { status: 400 });
    if (!fecha && !estado) return Response.json({ error: "Indica un día o un estado." }, { status: 400 });

    if (lugarId) {
      const lugar = await adminDb.collection("come").doc(lugarId).get();
      if (!lugar.exists) return Response.json({ error: "Restaurante no encontrado." }, { status: 404 });
      if (!(await puedeGestionar(usuario, lugar.data()!))) return Response.json({ error: "No gestionas este restaurante." }, { status: 403 });
    } else if (!(await esAdmin(usuario))) {
      return Response.json({ error: "Elige uno de tus restaurantes." }, { status: 403 });
    }
    return Response.json({ reservas: await listarReservas({ lugarId, fecha, estado }) });
  } catch (error) {
    return responderError(error);
  }
}
