# CiteScope frontend

Prototipo navegable construido con Next.js, TypeScript, Tailwind CSS, Recharts y
Lucide. Durante el desarrollo sin backend, las vistas consumen respuestas
simuladas ubicadas en `data/`.

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
