import categoriesData from "../../data/categories.json";
import evaluationData from "../../data/evaluation.json";
import monitoringData from "../../data/monitoring-summary.json";
import predictionData from "../../data/prediction.json";
import predictionsData from "../../data/predictions.json";
import type { Category, PredictionDetail, PredictionRow } from "./types";

export const categories = categoriesData as Category[];
export const samplePrediction = predictionData as PredictionDetail;
export const predictions = predictionsData as PredictionRow[];
export const monitoring = monitoringData;
export const evaluation = evaluationData;
