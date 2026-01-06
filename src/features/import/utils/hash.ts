import { normalizeAmount, normalizeDate, normalizeText } from "./normalize";

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export async function sha1Hash(payload: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest("SHA-1", data);
    return toHex(digest);
  }
  let hash = 0;
  for (let i = 0; i < payload.length; i += 1) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export async function buildTransactionHash(
  date: string,
  amount: number,
  description: string
) {
  const normalized = [
    normalizeDate(date),
    normalizeAmount(amount),
    normalizeText(description),
  ].join("|");
  return sha1Hash(normalized);
}
