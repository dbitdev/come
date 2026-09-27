import "server-only";
import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import type { RedSocial, SocialVideoSource } from "./feedSocial";

export type SocialEntityType = "restaurant" | "chef";
export type SocialPlatform = Extract<RedSocial, "instagram" | "tiktok" | "facebook">;

type StatePayload = { entityType: SocialEntityType; entityId: string; platform: SocialPlatform; uid: string; exp: number; nonce: string };
type StoredConnection = {
  entityType: SocialEntityType;
  entityId: string;
  platform: SocialPlatform;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  refreshExpiresAt?: number;
  accountId?: string;
  pageId?: string;
  pageName?: string;
};

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable privada ${name}`);
  return value;
};

const secretKey = () => createHash("sha256").update(required("SOCIAL_TOKEN_ENCRYPTION_KEY")).digest();

const encrypt = (value: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
};

const decrypt = (value: string) => {
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};

export const createSocialState = (payload: Omit<StatePayload, "exp" | "nonce">) => {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 10 * 60_000, nonce: randomBytes(16).toString("hex") })).toString("base64url");
  const signature = createHmac("sha256", required("SOCIAL_OAUTH_STATE_SECRET")).update(body).digest("base64url");
  return `${body}.${signature}`;
};

export const verifySocialState = (state: string): StatePayload => {
  const [body, signature] = state.split(".");
  if (!body || !signature) throw new Error("Estado OAuth incompleto");
  const expected = createHmac("sha256", required("SOCIAL_OAUTH_STATE_SECRET")).update(body).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new Error("Estado OAuth inválido");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as StatePayload;
  if (payload.exp < Date.now()) throw new Error("La conexión social expiró");
  return payload;
};

export const callbackUrl = (platform: SocialPlatform) =>
  `${required("NEXT_PUBLIC_APP_URL").replace(/\/$/, "")}/api/social/callback/${platform}`;

export const authorizationUrl = (platform: SocialPlatform, state: string) => {
  if (platform === "instagram") {
    const params = new URLSearchParams({
      client_id: required("INSTAGRAM_APP_ID"), redirect_uri: callbackUrl(platform), response_type: "code",
      scope: "instagram_business_basic", state, enable_fb_login: "0", force_authentication: "1",
    });
    return `https://www.instagram.com/oauth/authorize?${params}`;
  }
  if (platform === "tiktok") {
    const params = new URLSearchParams({
      client_key: required("TIKTOK_CLIENT_KEY"), redirect_uri: callbackUrl(platform), response_type: "code",
      scope: "user.info.basic,video.list", state,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  }
  const params = new URLSearchParams({
    client_id: required("FACEBOOK_APP_ID"), redirect_uri: callbackUrl(platform), response_type: "code", state,
    scope: "pages_show_list,pages_read_engagement,pages_read_user_content",
  });
  return `https://www.facebook.com/v23.0/dialog/oauth?${params}`;
};

const formPost = async (url: string, body: Record<string, string>) => {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body), cache: "no-store" });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error_description || data.error?.message || "No se pudo obtener el token social");
  return data;
};

export async function exchangeCode(platform: SocialPlatform, code: string, entity: { entityType: SocialEntityType; entityId: string }): Promise<StoredConnection> {
  if (platform === "instagram") {
    const token = await formPost("https://api.instagram.com/oauth/access_token", {
      client_id: required("INSTAGRAM_APP_ID"), client_secret: required("INSTAGRAM_APP_SECRET"),
      grant_type: "authorization_code", redirect_uri: callbackUrl(platform), code,
    });
    const longResponse = await fetch(`https://graph.instagram.com/access_token?${new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: required("INSTAGRAM_APP_SECRET"), access_token: token.access_token })}`, { cache: "no-store" });
    const longToken = longResponse.ok ? await longResponse.json() : token;
    return { ...entity, platform, accessToken: longToken.access_token, expiresAt: Date.now() + Number(longToken.expires_in || token.expires_in || 3600) * 1000, accountId: String(token.user_id || "") };
  }
  if (platform === "tiktok") {
    const token = await formPost("https://open.tiktokapis.com/v2/oauth/token/", {
      client_key: required("TIKTOK_CLIENT_KEY"), client_secret: required("TIKTOK_CLIENT_SECRET"), code,
      grant_type: "authorization_code", redirect_uri: callbackUrl(platform),
    });
    return { ...entity, platform, accessToken: token.access_token, refreshToken: token.refresh_token, accountId: token.open_id, expiresAt: Date.now() + token.expires_in * 1000, refreshExpiresAt: Date.now() + token.refresh_expires_in * 1000 };
  }
  const tokenResponse = await fetch(`https://graph.facebook.com/v23.0/oauth/access_token?${new URLSearchParams({ client_id: required("FACEBOOK_APP_ID"), client_secret: required("FACEBOOK_APP_SECRET"), redirect_uri: callbackUrl(platform), code })}`, { cache: "no-store" });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || token.error) throw new Error(token.error?.message || "No se pudo conectar Facebook");
  const pagesResponse = await fetch(`https://graph.facebook.com/v23.0/me/accounts?fields=id,name,link,access_token&access_token=${encodeURIComponent(token.access_token)}`, { cache: "no-store" });
  const pages = await pagesResponse.json();
  const collection = entity.entityType === "restaurant" ? "come" : "chefs";
  const entityData = (await adminDb.collection(collection).doc(entity.entityId).get()).data();
  const desiredFacebook = String(entityData?.socials?.facebook || entityData?.redes?.facebook || "").toLowerCase();
  const desiredHandle = desiredFacebook.split("/").filter(Boolean).pop()?.replace(/^@/, "");
  const page = (pages.data || []).find((candidate: any) => desiredHandle && String(candidate.link || "").toLowerCase().includes(desiredHandle)) || pages.data?.[0];
  if (!page) throw new Error("La cuenta no administra ninguna página de Facebook");
  return { ...entity, platform, accessToken: page.access_token, pageId: page.id, pageName: page.name, expiresAt: Date.now() + Number(token.expires_in || 3600) * 1000 };
}

