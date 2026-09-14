import type { ApiPrediction, PredictionRequest } from "./api-types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, { ...init, cache: "no-store" });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(typeof body.detail === "string" ? body.detail : "No se pudo completar la solicitud. Revise los datos enviados.");
  }
  return body as T;
}

export const listPredictions = (signal?: AbortSignal) => request<ApiPrediction[]>("predictions", { signal });
export const createPrediction = (input: PredictionRequest) => request<ApiPrediction>("predictions", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
});
