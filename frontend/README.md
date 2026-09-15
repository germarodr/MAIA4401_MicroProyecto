# CiteScope frontend

Prototipo navegable construido con Next.js, TypeScript, Tailwind CSS, Recharts y
Lucide. Las vistas de clasificación y monitoreo consumen FastAPI. La vista de evaluación utiliza una copia estática
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

## Ejecución con Docker Compose

Desde la raíz del repositorio:

```bash
docker compose -f citescope-api/docker-compose.yml up -d --build
```

Esto levanta PostgreSQL, FastAPI y el frontend de producción. El frontend queda
en `http://localhost:3000` y la documentación de FastAPI en
`http://localhost:8000/docs`. En `citescope-api/model_artifacts` deben estar
`model.safetensors` descargado con DVC, la configuración y el tokenizador.
La API carga los archivos directamente desde esa carpeta montada en solo lectura;
el frontend espera que la API esté saludable. La descarga con DVC se realiza
antes de ejecutar Compose.

Dentro de Docker, `CITESCOPE_API_URL=http://api:8000` apunta al servicio `api`
en la red de Compose. El navegador sigue usando `/api` en el mismo origen del
frontend. `localhost` dentro de un contenedor corresponde a ese contenedor.

Detenga `npm run dev` si ocupa el puerto 3000. Para usar otro puerto, configure
`FRONTEND_PORT=3001` en `citescope-api/.env` antes de levantar Compose.

Para reconstruir el frontend después de modificar su código:

```bash
docker compose -f citescope-api/docker-compose.yml up -d --build frontend
```

Para consultar el estado y los registros:

```bash
docker compose -f citescope-api/docker-compose.yml ps
docker compose -f citescope-api/docker-compose.yml logs --tail 50 frontend
```

La imagen se construye con `npm ci` y `npm run build`; requiere acceso a npm y
Google Fonts durante la construcción. La imagen final usa la salida `standalone`
de Next.js y se ejecuta como usuario sin privilegios. Los archivos `.env` locales
no se copian a la imagen; Compose proporciona la configuración al arrancar.

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
| `/clasificar` | Formulario y respuesta del modelo |
| `/monitoreo` | Indicadores, gráficas, filtros e historial |
| `/monitoreo/[predictionId]` | Detalle de una petición |
| `/evaluacion` | Métricas, matriz de confusión y F1 por clase |

## Conexión con FastAPI

El navegador consulta `/api/predictions` en Next.js. El servidor reenvía las
solicitudes a FastAPI, evitando la necesidad de configurar CORS para el navegador.
La URL por defecto es `http://127.0.0.1:8000`. Para cambiarla, cree
`frontend/.env.local` y reinicie Next.js:

```dotenv
CITESCOPE_API_URL=http://127.0.0.1:8000
```

FastAPI debe estar activo y tener los pesos del modelo en
`citescope-api/model_artifacts`. Sin backend disponible se muestra un error;
no se sustituyen las respuestas por datos dummy.

| Vista | Fuente |
|---|---|
| Clasificar | `POST /predictions` con `citation_context`, `cited_title`, `cited_abstract` |
| Monitoreo | `GET /predictions`; filtros, indicadores y gráficas calculados sobre el historial |
| Detalle | Búsqueda del ID exacto en `GET /predictions`; no existe endpoint individual |
| Salud | `GET /api/health` reenvía a `GET /health` |
| Evaluación | Resultados estáticos de `data/evaluation.json` |
| Categorías | Catálogo local `data/categories.json` |

`src/lib/api-types.ts` representa el contrato real en snake_case.
`src/lib/prediction-data.ts` adapta las probabilidades y los nombres de categoría.
La longitud del contexto se muestra en caracteres, como la devuelve Python.
Las predicciones fallidas conservan valores nulos; no se presentan como confianza cero.

Todos los indicadores respetan los filtros aplicados. La confianza promedio usa
solo resultados exitosos con confianza; p95 usa el rango más cercano superior
sobre las latencias registradas. Las fechas se agrupan en la zona horaria del navegador.
No se muestran comparaciones ficticias con periodos anteriores. El backend
registra latencia cero cuando falla la inferencia, lo que afecta el p95.

El contrato no incluye modificaciones de etiquetas posteriores a la predicción,
por lo que los botones de validación pendientes se retiraron. El historial completo
se descarga para filtrar y consultar detalles; para grandes volúmenes serán
necesarios endpoints con paginación y consulta por ID.

Para comprobar el adaptador, los indicadores y el transporte HTTP:

```bash
npm run test:api
```

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
