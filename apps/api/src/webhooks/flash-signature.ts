import { createHash, timingSafeEqual } from "crypto";

export function signFlashParams(params: Record<string, unknown>, apiKey: string) {
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

export function verifyFlashParams(params: Record<string, unknown>, apiKey: string) {
  const actual = String(params.sign ?? "").toUpperCase();
  if (!actual) return false;
  const expected = signFlashParams(params, apiKey);
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function isBlank(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim().length === 0)
  );
}
