import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

// Load the actual TypeScript modules, with isolated fetch/environment for each test.
function load(name, globals = {}) {
  const url = new URL(`../src/lib/${name}.ts`, import.meta.url);
  const exports = {};
  const source = ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    exports, require: createRequire(url), Response, AbortSignal,
    process: { env: {} }, ...globals,
  }, { filename: fileURLToPath(url) });
  return exports;
}

const prediction = {
  prediction_id: "a5fb8009-9b82-4b92-9664-c09c0b5f082d",
  timestamp: "2026-09-14T12:00:00Z", model_version: "SciBERT-Plus-v1-checkpoint900",
  predicted_category: "cs.CV", confidence: 0.8,
  class_probabilities: { "cs.AI": 0.2, "cs.CV": 0.8 }, latency_ms: 100,
  has_cited_title: true, has_cited_abstract: false, citation_context_length: 150,
  status: "success", actual_category: null,
};

test("adapts the real response, including character count and ranked probabilities", () => {
  const { predictionDetail } = load("prediction-data");
  const detail = predictionDetail(prediction);
  assert.equal(detail.predictionId, prediction.prediction_id);
  assert.equal(detail.inputMetadata.contextCharacters, 150);
  assert.equal(detail.inputMetadata.hasAbstract, false);
  assert.equal(detail.probabilities[0].category, "cs.CV");
  assert.equal(detail.probabilities[0].value, 0.8);
  assert.ok(detail.predictedName.includes("Visión"));
});

test("keeps failed predictions nullable and handles an empty history", () => {
  const { predictionDetail, monitoringSummary, percentage } = load("prediction-data");
  const detail = predictionDetail({ ...prediction, status: "error", predicted_category: null, confidence: null, class_probabilities: null });
  assert.equal(detail.confidence, null);
  assert.equal(detail.probabilities.length, 0);
  assert.equal(percentage(null), "—");
  const summary = monitoringSummary([]);
  assert.equal(summary.requests, 0);
  assert.equal(summary.averageConfidence, null);
  assert.equal(summary.p95LatencyMs, null);
  assert.equal(summary.errorRate, null);
});

test("aggregates observed requests, successful confidence and nearest-rank p95", () => {
  const { monitoringSummary } = load("prediction-data");
  const rows = Array.from({ length: 20 }, (_, i) => ({ ...prediction, latency_ms: i + 1 }));
  rows[0] = { ...rows[0], status: "error", confidence: null, predicted_category: null };
  const summary = monitoringSummary(rows);
  assert.equal(summary.requests, 20);
  assert.ok(Math.abs(summary.averageConfidence - 0.8) < 1e-10);
  assert.equal(summary.p95LatencyMs, 19);
  assert.equal(summary.errorRate, 0.05);
  assert.equal(summary.dailyVolume[0].requests, 20);
  assert.equal(summary.categoryDistribution.find(row => row.category === "cs.CV").count, 19);
});

test("POST forwards the contract to the configured backend and preserves 201", async () => {
  const input = { citation_context: "Example [CIT]", cited_title: null, cited_abstract: null };
  const { proxyApi } = load("api-proxy", {
    process: { env: { CITESCOPE_API_URL: "http://backend:8000/" } },
    fetch: async (url, init) => {
      assert.equal(url, "http://backend:8000/predictions");
      assert.equal(init.method, "POST");
      assert.equal(init.cache, "no-store");
      assert.deepEqual(JSON.parse(init.body), input);
      return Response.json(prediction, { status: 201 });
    },
  });
  const response = await proxyApi("predictions", new Request("http://localhost/api/predictions", { method: "POST", body: JSON.stringify(input) }));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), prediction);
});

test("GET forwards history and health; API errors retain their HTTP status", async () => {
  for (const [path, status, body] of [
    ["predictions", 200, [prediction]], ["health", 200, { status: "ok", model_loaded: true, model_version: prediction.model_version }],
    ["predictions", 500, { detail: "Error al ejecutar la inferencia del modelo." }],
    ["predictions", 422, { detail: [{ msg: "Field required" }] }],
  ]) {
    const { proxyApi } = load("api-proxy", { fetch: async (url, init) => {
      assert.equal(url, `http://127.0.0.1:8000/${path}`);
      assert.equal(init.method, "GET");
      return Response.json(body, { status });
    } });
    const response = await proxyApi(path);
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), body);
  }
});

test("unavailable backend produces a visible 503 instead of dummy predictions", async () => {
  const { proxyApi } = load("api-proxy", { fetch: async () => { throw new Error("ECONNREFUSED"); } });
  const response = await proxyApi("predictions");
  assert.equal(response.status, 503);
  assert.match((await response.json()).detail, /No se pudo conectar/);
});

test("browser client serializes requests and surfaces backend validation errors", async () => {
  const input = { citation_context: "Example [CIT]", cited_title: null };
  const client = load("api-client", { fetch: async (url, init) => {
    assert.equal(url, "/api/predictions");
    assert.deepEqual(JSON.parse(init.body), input);
    return Response.json(prediction, { status: 201 });
  } });
  assert.deepEqual(await client.createPrediction(input), prediction);
  for (const detail of ["Error al ejecutar la inferencia del modelo.", [{ msg: "Field required" }]]) {
    const client = load("api-client", { fetch: async () => Response.json({ detail }, { status: 422 }) });
    await assert.rejects(client.listPredictions(), /Error al ejecutar|Revise los datos/);
  }
});
