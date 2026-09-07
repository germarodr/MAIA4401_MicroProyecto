import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
export function Panel({children,className=""}:{children:ReactNode;className?:string}) { return <section className={`panel ${className}`}>{children}</section>; }
export function KpiCard({label,value,note,icon:Icon,tone="blue"}:{label:string;value:string;note?:string;icon:LucideIcon;tone?:"blue"|"green"|"red"}) {
  return <div className="kpi-card"><span className={`icon-bubble ${tone}`}><Icon size={25}/></span><div><span className="kpi-label">{label}</span><strong>{value}</strong>{note&&<small>{note}</small>}</div></div>;
}
export function StatusBadge({status}:{status:string}) { return <span className={`status ${status}`}>{status === "success" ? "Éxito" : "Error"}</span>; }
export function PageHeading({title,subtitle}:{title:string;subtitle:string}) { return <div className="page-heading"><h1>{title}</h1><p>{subtitle}</p></div>; }
