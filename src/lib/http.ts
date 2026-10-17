import "server-only";
import { ZodError } from "zod";
import { siteUrl } from "@/lib/env";
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(siteUrl()).origin)
    throw new AppError(403, "Invalid request origin.");
}
export function failure(error: unknown) {
  if (error instanceof ZodError)
    return Response.json(
      {
        error: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  if (error instanceof AppError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error(
    "Request failed",
    error instanceof Error ? error.message : "Database or provider error",
  );
  return Response.json(
    { error: "We couldn't complete that request. Please try again." },
    { status: 500 },
  );
}
export function checked<R extends { data: unknown; error: unknown }>(
  result: R,
): Extract<R, { error: null }>["data"] {
  if (result.error !== null) throw new Error("Database operation failed");
  return result.data as Extract<R, { error: null }>["data"];
}
