import { configCompleta, guardarConfig, lugaresDe, nombreLugar, puedeGestionar, responderError, usuarioDe } from "@/lib/reservas-server";
import { adminDb } from "@/lib/firebase-admin";

/**
 * Sin `lugar`: los restaurantes que gestiona quien pregunta (todos si es admin).
 * Con `lugar`: su configuración completa de reservaciones.
 */
export async function GET(request: Request) {
  try {
    const usuario = await usuarioDe(request);
    const lugarId = new URL(request.url).searchParams.get("lugar");
    if (!lugarId) return Response.json(await lugaresDe(usuario));
    const lugar = await adminDb.collection("come").doc(lugarId).get();
    if (!lugar.exists) return Response.json({ error: "Restaurante no encontrado." }, { status: 404 });
    if (!(await puedeGestionar(usuario, lugar.data()!))) return Response.json({ error: "No gestionas este restaurante." }, { status: 403 });
    return Response.json({ id: lugar.id, nombre: nombreLugar(lugar.data()!), config: await configCompleta(lugar.id, lugar.data()!) });
  } catch (error) {
    return responderError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const usuario = await usuarioDe(request);
    const { lugarId, config } = (await request.json().catch(() => ({}))) as { lugarId?: string; config?: unknown };
    if (!lugarId) return Response.json({ error: "Falta el restaurante." }, { status: 400 });
    const lugar = await adminDb.collection("come").doc(lugarId).get();
    if (!lugar.exists) return Response.json({ error: "Restaurante no encontrado." }, { status: 404 });
    if (!(await puedeGestionar(usuario, lugar.data()!))) return Response.json({ error: "No gestionas este restaurante." }, { status: 403 });
    return Response.json({ config: await guardarConfig(lugarId, config) });
  } catch (error) {
    return responderError(error);
  }
}
