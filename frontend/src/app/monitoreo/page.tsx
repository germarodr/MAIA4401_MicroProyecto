"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, Clock3, FileStack, Gauge, Search } from "lucide-react";
import { MonitoringCharts } from "@/components/monitoring-charts";
import { KpiCard, PageHeading, Panel, StatusBadge } from "@/components/ui";
import { categories, monitoring, predictions } from "@/lib/mock-data";

export default function MonitoringPage() {
  const [category,setCategory]=useState("all"); const [status,setStatus]=useState("all");
  const filtered=useMemo(()=>predictions.filter(p=>(category==="all"||p.category===category)&&(status==="all"||p.status===status)),[category,status]);
  return <div className="shell page"><PageHeading title="Monitoreo de la API" subtitle="Actividad, comportamiento y trazabilidad de las inferencias del modelo."/>
    <Panel className="filter-bar"><div className="filter-field"><label>Desde</label><input type="date" defaultValue={monitoring.period.from}/></div><div className="filter-field"><label>Hasta</label><input type="date" defaultValue={monitoring.period.to}/></div><div className="filter-field"><label>Categoría</label><select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Todas</option>{categories.map(c=><option key={c.code}>{c.code}</option>)}</select></div><div className="filter-field"><label>Estado</label><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Todos</option><option value="success">Éxito</option><option value="error">Error</option></select></div><button className="btn primary"><Search size={18}/>Aplicar filtros</button></Panel>
    <div className="kpi-grid"><KpiCard label="Peticiones" value={monitoring.kpis.requests.toLocaleString("es-CO")} note="↑ 18,4% vs. periodo anterior" icon={FileStack}/><KpiCard label="Confianza promedio" value={`${Math.round(monitoring.kpis.averageConfidence*100)}%`} note="↑ 4,6% vs. periodo anterior" icon={Gauge}/><KpiCard label="Latencia p95" value={`${monitoring.kpis.p95LatencyMs} ms`} note="↓ 11,2% vs. periodo anterior" icon={Clock3} tone="green"/><KpiCard label="Tasa de error" value={`${(monitoring.kpis.errorRate*100).toFixed(1)}%`} note="↓ 0,4 p.p." icon={AlertTriangle} tone="red"/></div>
    <MonitoringCharts daily={monitoring.dailyVolume} distribution={monitoring.categoryDistribution}/>
    <Panel className="table-panel"><h2>Historial de peticiones</h2><div className="table-scroll"><table className="data-table"><thead><tr><th>Fecha y hora</th><th>ID</th><th>Categoría</th><th>Confianza</th><th>Latencia</th><th>Estado</th><th>Versión</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td>{new Date(p.timestamp).toLocaleString("es-CO")}</td><td><Link href={`/monitoreo/${p.id}`}>{p.id}</Link></td><td><strong>{p.category}</strong> · {p.categoryName}</td><td>{Math.round(p.confidence*100)}%</td><td>{p.latencyMs} ms</td><td><StatusBadge status={p.status}/></td><td>{p.version}</td></tr>)}</tbody></table></div>{filtered.length===0&&<p className="no-results">No hay peticiones para los filtros seleccionados.</p>}</Panel>
  </div>;
}
