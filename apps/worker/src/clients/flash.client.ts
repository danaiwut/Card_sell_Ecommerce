import { createHash } from "crypto";

export async function fetchFlashTrackingRoute(trackingNumber: string) {
  const mchId = process.env.FLASH_MCH_ID;
  const apiKey = process.env.FLASH_API_KEY;
  const baseUrl = process.env.FLASH_API_BASE_URL ?? "https://open-api.flashexpress.com";
  if (!mchId || !apiKey) {
    console.warn("[worker] Flash courier is not configured; reconciliation skipped.");
    return null;
  }

  const params: Record<string, string> = {
    mchId,
    nonceStr: String(Date.now()),
  };
  params.sign = signFlashParams(params, apiKey);

  const res = await fetch(`${baseUrl}/open/v1/orders/${encodeURIComponent(trackingNumber)}/routes`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
      "accept-language": "th",
    },
    body: new URLSearchParams(params),
  });
  if (!res.ok) {
    throw new Error(`Flash routes API failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { code: number; message?: string; data?: unknown };
  if (json.code !== 1) {
    throw new Error(`Flash routes API error: ${json.code} ${json.message ?? ""}`.trim());
  }
  return json.data ?? null;
}

function signFlashParams(params: Record<string, unknown>, apiKey: string) {
  const stringA = Object.entries(params)
    .filter(([key, value]) => key !== "sign" && !isBlank(value))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("&");
  return createHash("sha256")
    .update(`${stringA}&key=${apiKey}`)
    .digest("hex")
    .toUpperCase();
}

function isBlank(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim().length === 0)
  );
}
