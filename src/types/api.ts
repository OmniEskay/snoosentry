import type { Signal } from "./signal.js";
export interface SignalRequest {
  u: string;
}

export type SignalResponse = Signal;

export interface HealthResponse {
  status: "ok";
  app:    string;
  env:    string;
}

export interface APIError {
  error:   string;
  detail?: string;
  retryAfterMs?: number;
}
export function isAPIError(body: unknown): body is APIError {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as APIError).error === "string"
  );
}