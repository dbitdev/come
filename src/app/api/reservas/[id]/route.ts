import { ESTADOS, type EstadoReserva } from "@/lib/reservas";
import { cambiarEstado, responderError, usuarioDe } from "@/lib/reservas-server";

/** Cambia el estado: el comensal cancela lo suyo; admin o dueño gestionan. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await usuarioDe(request);
    const { id } = await context.params;
    const { estado } = (await request.json().catch(() => ({}))) as { estado?: string };
    if (!estado || !(estado in ESTADOS)) return Response.json({ error: "Estado inválido." }, { status: 400 });
    const reserva = await cambiarEstado(usuario, id, estado as EstadoReserva);
    return Response.json({ reserva });
  } catch (error) {
    return responderError(error);
  }
}
