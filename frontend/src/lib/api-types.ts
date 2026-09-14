export type ApiPrediction = {
  prediction_id: string;
  timestamp: string;
  model_version: string;
  predicted_category: string | null;
  confidence: number | null;
  class_probabilities: Record<string, number> | null;
  latency_ms: number;
  has_cited_title: boolean;
  has_cited_abstract: boolean;
  citation_context_length: number;
  status: "success" | "error";
  actual_category: string | null;
};

export type PredictionRequest = {
  citation_context: string;
  cited_title?: string | null;
  cited_abstract?: string | null;
  actual_category?: string | null;
};
