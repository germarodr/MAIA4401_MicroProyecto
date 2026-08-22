import Link from "next/link";
import { Landmark } from "lucide-react";
export function SiteFooter() {
  return <footer className="site-footer"><div className="shell footer-inner">
    <Landmark size={30}/><div className="footer-copy"><strong>Proyecto desarrollado por el Grupo 8</strong><span>Camilo Bejarano · German Rodriguez · Jose Arteaga · Sebastian Toro</span><span>Con el apoyo de la Universidad de los Andes</span></div>
    <div className="footer-links"><Link href="/">Acerca del proyecto</Link><Link href="/evaluacion">Metodología</Link><a href="https://github.com/germarodr/MAIA4401_MicroProyecto" target="_blank" rel="noreferrer">GitHub</a></div>
  </div></footer>;
}
