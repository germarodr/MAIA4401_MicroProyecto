import styles from "./evaluation-views.module.css";

type Metric = {
  category: string; name: string; precision: number;
  recall: number; f1: number; support: number;
};
const format = (value: number) => `${(value * 100).toLocaleString("es-CO", {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
})} %`;

export function F1Chart({ data }: { data: Metric[] }) {
  const sorted = [...data].sort((a, b) => b.f1 - a.f1);
  return (
    <div className={styles.chart}>
      <ol className={styles.bars} aria-label="F1 de test por subárea, ordenado de mayor a menor">
        {sorted.map((item) => (
          <li className={styles.barRow} key={item.category} title={`${item.name} · Precision: ${format(item.precision)} · Recall: ${format(item.recall)} · Soporte: ${item.support}`}>
            <strong>{item.category}</strong>
            <span className={styles.track} aria-hidden="true"><span style={{ width: `${item.f1 * 100}%` }} /></span>
            <span className={styles.score}>{format(item.f1)}</span>
          </li>
        ))}
      </ol>
      <div className={styles.axis} aria-hidden="true">{[0, 20, 40, 60, 80, 100].map((tick) => <span key={tick}>{tick}</span>)}</div>
      <p className={styles.axisCaption}>F1 por clase (%) · escala de 0 a 100 %</p>
    </div>
  );
}

export function ConfusionMatrix({ labels, values }: { labels: string[]; values: number[][] }) {
  const max = Math.max(...values.flat());
  return (
    <div className={styles.matrixLayout}>
      <span className={styles.realAxis} aria-hidden="true">Real</span>
      <div className={styles.matrixScroll} role="region" aria-label="Matriz de confusión desplazable horizontalmente" tabIndex={0}>
        <table className={styles.matrix}>
          <caption>Predicho</caption>
          <thead><tr><td aria-hidden="true" />{labels.map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{values.map((row, i) => (
            <tr key={labels[i]}>
              <th scope="row">{labels[i]}</th>
              {row.map((value, j) => {
                const strength = max ? value / max : 0;
                return (
                  <td key={labels[j]} title={`Real: ${labels[i]} · Predicho: ${labels[j]} · ${value} registros`}
                    style={{ background: `rgba(17,104,220,${.04 + strength * .96})`, color: strength > .6 ? "white" : "#12335b" }}>
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
