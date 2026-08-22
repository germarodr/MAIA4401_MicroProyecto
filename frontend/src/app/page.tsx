import Link from "next/link";
import { BarChart3, BookText, Database, FileSearch, ScanSearch } from "lucide-react";
import { Brand } from "@/components/brand";
import { Panel } from "@/components/ui";

const benefits = [
  {icon:BookText,title:"Contexto enriquecido",text:"Combinamos el contexto de la cita con el título y el abstract del artículo citado."},
  {icon:BarChart3,title:"Resultados interpretables",text:"Presentamos la subárea predicha y la distribución de probabilidad entre las ocho clases."},
  {icon:Database,title:"Monitoreo continuo",text:"Registramos actividad, latencia, confianza y validaciones para evaluar el servicio."},
];

export default function HomePage() {
  return <div className="shell"><section className="hero"><div className="hero-copy"><h1>CiteScope</h1><h2>Clasificación inteligente de citas académicas</h2><p>Identificamos la subárea de Computer Science a partir del contexto de una cita, el título y el abstract del artículo citado.</p><div className="hero-actions"><Link className="btn primary" href="/clasificar"><FileSearch size={20}/>Clasificar una cita</Link><Link className="btn" href="/evaluacion"><ScanSearch size={20}/>Explorar el modelo</Link></div><div className="trust"><Database size={17}/>8 subáreas de Computer Science · Datos de arXiv</div></div><div className="hero-visual"><Brand/></div></section><section className="benefit-grid">{benefits.map(({icon:Icon,title,text})=><Panel className="benefit" key={title}><span className="icon-bubble"><Icon size={25}/></span><div><h3>{title}</h3><p>{text}</p></div></Panel>)}</section></div>;
}
