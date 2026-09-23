"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gauge } from "lucide-react";
import { ProbabilityBars } from "@/components/probability-bars";
import { Panel, StatusBadge } from "@/components/ui";
import { listPredictions } from "@/lib/api-client";
import { percentage, predictionDetail } from "@/lib/prediction-data";

export default function PredictionDetailPage({params}:{params:Promise<{predictionId:string}>}) {
  const {predictionId}=use(params);
  const [item,setItem]=useState<ReturnType<typeof predictionDetail> | null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const controller = new AbortController();
    listPredictions(controller.signal).then(items=>{
      const found=items.find(item=>item.prediction_id===predictionId);
      setItem(found ? predictionDetail(found) : null);
    }).catch(error=>{if(!controller.signal.aborted)setError(error instanceof Error ? error.message : "No se pudo cargar la petición.");})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[predictionId,attempt]);
  if(loading) return <div className="shell page" role="status">Cargando petición...</div>;
  if(error || !item) return <div className="shell page"><Panel><h1>{error ? "No se pudo cargar la petición" : "Petición no encontrada"}</h1>{error && <p role="alert">{error}</p>}{error && <button className="btn" onClick={()=>{setLoading(true);setError("");setAttempt(value=>value+1)}}>Reintentar</button>}<Link className="btn" href="/monitoreo">Volver al historial</Link></Panel></div>;
  return <div className="shell page"><div className="breadcrumb">Monitoreo / Detalle de petición</div><div className="detail-heading"><div><h1>Detalle de {item.predictionId}</h1><StatusBadge status={item.status}/></div><Link className="btn" href="/monitoreo"><ArrowLeft size={18}/>Volver al historial</Link></div>
    <div className="summary-grid"><Panel className="summary-card"><span>Predicción</span><strong>{item.predictedCategory}</strong><small>{item.predictedName}</small></Panel><Panel className="summary-card"><span>Confianza</span><strong>{percentage(item.confidence)}</strong></Panel><Panel className="summary-card"><span>Latencia</span><strong>{item.latencyMs} ms</strong></Panel><Panel className="summary-card"><span>Modelo</span><strong>{item.modelVersion}</strong></Panel></div>
    <div className="detail-grid"><Panel><h2>Distribución de probabilidad por categoría</h2>{item.probabilities.length ? <ProbabilityBars items={item.probabilities}/> : <p>No hay probabilidades disponibles para esta petición.</p>}</Panel><Panel><h2>Información de la entrada</h2><div className="meta-list"><div className="meta-item"><span>Contexto</span><strong>{item.inputMetadata.contextCharacters} caracteres</strong></div><div className="meta-item"><span>Título</span><strong>{item.inputMetadata.hasTitle?"Disponible":"No disponible"}</strong></div><div className="meta-item"><span>Abstract</span><strong>{item.inputMetadata.hasAbstract?"Disponible":"No disponible"}</strong></div><div className="meta-item"><span>Fecha y hora</span><strong>{new Date(item.timestamp).toLocaleString("es-CO")}</strong></div></div><div className="validation"><strong>{item.actualCategory ? `Categoría real: ${item.actualCategory}` : "Resultado aún no validado"}</strong><p>La API actual no permite registrar ni corregir la categoría después de crear la petición.</p></div></Panel></div>
    <div className="notice"><Gauge size={20}/>La confianza indica qué tan seguro está el modelo, no su exactitud real. La exactitud requiere una etiqueta validada.</div>
  </div>;
}
