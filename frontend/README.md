# CiteScope frontend

Prototipo navegable construido con Next.js, TypeScript, Tailwind CSS, Recharts y
Lucide. Durante el desarrollo sin backend, las vistas consumen respuestas
simuladas ubicadas en `data/`. La vista de evaluación utiliza una copia estática
de los resultados reales de la Entrega 2; todavía no consulta MLflow ni la API.

## Requisitos

- Node.js 22 LTS (el repositorio incluye `.nvmrc`).
- npm 10 o posterior.

## Ejecución local

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:3000`.

Para validar la compilación de producción:

```bash
npm run lint
npm run build
npm run start
```

## Rutas

| Ruta | Vista |
|---|---|
| `/` | Inicio y presentación del proyecto |
| `/clasificar` | Formulario y respuesta simulada de clasificación |
| `/monitoreo` | Indicadores, gráficas, filtros e historial |
| `/monitoreo/[predictionId]` | Detalle de una petición |
| `/evaluacion` | Métricas, matriz de confusión y F1 por clase |

## Contrato temporal de datos

Los JSON de `data/` representan las respuestas que posteriormente entregará
FastAPI. Los componentes acceden a ellos mediante `src/lib/mock-data.ts`. Para
conectar el backend se debe reemplazar esa capa por un cliente HTTP, conservando
los tipos definidos en `src/lib/types.ts`.

| Mock | Futuro endpoint sugerido | Pantalla que utiliza los datos |
|---|---|---|
| `prediction.json` | `POST /api/v1/predictions` y `GET /api/v1/predictions/{id}` | Clasificar (`/clasificar`) y detalle de petición (`/monitoreo/[predictionId]`) |
| `predictions.json` | `GET /api/v1/predictions` | Monitoreo: historial y filtros (`/monitoreo`) |
| `monitoring-summary.json` | `GET /api/v1/monitoring/summary` | Monitoreo: indicadores y gráficas (`/monitoreo`) |
| `evaluation.json` | `GET /api/v1/evaluations/{id}` | Evaluación del modelo (`/evaluacion`) |
| `categories.json` | `GET /api/v1/categories` | Clasificar, monitoreo, detalle y evaluación |

Los CSV ubicados en `../db/` contienen el esquema tabular y los datos semilla que
puede usar el equipo de backend.

## Evaluación del modelo V2

`/evaluacion` implementa el mockup `EVALUACION-MODELO_V2.png`. El archivo
`data/evaluation.json` transcribe los resultados de `Entrega2_CiteScope.md`:
SciBERT Plus versión 1, alias `champion`, test reservado de 800 registros,
accuracy 0,6750 y Macro/Weighted F1 0,6716.

Las filas y columnas de la matriz mantienen el orden del reporte. Las barras de
F1 se ordenan en una copia independiente, de mayor a menor, con escala fija 0–100 %.
Las métricas se muestran como porcentajes con dos decimales en tarjetas, barras,
detalles al pasar el cursor y tabla de validación. El JSON conserva los valores
originales entre 0 y 1; la matriz y los soportes se muestran como cantidades.
La comparación de ocho modelos corresponde a **validación**, no a test. El
ensamble tiene la mejor validación; SciBERT Plus es el artefacto seleccionado.
Los antiguos resultados de ejemplo por disponibilidad de metadatos se retiraron.

Para comprobar que todas las métricas por clase y globales coinciden con la
matriz de confusión, ejecute `npm run test:evaluation`. Los estilos de esta vista
están aislados en CSS Modules. En móvil, la matriz permite desplazamiento
horizontal sin ensanchar la página.
