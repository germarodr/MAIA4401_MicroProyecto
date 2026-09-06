"use client";
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export function MonitoringCharts({daily,distribution}:{daily:{date:string;requests:number}[];distribution:{category:string;count:number}[]}) {
  return <div className="chart-grid">
    <section className="panel chart-panel"><h2>Volumen de peticiones por fecha</h2><ResponsiveContainer width="100%" height={280}><LineChart data={daily} margin={{top:18,right:24,left:-12,bottom:4}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dce6f2"/><XAxis dataKey="date" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip/><Line type="monotone" dataKey="requests" stroke="#1168dc" strokeWidth={3} dot={{fill:"#1168dc",r:4}}/></LineChart></ResponsiveContainer></section>
    <section className="panel chart-panel"><h2>Distribución por categoría</h2><ResponsiveContainer width="100%" height={280}><BarChart data={distribution} layout="vertical" margin={{top:8,right:44,left:4,bottom:4}}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#dce6f2"/><XAxis type="number" hide/><YAxis type="category" dataKey="category" width={52} tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="count" fill="#1168dc" radius={[0,7,7,0]}><LabelList dataKey="count" position="right" fill="#12335b" fontSize={12} fontWeight={700}/></Bar></BarChart></ResponsiveContainer></section>
  </div>;
}
