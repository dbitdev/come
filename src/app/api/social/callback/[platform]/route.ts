import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { exchangeCode, saveConnection, syncConnection, verifySocialState, type SocialPlatform } from "@/lib/social-server";

const ADMIN_EMAILS = new Set(["dbitdev@gmail.com", "admin@come.mx", "parradabito@gmail.com"]);

export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
  let returnPath = "/perfil";
  try {
    const { platform: rawPlatform } = await params;
    const platform = rawPlatform as SocialPlatform;
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const stateValue = url.searchParams.get("state");
    if (!code || !stateValue) throw new Error(url.searchParams.get("error_description") || "La plataforma no devolvió autorización.");
    const state = verifySocialState(stateValue);
    if (state.platform !== platform) throw new Error("La plataforma no coincide con la conexión solicitada.");
    returnPath = state.entityType === "restaurant" ? `/gestiona-negocio/${state.entityId}` : `/admin`;

    const entityCollection = state.entityType === "restaurant" ? "come" : "chefs";
    const [user, entity] = await Promise.all([adminAuth.getUser(state.uid), adminDb.collection(entityCollection).doc(state.entityId).get()]);
    const isAdmin = Boolean(user.email && ADMIN_EMAILS.has(user.email));
    if (!entity.exists || (!isAdmin && entity.data()?.userId !== state.uid)) throw new Error("Ya no tienes acceso a este perfil.");

    const connection = await exchangeCode(platform, code, { entityType: state.entityType, entityId: state.entityId });
    await saveConnection(connection);
    const videos = await syncConnection(state.entityType, state.entityId, platform);
    return NextResponse.redirect(`${appUrl}${returnPath}?social=${platform}&connected=1&videos=${videos.length}`);
  } catch (error) {
    console.error("Callback social falló", error);
    const message = encodeURIComponent(error instanceof Error ? error.message : "No se pudo conectar la cuenta.");
    return NextResponse.redirect(`${appUrl}${returnPath}?social_error=${message}`);
  }
}
