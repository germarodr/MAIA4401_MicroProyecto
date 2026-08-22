import { CheckCircle2, FileCheck2, Gauge, Network } from "lucide-react";
import { ConfusionMatrix, F1Chart } from "@/components/evaluation-views";
import { KpiCard, PageHeading, Panel } from "@/components/ui";
import { evaluation } from "@/lib/mock-data";

export default function EvaluationPage() {
  const labels=evaluation.classMetrics.map(item=>item.category);
  return <div className="shell page"><div className="detail-heading"><PageHeading title="Evaluación del modelo" subtitle="Desempeño del clasificador multiclase sobre datos con etiquetas reales."/><div className="evaluation-controls"><select defaultValue={evaluation.modelVersion}><option>{evaluation.modelVersion}</option></select><select defaultValue={evaluation.dataset}><option>{evaluation.dataset}</option></select></div></div>
    <div className="kpi-grid"><KpiCard label="Macro F1" value={evaluation.macroF1.toFixed(2)} icon={Gauge}/><KpiCard label="Accuracy" value={`${(evaluation.accuracy*100).toFixed(1)}%`} icon={CheckCircle2}/><KpiCard label="Micro F1" value={evaluation.microF1.toFixed(2)} icon={Network}/><KpiCard label="Registros evaluados" value={evaluation.recordCount.toLocaleString("es-CO")} icon={FileCheck2}/></div>
    <div className="evaluation-grid"><Panel><h2>Matriz de confusión (8 subáreas)</h2><ConfusionMatrix labels={labels} values={evaluation.confusionMatrix}/></Panel><Panel><h2>F1 por subárea</h2><F1Chart data={evaluation.classMetrics}/></Panel></div>
    <Panel className="metadata-table"><h2>Desempeño según disponibilidad de metadatos</h2><div className="table-scroll"><table className="data-table"><thead><tr><th>Disponibilidad</th><th>Accuracy</th><th>Macro F1</th><th>Registros</th></tr></thead><tbody>{evaluation.metadataPerformance.map(item=><tr key={item.segment}><td>{item.segment}</td><td>{(item.accuracy*100).toFixed(1)}%</td><td>{item.macroF1.toFixed(2)}</td><td>{item.records}</td></tr>)}</tbody></table></div><div className="notice"><FileCheck2 size={20}/>Métricas calculadas con etiquetas reales del conjunto de prueba.</div></Panel>
  </div>;
}
