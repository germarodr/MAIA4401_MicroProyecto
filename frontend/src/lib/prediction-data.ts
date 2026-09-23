import categories from "../../data/categories.json";
import type { ApiPrediction } from "./api-types";

export const categoryName = (code: string | null) =>
  categories.find(category => category.code === code)?.nameEs ?? code ?? "Sin predicción";

export function predictionDetail(item: ApiPrediction) {
  return {
    predictionId: item.prediction_id,
    timestamp: item.timestamp,
    modelVersion: item.model_version,
    predictedCategory: item.predicted_category ?? "Sin predicción",
    predictedName: categoryName(item.predicted_category),
    confidence: item.confidence,
    latencyMs: item.latency_ms,
    status: item.status,
    actualCategory: item.actual_category,
    inputMetadata: {
      contextCharacters: item.citation_context_length,
      hasTitle: item.has_cited_title,
      hasAbstract: item.has_cited_abstract,
    },
    probabilities: Object.entries(item.class_probabilities ?? {})
      .map(([category, value]) => ({ category, name: categoryName(category), value }))
      .sort((a, b) => b.value - a.value),
  };
}

export function monitoringSummary(items: ApiPrediction[]) {
  const confidences = items.flatMap(item => item.status === "success" && item.confidence !== null ? [item.confidence] : []);
  const latencies = items.map(item => item.latency_ms).sort((a, b) => a - b);
  const daily = new Map<string, number>();
  for (const item of items) {
    const date = localDate(item.timestamp);
    daily.set(date, (daily.get(date) ?? 0) + 1);
  }
  return {
    requests: items.length,
    averageConfidence: confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null,
    p95LatencyMs: latencies.length ? latencies[Math.ceil(latencies.length * 0.95) - 1] : null,
    errorRate: items.length ? items.filter(item => item.status === "error").length / items.length : null,
    dailyVolume: [...daily].sort(([a], [b]) => a.localeCompare(b)).map(([date, requests]) => ({ date, requests })),
    categoryDistribution: categories.map(({ code }) => ({
      category: code, count: items.filter(item => item.predicted_category === code).length,
    })),
  };
}

export function localDate(timestamp: string) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export const percentage = (value: number | null) => value === null ? "—" : `${Math.round(value * 100)}%`;
