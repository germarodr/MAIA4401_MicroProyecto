import type { Probability } from "@/lib/types";
export function ProbabilityBars({items}:{items:Probability[]}) {
  return <div className="probability-list">{items.map(item=><div className="probability-row" key={item.category}>
    <div className="probability-label"><strong>{item.category}</strong><span>{item.name}</span><b>{(item.value*100).toFixed(item.value<.1?1:0)}%</b></div>
    <div className="track"><span style={{width:`${Math.max(item.value*100,.6)}%`}}/></div>
  </div>)}</div>;
}
