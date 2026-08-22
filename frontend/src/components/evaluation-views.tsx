"use client";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
type Metric={category:string;name:string;precision:number;recall:number;f1:number;support:number};
export function F1Chart({data}:{data:Metric[]}) { return <ResponsiveContainer width="100%" height={370}><BarChart data={data} layout="vertical" margin={{top:8,right:55,left:8,bottom:0}}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#dce6f2"/><XAxis type="number" domain={[0,1]} tickFormatter={v=>v.toFixed(1)}/><YAxis type="category" dataKey="category" width={52} tickLine={false} axisLine={false}/><Tooltip formatter={value=>Number(value).toFixed(2)}/><Bar dataKey="f1" fill="#1168dc" radius={[0,7,7,0]}><LabelList dataKey="f1" position="right" formatter={v=>Number(v).toFixed(2)} fill="#12335b" fontWeight={700}/></Bar></BarChart></ResponsiveContainer>; }
export function ConfusionMatrix({labels,values}:{labels:string[];values:number[][]}) {
  const max=Math.max(...values.flat());
  return <div className="matrix-wrap"><div className="matrix" style={{gridTemplateColumns:`56px repeat(${labels.length},1fr)`}}><span/>{labels.map(label=><strong key={`h-${label}`}>{label}</strong>)}{values.map((row,i)=><div className="matrix-row" key={labels[i]} style={{display:"contents"}}><strong>{labels[i]}</strong>{row.map((value,j)=>{const strength=value/max;return <span key={`${i}-${j}`} style={{background:`rgba(17,104,220,${.08+strength*.92})`,color:strength>.55?"white":"#12335b"}}>{value}</span>;})}</div>)}</div></div>;
}
