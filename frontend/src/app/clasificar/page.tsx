"use client";
import { useState } from "react";
import { AlertTriangle, Eraser, FileText, FlaskConical, ScanSearch, Trophy } from "lucide-react";
import { ProbabilityBars } from "@/components/probability-bars";
import { Panel } from "@/components/ui";
import { samplePrediction } from "@/lib/mock-data";

const example = {
  context: "Convolutional neural networks have become the dominant approach for visual recognition [CIT], achieving strong results across multiple benchmark datasets.",
  title: "ImageNet Classification with Deep Convolutional Neural Networks",
  abstract: "We trained a large, deep convolutional neural network to classify high-resolution images in the ImageNet contest.",
};

export default function ClassifyPage() {
  const [fields,setFields]=useState({context:"",title:"",abstract:""});
  const [showResult,setShowResult]=useState(false);
  const update=(key:keyof typeof fields,value:string)=>setFields(current=>({...current,[key]:value}));
  const clear=()=>{setFields({context:"",title:"",abstract:""});setShowResult(false)};
  return <div className="shell page"><div className="classify-grid">
    <Panel className="form-panel"><h1 className="panel-title"><FileText/>Clasificar una cita</h1>
      <div className="field"><label htmlFor="context">Contexto de la cita *</label><small>Pegue el texto que contiene la cita. La cita debe estar marcada con [CIT].</small><textarea id="context" rows={6} value={fields.context} onChange={e=>update("context",e.target.value)} placeholder="Ejemplo: En este trabajo proponemos un nuevo enfoque... [CIT]"/></div>
      <div className="field"><label htmlFor="title">Título del artículo citado</label><input id="title" value={fields.title} onChange={e=>update("title",e.target.value)} placeholder="Título completo del trabajo citado"/></div>
      <div className="field"><label htmlFor="abstract">Abstract del artículo citado</label><textarea id="abstract" rows={5} value={fields.abstract} onChange={e=>update("abstract",e.target.value)} placeholder="Abstract completo del trabajo citado"/></div>
      <div className="form-actions"><button className="btn danger" onClick={clear}><Eraser size={18}/>Limpiar</button><button className="btn" onClick={()=>setFields(example)}><FlaskConical size={18}/>Cargar ejemplo</button><button className="btn primary" disabled={!fields.context.trim()} onClick={()=>setShowResult(true)}><ScanSearch size={18}/>Clasificar cita</button></div>
    </Panel>
    <Panel className="result-panel"><h2 className="panel-title"><Trophy/>Resultado</h2>
      {showResult ? <><div className="prediction-hero"><span className="icon-bubble"><ScanSearch/></span><div><div className="target">{samplePrediction.predictedCategory}</div><h3>{samplePrediction.predictedName}</h3></div><div className="confidence"><span>Confianza</span><strong>{Math.round(samplePrediction.confidence*100)}%</strong></div></div><h3>Probabilidades por subárea (arXiv CS)</h3><ProbabilityBars items={samplePrediction.probabilities}/><div className="notice"><AlertTriangle size={20}/>La confianza no equivale a exactitud validada.</div></> : <div className="empty-result"><ScanSearch size={54}/><h3>Resultado de la clasificación</h3><p>Complete el contexto y seleccione “Clasificar cita” para ver una respuesta simulada de la futura API.</p></div>}
    </Panel>
  </div></div>;
}
