// The browser uses the Next.js origin; only the server contacts FastAPI.
export async function proxyApi(path: "predictions" | "health", request?: Request) {
  try {
    const base = (process.env.CITESCOPE_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
    const response = await fetch(`${base}/${path}`, {
      method: request?.method ?? "GET",
      headers: { "Content-Type": "application/json" },
      body: request?.method === "POST" ? await request.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ detail: "No se pudo conectar con CiteScope API. Compruebe que el servicio esté activo y que el modelo esté cargado." }, { status: 503 });
  }
}
