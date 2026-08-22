import { BookOpen, ScanSearch } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="brand" aria-label="CiteScope">
    <span className="brand-mark" aria-hidden="true"><BookOpen size={compact ? 28 : 38} strokeWidth={1.8}/><ScanSearch className="brand-scan" size={compact ? 18 : 24} strokeWidth={2.4}/></span>
    <span><strong className={compact ? "brand-name compact" : "brand-name"}>CITE<span>SCOPE</span></strong>{!compact && <small>AI Book Classification</small>}</span>
  </div>;
}
