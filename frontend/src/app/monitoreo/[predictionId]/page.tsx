import Link from "next/link";
import { ArrowLeft, CheckCircle2, Gauge, ScanSearch } from "lucide-react";
import { ProbabilityBars } from "@/components/probability-bars";
import { Panel, StatusBadge } from "@/components/ui";
import { samplePrediction } from "@/lib/mock-data";

export default async function PredictionDetailPage({params}:{params:Promise<{predictionId:string}>}) {
  const {predictionId}=await params; const item={...samplePrediction,predictionId};
  return <div className="shell page"><div className="breadcrumb">Monitoreo / Detalle de petición</div><div className="detail-heading"><div><h1>Detalle de {item.predictionId}</h1><StatusBadge status={item.status}/></div><Link className="btn" href="/monitoreo"><ArrowLeft size={18}/>Volver al historial</Link></div>
    <div className="summary-grid"><Panel className="summary-card"><span>Predicción</span><strong>{item.predictedCategory}</strong><small>{item.predictedName}</small></Panel><Panel className="summary-card"><span>Confianza</span><strong>{Math.round(item.confidence*100)}%</strong></Panel><Panel className="summary-card"><span>Latencia</span><strong>{item.latencyMs} ms</strong></Panel><Panel className="summary-card"><span>Modelo</span><strong>{item.modelVersion}</strong></Panel></div>
    <div className="detail-grid"><Panel><h2>Distribución de probabilidad por categoría</h2><ProbabilityBars items={item.probabilities}/></Panel><Panel><h2>Información de la entrada</h2><div className="meta-list"><div className="meta-item"><span>Contexto</span><strong>{item.inputMetadata.contextWords} palabras</strong></div><div className="meta-item"><span>Título</span><strong>{item.inputMetadata.hasTitle?"Disponible":"No disponible"}</strong></div><div className="meta-item"><span>Abstract</span><strong>{item.inputMetadata.hasAbstract?"Disponible":"No disponible"}</strong></div><div className="meta-item"><span>Fecha y hora</span><strong>{new Date(item.timestamp).toLocaleString("es-CO")}</strong></div></div><div className="validation"><strong>Resultado aún no validado</strong><p>La retroalimentación permitirá medir y mejorar el desempeño.</p></div><div className="validation-actions"><button className="btn"><CheckCircle2 size={18}/>La predicción es correcta</button><button className="btn primary"><ScanSearch size={18}/>Corregir categoría</button></div></Panel></div>
    <div className="notice"><Gauge size={20}/>La confianza indica qué tan seguro está el modelo, no su exactitud real. La exactitud requiere una etiqueta validada.</div>
  </div>;
}
