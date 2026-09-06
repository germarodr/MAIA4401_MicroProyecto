import { Box, CheckCircle2, Database, FileCheck2, Gauge, Info, Network, TriangleAlert } from "lucide-react";
import { ConfusionMatrix, F1Chart } from "@/components/evaluation-views";
import { KpiCard, PageHeading, Panel } from "@/components/ui";
import { evaluation } from "@/lib/mock-data";
import styles from "./evaluation.module.css";

const metric = (value: number) => `${(value * 100).toLocaleString("es-CO", {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
})} %`;

export default function EvaluationPage() {
  // Matrix order stays fixed; only the class bar chart is sorted by F1.
  const labels = evaluation.classMetrics.map((item) => item.category);
  const correct = evaluation.confusionMatrix.reduce((sum, row, i) => sum + row[i], 0);
  const support = evaluation.classMetrics[0].support;
  const protocol = evaluation.protocol;
  const total = protocol.train + protocol.validation + protocol.test;
  return (
    <div className={`shell page ${styles.page}`}>
      <div className={styles.heading}>
        <PageHeading title="Evaluación del modelo" subtitle={`Resultados de ${evaluation.modelName} sobre el conjunto de test reservado.`} />
        <div className={styles.context}>
          <div className={styles.contextCard} title={evaluation.modelUri}>
            <Box size={26} aria-hidden="true" />
            <div><small>Modelo registrado</small><strong>{evaluation.modelName} · versión {evaluation.modelVersion}</strong></div>
            <span className={styles.badge}>{evaluation.modelAlias}</span>
          </div>
          <div className={styles.contextCard}>
            <Database size={26} aria-hidden="true" />
            <div><strong>{evaluation.dataset} · {evaluation.recordCount} registros</strong><small>{support} por clase</small></div>
          </div>
        </div>
      </div>
      <div className="kpi-grid">
        <KpiCard label="Macro F1" value={metric(evaluation.macroF1)} note="Promedio por subárea" icon={Gauge} />
        <KpiCard label="Accuracy" value={metric(evaluation.accuracy)} note={`${correct} de ${evaluation.recordCount} predicciones correctas`} icon={CheckCircle2} />
        <KpiCard label="Weighted F1" value={metric(evaluation.weightedF1)} note="F1 ponderado por soporte" icon={Network} />
        <KpiCard label="Registros evaluados" value={evaluation.recordCount.toLocaleString("es-CO")} note={`${labels.length} clases · ${support} registros por clase`} icon={FileCheck2} />
      </div>
      <div className={styles.grid}>
        <Panel className={styles.matrixPanel}>
          <h2>Matriz de confusión · Test</h2>
          <ConfusionMatrix labels={labels} values={evaluation.confusionMatrix} />
          <p className={styles.caption}>Cada fila suma {support} registros. Filas: clase real; columnas: clase predicha.</p>
          <div className={styles.insight}><Info size={22} aria-hidden="true" /><div><strong>Mayor dificultad: cs.AI y cs.LG</strong><p>Confusión principal: cs.AI → cs.LG (22 casos)</p></div></div>
        </Panel>
        <div className={styles.side}>
          <Panel className={styles.chartPanel}>
            <h2>F1 por subárea · Test</h2>
            <F1Chart data={evaluation.classMetrics} />
          </Panel>
          <Panel className={styles.comparison}>
            <h2>Comparación de modelos · Validación</h2>
            <div className="table-scroll">
              <table className={styles.comparisonTable} aria-label="Resultados de validación de los ocho modelos">
                <thead><tr><th scope="col">Modelo</th><th scope="col">Macro F1 val</th><th scope="col">Accuracy val</th></tr></thead>
                <tbody>{evaluation.validationModels.map((model) => (
                  <tr key={model.id} className={model.selected ? styles.selected : undefined}>
                    <th scope="row">{model.name}{model.selected && <small>Seleccionado</small>}</th>
                    <td>{metric(model.macroF1)}</td><td>{metric(model.accuracy)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <p className={styles.caption}>Modelo seleccionado: SciBERT Plus. Ensamble: mejor validación, no desplegado.</p>
          </Panel>
        </div>
      </div>
      <div className={styles.notes}>
        <div className={styles.note}><Info size={22} aria-hidden="true" /><p>Partición {[protocol.train, protocol.validation, protocol.test].map((count) => 100 * count / total).join("/")} por artículo citante · Semilla {protocol.seed} · Test evaluado una sola vez.</p></div>
        <div className={`${styles.note} ${styles.warning}`}><TriangleAlert size={22} aria-hidden="true" /><p>Limitación: {(protocol.citedWorkOverlap * 100).toLocaleString("es-CO", { maximumFractionDigits: 1 })} % de registros de test comparte alguna obra citada con entrenamiento.</p></div>
      </div>
      <p className={styles.source}>Fuente: {evaluation.source}. Consulta a MLflow pendiente de integración.</p>
    </div>
  );
}
