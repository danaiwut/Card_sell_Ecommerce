export async function callInternal(path: string, body?: unknown) {
  const apiUrl = process.env.API_URL ?? "http://localhost:4000";
  const internalSecret = process.env.INTERNAL_API_SECRET ?? "dev-internal-secret";
  const res = await fetch(`${apiUrl}/internal${path}`, {
    method: "POST",
    headers: {
      "x-internal-secret": internalSecret,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`internal call ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