const connectionId = (entityType: SocialEntityType, entityId: string, platform: SocialPlatform) => `${entityType}_${entityId}_${platform}`;

export const isSocialEntityType = (value: unknown): value is SocialEntityType =>
  value === "restaurant" || value === "chef";

export const isSocialPlatform = (value: unknown): value is SocialPlatform =>
  value === "instagram" || value === "tiktok" || value === "facebook";

export async function recordSyncError(entityType: SocialEntityType, entityId: string, platform: SocialPlatform, error: unknown) {
  const message = error instanceof Error ? error.message : "No se pudo sincronizar el contenido.";
  const collection = entityType === "restaurant" ? "come" : "chefs";
  await Promise.allSettled([
    adminDb.collection(collection).doc(entityId).set({
      [`socialStatus.${platform}`]: { connected: true, lastAttemptAt: new Date().toISOString(), error: message },
    }, { merge: true }),
    adminDb.collection("social_connections").doc(connectionId(entityType, entityId, platform)).set({
      lastAttemptAt: FieldValue.serverTimestamp(),
      lastError: message,
    }, { merge: true }),
  ]);
  return message;
}

export async function saveConnection(connection: StoredConnection) {
  await adminDb.collection("social_connections").doc(connectionId(connection.entityType, connection.entityId, connection.platform)).set({
    ...connection,
    accessToken: encrypt(connection.accessToken),
    refreshToken: connection.refreshToken ? encrypt(connection.refreshToken) : null,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function refreshTikTok(connection: StoredConnection): Promise<StoredConnection> {
  if (connection.platform !== "tiktok" || !connection.refreshToken || (connection.expiresAt || 0) > Date.now() + 5 * 60_000) return connection;
  const token = await formPost("https://open.tiktokapis.com/v2/oauth/token/", {
    client_key: required("TIKTOK_CLIENT_KEY"), client_secret: required("TIKTOK_CLIENT_SECRET"),
    grant_type: "refresh_token", refresh_token: connection.refreshToken,
  });
  const next = { ...connection, accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt: Date.now() + token.expires_in * 1000, refreshExpiresAt: Date.now() + token.refresh_expires_in * 1000 };
  await saveConnection(next);
  return next;
}

async function fetchVideos(connection: StoredConnection): Promise<SocialVideoSource[]> {
  if (connection.platform === "instagram") {
    const response = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=20&access_token=${encodeURIComponent(connection.accessToken)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || "Instagram no devolvió el feed");
    return (data.data || []).filter((item: any) => item.media_type === "VIDEO").map((item: any) => ({ url: item.permalink, videoUrl: item.media_url, thumbnail: item.thumbnail_url || item.media_url, title: item.caption || "Video de Instagram", platform: "instagram" }));
  }
  if (connection.platform === "tiktok") {
    const response = await fetch("https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,share_url,embed_link", { method: "POST", headers: { Authorization: `Bearer ${connection.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ max_count: 20 }), cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.error?.code !== "ok") throw new Error(data.error?.message || "TikTok no devolvió el feed");
    return (data.data?.videos || []).map((item: any) => ({ url: item.share_url, thumbnail: item.cover_image_url, title: item.video_description || item.title || "Video de TikTok", platform: "tiktok", embedUrl: item.embed_link }));
  }
  const response = await fetch(`https://graph.facebook.com/v23.0/${connection.pageId}/videos?fields=id,description,permalink_url,picture,source,created_time&limit=20&access_token=${encodeURIComponent(connection.accessToken)}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error?.message || "Facebook no devolvió el feed");
  return (data.data || []).map((item: any) => ({ url: item.permalink_url, videoUrl: item.source, thumbnail: item.picture, title: item.description || "Video de Facebook", platform: "facebook" }));
}

export async function syncConnection(entityType: SocialEntityType, entityId: string, platform: SocialPlatform) {
  const ref = adminDb.collection("social_connections").doc(connectionId(entityType, entityId, platform));
  const snap = await ref.get();
  if (!snap.exists) throw new Error("La red social no está conectada");
  const stored = snap.data() as StoredConnection;
  let connection: StoredConnection = { ...stored, accessToken: decrypt(stored.accessToken), refreshToken: stored.refreshToken ? decrypt(stored.refreshToken) : undefined };
  connection = await refreshTikTok(connection);
  const videos = await fetchVideos(connection);
  const collection = entityType === "restaurant" ? "come" : "chefs";
  const entityRef = adminDb.collection(collection).doc(entityId);
  const entity = await entityRef.get();
  const previous = (entity.data()?.socialVideos || []) as SocialVideoSource[];
  const otherPlatforms = previous.filter((item) => typeof item !== "object" || item.platform !== platform);
  await entityRef.update({
    socialVideos: [...otherPlatforms, ...videos],
    [`socialStatus.${platform}`]: { connected: true, lastSyncAt: new Date().toISOString(), lastAttemptAt: new Date().toISOString(), count: videos.length, error: null },
  });
  await ref.set({ lastSyncAt: FieldValue.serverTimestamp(), lastError: null }, { merge: true });
  return videos;
}
