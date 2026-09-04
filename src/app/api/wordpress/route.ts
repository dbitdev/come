import { NextResponse } from "next/server";

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const ALLOWED_OPERATIONS = /query\s+(GetLatestNews|GetPostBySlug|SearchArticles)\b/;

export async function POST(request: Request) {
  if (!WORDPRESS_API_URL) {
    return NextResponse.json({ data: null }, { status: 503 });
  }

  try {
    const body = await request.json();
    const query = typeof body?.query === "string" ? body.query : "";

    if (!query || query.length > 10_000 || !ALLOWED_OPERATIONS.test(query)) {
      return NextResponse.json({ error: "Operación no permitida" }, { status: 400 });
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.WORDPRESS_AUTH_REFRESH_TOKEN) {
      headers.Authorization = `Bearer ${process.env.WORDPRESS_AUTH_REFRESH_TOKEN}`;
    }

    const response = await fetch(WORDPRESS_API_URL, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ query, variables: body?.variables || {} }),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ data: null }, { status: 502 });
    }

    return NextResponse.json(await response.json(), {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" },
    });
  } catch {
    return NextResponse.json({ data: null }, { status: 502 });
  }
}
