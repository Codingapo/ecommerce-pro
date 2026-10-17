import { createHmac, timingSafeEqual } from "node:crypto";
export function unsubscribeToken(id: string, secret: string) {
  return `${id}.${createHmac("sha256", secret).update(`unsubscribe:${id}`).digest("hex")}`;
}
export function validateUnsubscribe(
  token: string,
  secret: string,
): string | null {
  const [id, sig, ...extra] = token.split(".");
  if (
    extra.length ||
    !id ||
    !/^[a-f0-9-]{36}$/i.test(id) ||
    !sig ||
    !/^[a-f0-9]{64}$/i.test(sig)
  )
    return null;
  const expected = unsubscribeToken(id, secret).split(".")[1];
  return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))
    ? id
    : null;
}
