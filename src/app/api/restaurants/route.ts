import { NextResponse } from "next/server";
import { isCanonicalPublicPlace } from "@/lib/utils";

type FirestoreValue = {
  nullValue?: null;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  stringValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

function decode(value: FirestoreValue): unknown {
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("stringValue" in value) return value.stringValue;
  if (value.arrayValue) return (value.arrayValue.values || []).map(decode);
  if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, entry]) => [key, decode(entry)]));
  return undefined;
}

function decodeFields(fields: Record<string, FirestoreValue> = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decode(value)]));
}

export async function GET() {
  const injected = (() => {
    try { return JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG || "{}"); } catch { return {}; }
  })();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || injected.projectId;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || injected.apiKey;
  const databaseId = process.env.NEXT_PUBLIC_FIRESTORE_DB_ID?.trim() || "(default)";
  if (!projectId || !apiKey) return NextResponse.json({ error: "Firebase no está configurado." }, { status: 503 });

  try {
    const restaurants: Array<Record<string, unknown>> = [];
    let pageToken = "";
    do {
      const params = new URLSearchParams({ pageSize: "300", key: apiKey });
      if (pageToken) params.set("pageToken", pageToken);
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(databaseId)}/documents/come?${params}`;
      const response = await fetch(url, { next: { revalidate: 300 } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Firestore no devolvió el catálogo.");
      for (const document of payload.documents || []) {
        const id = String(document.name).split("/").pop() || "";
        const restaurant: Record<string, unknown> & { status?: string } = { id, ...decodeFields(document.fields) };
        if (isCanonicalPublicPlace(id, restaurant)) restaurants.push(restaurant);
      }
      pageToken = payload.nextPageToken || "";
    } while (pageToken);
    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("No se pudo cargar el catálogo público", error);
    return NextResponse.json({ error: "No se pudo cargar el catálogo." }, { status: 502 });
  }
}
