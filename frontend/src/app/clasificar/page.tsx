"use client";
import { useState } from "react";
import { AlertTriangle, Eraser, FileText, FlaskConical, ScanSearch, Trophy } from "lucide-react";
import { ProbabilityBars } from "@/components/probability-bars";
import { Panel } from "@/components/ui";
import Link from "next/link";
import { createPrediction } from "@/lib/api-client";
import { percentage, predictionDetail } from "@/lib/prediction-data";

const example = {
  context: "Convolutional neural networks have become the dominant approach for visual recognition [CIT], achieving strong results across multiple benchmark datasets.",
  title: "ImageNet Classification with Deep Convolutional Neural Networks",
  abstract: "We trained a large, deep convolutional neural network to classify high-resolution images in the ImageNet contest.",
};

export default function ClassifyPage() {
  const [fields,setFields]=useState({context:"",title:"",abstract:""});
  const [result,setResult]=useState<ReturnType<typeof predictionDetail> | null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  async function classify() {
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await createPrediction({citation_context: fields.context.trim(), cited_title: fields.title.trim() || null, cited_abstract: fields.abstract.trim() || null});
      if (response.status !== "success") throw new Error("El modelo no pudo clasificar esta cita.");
      setResult(predictionDetail(response));
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo clasificar la cita."); }
    finally { setLoading(false); }
  }
  const update=(key:keyof typeof fields,value:string)=>{setFields(current=>({...current,[key]:value}));setResult(null);setError("");};
  const clear=()=>{setFields({context:"",title:"",abstract:""});setResult(null);setError("")};
  return <div className="shell page"><div className="classify-grid">
    <Panel className="form-panel"><h1 className="panel-title"><FileText/>Clasificar una cita</h1>
      <div className="field"><label htmlFor="context">Contexto de la cita *</label><small>Pegue el texto que contiene la cita. La cita debe estar marcada con [CIT].</small><textarea id="context" rows={6} disabled={loading} value={fields.context} onChange={e=>update("context",e.target.value)} placeholder="Ejemplo: En este trabajo proponemos un nuevo enfoque... [CIT]"/></div>
      <div className="field"><label htmlFor="title">Título del artículo citado</label><input id="title" disabled={loading} value={fields.title} onChange={e=>update("title",e.target.value)} placeholder="Título completo del trabajo citado"/></div>
      <div className="field"><label htmlFor="abstract">Abstract del artículo citado</label><textarea id="abstract" rows={5} disabled={loading} value={fields.abstract} onChange={e=>update("abstract",e.target.value)} placeholder="Abstract completo del trabajo citado"/></div>
      <div className="form-actions"><button className="btn danger" disabled={loading} onClick={clear}><Eraser size={18}/>Limpiar</button><button className="btn" disabled={loading} onClick={()=>{setFields(example);setResult(null);setError("")}}><FlaskConical size={18}/>Cargar ejemplo</button><button className="btn primary" disabled={loading || !fields.context.trim()} onClick={classify}><ScanSearch size={18}/>{loading ? "Clasificando..." : "Clasificar cita"}</button></div>
    </Panel>
    <Panel className="result-panel"><h2 className="panel-title"><Trophy/>Resultado</h2>
      {error && <div className="notice" role="alert"><AlertTriangle size={20}/>{error}</div>}
      {loading && <p role="status">Procesando la cita...</p>}
      {result ? <><div className="prediction-hero"><span className="icon-bubble"><ScanSearch/></span><div><div className="target">{result.predictedCategory}</div><h3>{result.predictedName}</h3></div><div className="confidence"><span>Confianza</span><strong>{percentage(result.confidence)}</strong></div></div><h3>Probabilidades por subárea (arXiv CS)</h3><ProbabilityBars items={result.probabilities}/><div className="notice"><AlertTriangle size={20}/>La confianza no equivale a exactitud validada.</div><Link className="btn" href={`/monitoreo/${result.predictionId}`}>Ver detalle de la petición</Link></> : <div className="empty-result"><ScanSearch size={54}/><h3>Resultado de la clasificación</h3><p>Complete el contexto y seleccione “Clasificar cita” para obtener la predicción del modelo.</p></div>}
    </Panel>
  </div></div>;
}
