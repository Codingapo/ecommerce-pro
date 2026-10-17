export async function api<T = Record<string, unknown>>(
  path: string,
  body?: unknown,
  method = "POST",
): Promise<T> {
  const isForm = body instanceof FormData;
  const result = await fetch(path, {
    method,
    headers: isForm ? {} : { "Content-Type": "application/json" },
    ...(body !== undefined
      ? { body: isForm ? body : JSON.stringify(body) }
      : {}),
  });
  const data = await result
    .json()
    .catch(() => ({ error: "The server could not complete this request." }));
  if (!result.ok) throw new Error(data.error || "Request failed");
  return data as T;
}
