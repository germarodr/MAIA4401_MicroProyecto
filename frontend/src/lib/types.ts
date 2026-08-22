export type Category = { code: string; name: string; nameEs: string; color: string };
export type Probability = { category: string; name: string; value: number };
export type PredictionDetail = {
  predictionId: string; timestamp: string; modelVersion: string;
  predictedCategory: string; predictedName: string; confidence: number;
  latencyMs: number; status: string;
  inputMetadata: { contextWords: number; hasTitle: boolean; hasAbstract: boolean };
  actualCategory: string | null; probabilities: Probability[];
};
export type PredictionRow = {
  id: string; timestamp: string; category: string; categoryName: string;
  confidence: number; latencyMs: number; status: string; version: string;
};
