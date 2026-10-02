import { doc, getDocFromServer, waitForPendingWrites, type Firestore } from "firebase/firestore";

/**
 * Lee el rol (`admin` | `curator` | '') de la ficha users/{uid} de forma robusta.
 *
 * El problema que resuelve: AuthContext escribe la ficha básica (nombre, correo,
 * foto, últimoAcceso) en cada inicio de sesión. Si el rol lo asignó el admin
 * desde otro equipo, el caché local de este navegador nunca lo tuvo, así que esa
 * escritura pendiente enmascara el valor del servidor —incluso `getDocFromServer`
 * devuelve la ficha sin rol mientras la escritura no se confirma—. Esperar a que
 * las escrituras locales se confirmen y reintentar da el rol real.
 */
export async function leerRolDeUsuario(db: Firestore, uid: string): Promise<string> {
    const ref = doc(db, "users", uid);
    const conTimeout = <T,>(p: Promise<T>, ms: number) =>
        Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
    for (let intento = 0; intento < 5; intento++) {
        try {
            await conTimeout(waitForPendingWrites(db), 4000).catch(() => {});
            const snap = await conTimeout(getDocFromServer(ref), 4000) as {
                data(): Record<string, unknown> | undefined;
                metadata?: { hasPendingWrites?: boolean };
            };
            const rol = (snap.data()?.role as string) || '';
            // Rol encontrado, o lectura limpia (sin overlay pendiente) = veredicto final.
            if (rol || !snap.metadata?.hasPendingWrites) return rol;
        } catch { /* colgado o sin permiso: reintentar */ }
        await new Promise(r => setTimeout(r, 700));
    }
    return '';
}
