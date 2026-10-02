import { esFechaValida } from "@/lib/reservas";
import { disponibilidad, responderError } from "@/lib/reservas-server";

/** Horarios de un día para N personas. Público: no expone datos de nadie. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lugarId = url.searchParams.get("lugar") || "";
    const fecha = url.searchParams.get("fecha") || "";
    const personas = Math.max(1, Math.round(Number(url.searchParams.get("personas") || 2)));
    if (!lugarId || !esFechaValida(fecha)) return Response.json({ error: "Faltan restaurante o fecha." }, { status: 400 });
    const resultado = await disponibilidad(lugarId, fecha, personas);
    return Response.json(resultado, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return responderError(error);
  }
}
