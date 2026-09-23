"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, FileStack, Gauge, Search } from "lucide-react";
import { MonitoringCharts } from "@/components/monitoring-charts";
import { KpiCard, PageHeading, Panel, StatusBadge } from "@/components/ui";
import categories from "../../../data/categories.json";
import { listPredictions } from "@/lib/api-client";
import type { ApiPrediction } from "@/lib/api-types";
import { categoryName, localDate, monitoringSummary, percentage } from "@/lib/prediction-data";

export default function MonitoringPage() {
  const [predictions,setPredictions]=useState<ApiPrediction[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [attempt,setAttempt]=useState(0);
  const [category,setCategory]=useState("all"); const [status,setStatus]=useState("all");
  const [from,setFrom]=useState(""); const [to,setTo]=useState("");
  const [filters,setFilters]=useState({category:"all",status:"all",from:"",to:""});
  useEffect(()=>{
    const controller=new AbortController();
    listPredictions(controller.signal).then(setPredictions)
      .catch(error=>{if(!controller.signal.aborted)setError(error instanceof Error ? error.message : "No se pudo cargar el historial.");})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[attempt]);
  const filtered=useMemo(()=>predictions.filter(p=>{
    const date=localDate(p.timestamp);
    return (filters.category==="all"||p.predicted_category===filters.category)&&(filters.status==="all"||p.status===filters.status)&&(!filters.from||date>=filters.from)&&(!filters.to||date<=filters.to);
  }).sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp)),[predictions,filters]);
  const monitoring=useMemo(()=>monitoringSummary(filtered),[filtered]);
  return <div className="shell page"><PageHeading title="Monitoreo de la API" subtitle="Actividad, comportamiento y trazabilidad de las inferencias del modelo."/>
    <Panel className="filter-bar"><div className="filter-field"><label>Desde</label><input type="date" aria-label="Desde" value={from} max={to || undefined} onChange={e=>setFrom(e.target.value)}/></div><div className="filter-field"><label>Hasta</label><input type="date" aria-label="Hasta" value={to} min={from || undefined} onChange={e=>setTo(e.target.value)}/></div><div className="filter-field"><label>Categoría</label><select aria-label="Categoría" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Todas</option>{categories.map(c=><option key={c.code}>{c.code}</option>)}</select></div><div className="filter-field"><label>Estado</label><select aria-label="Estado" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Todos</option><option value="success">Éxito</option><option value="error">Error</option></select></div><button className="btn primary" disabled={!!from && !!to && from>to} onClick={()=>setFilters({category,status,from,to})}><Search size={18}/>Aplicar filtros</button></Panel>
    {loading && <p role="status">Cargando historial...</p>}
    {error && <div className="notice" role="alert">{error}<button className="btn" onClick={()=>{setError("");setLoading(true);setAttempt(value=>value+1)}}>Reintentar</button></div>}
    {!loading && !error && <><div className="kpi-grid"><KpiCard label="Peticiones" value={monitoring.requests.toLocaleString("es-CO")} icon={FileStack}/><KpiCard label="Confianza promedio" value={percentage(monitoring.averageConfidence)} icon={Gauge}/><KpiCard label="Latencia p95" value={monitoring.p95LatencyMs === null ? "—" : `${Math.round(monitoring.p95LatencyMs)} ms`} icon={Clock3} tone="green"/><KpiCard label="Tasa de error" value={monitoring.errorRate === null ? "—" : `${(monitoring.errorRate*100).toFixed(1)}%`} icon={AlertTriangle} tone="red"/></div>
    <MonitoringCharts daily={monitoring.dailyVolume} distribution={monitoring.categoryDistribution}/>
    <Panel className="table-panel"><h2>Historial de peticiones</h2><div className="table-scroll"><table className="data-table"><thead><tr><th>Fecha y hora</th><th>ID</th><th>Categoría</th><th>Confianza</th><th>Latencia</th><th>Estado</th><th>Versión</th></tr></thead><tbody>{filtered.map(p=><tr key={p.prediction_id}><td>{new Date(p.timestamp).toLocaleString("es-CO")}</td><td><Link href={`/monitoreo/${p.prediction_id}`}>{p.prediction_id}</Link></td><td><strong>{p.predicted_category ?? "—"}</strong> · {categoryName(p.predicted_category)}</td><td>{percentage(p.confidence)}</td><td>{p.latency_ms} ms</td><td><StatusBadge status={p.status}/></td><td>{p.model_version}</td></tr>)}</tbody></table></div>{filtered.length===0&&<p className="no-results">No hay peticiones para los filtros seleccionados.</p>}</Panel></>}
  </div>;
}
