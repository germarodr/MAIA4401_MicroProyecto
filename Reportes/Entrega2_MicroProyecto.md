# CiteScope — Entrega 2

**Equipo (Grupo 8):** Camilo Bejarano, German Rodriguez, Jose Arteaga y Sebastian Toro  
**Curso:** Proyecto - Desarrollo de Soluciones / MAIA  
**Fecha:** Septiembre 2026

---

## 1. Resumen del problema

### 1.1 Contexto y pregunta de negocio

El volumen de literatura científica en arXiv crece de forma acelerada, lo que dificulta organizar, indexar y descubrir artículos por subárea temática. En el dominio de Computer Science, el contexto en el que un artículo cita a otro y los metadatos del trabajo citado ofrecen señales semánticas que pueden ayudar a clasificar automáticamente la subárea del artículo citante.

Frente a este escenario, CiteScope busca responder la siguiente pregunta:

> ¿Es posible predecir la subárea de Computer Science de un artículo científico a partir del contexto de la cita y de los metadatos, título y abstract, del artículo citado?

### 1.2 Objetivo y alcance del proyecto

El objetivo es desarrollar un prototipo funcional que clasifique contextos de cita en una de ocho subáreas `cs.*` de arXiv. En esta entrega se prioriza: entrenamiento y comparación de modelos, registro de experimentos en MLflow, desarrollo del tablero y soportes reproducibles en Git.

**Alcance técnico:** entrenar modelos supervisados, comparar baseline vs. modelos enriquecidos, registrar parámetros/métricas/artefactos en MLflow, construir un tablero que consuma predicciones y mantener notebooks, código y evidencias en el repositorio.

### 1.3 Conjunto de datos utilizado

Se utiliza el dataset `Dataset/unarxive_microproyecto.jsonl`, construido a partir de unarXive y enriquecido con OpenAlex. El conjunto contiene 4.000 registros balanceados: 500 ejemplos para cada una de ocho subáreas de Computer Science.

| Campo | Uso | Descripción |
| --- | --- | --- |
| `citation_context` | Entrada | Párrafo del artículo citante donde aparece la cita. |
| `cited_title` | Entrada | Título del artículo citado. |
| `cited_abstract` | Entrada | Abstract del artículo citado. |
| `citing_primary_category` | Target | Subárea `cs.*` del artículo citante. |

Las clases objetivo son `cs.LG`, `cs.CV`, `cs.CL`, `cs.AI`, `cs.NE`, `cs.RO`, `cs.IR` y `cs.MA`. El dataset está balanceado, por lo que la métrica principal seleccionada es **Macro F1**, acompañada de accuracy, precision macro, recall macro y métricas por clase.

### 1.4 Cambios respecto a la entrega anterior

La Entrega 1 definió el problema, seleccionó unarXive como fuente principal, construyó el dataset y propuso la maqueta. La Entrega 2 avanza a implementación: modelos supervisados, comparación de resultados, MLflow, primera versión del tablero y artefactos de evaluación para soportar la selección del modelo.

---

## 2. Modelos desarrollados y evaluación

### 2.1 Proceso de entrenamiento

Para la experimentación se construyeron varias alternativas de clasificación. El flujo general parte de una partición reproducible del dataset, transforma los campos textuales en una representación adecuada para cada modelo y evalúa el desempeño sobre datos de validación o prueba según corresponda.

**Preparación de datos:** [completar partición train/validation/test, control de duplicados o referencias repetidas, normalización de texto, tratamiento de nulos, concatenación de campos y versión/hash del dataset.]

**Selección de características:** baseline con `citation_context`; modelo enriquecido con `citation_context`, `cited_title` y `cited_abstract`; modelos SciBERT con `allenai/scibert_scivocab_uncased`, presupuestos de longitud por campo y entrenamiento supervisado multiclase.

### 2.2 Modelos evaluados

| Modelo | Fuente | Entrada | Macro F1 val | Accuracy val | Observación |
| --- | --- | --- | ---: | ---: | --- |
| Logistic Regression baseline | `models/02_baseline.ipynb` | Contexto | 0.5696 | 0.5713 | Referencia inicial con solo contexto de cita. |
| Linear SVC baseline | `models/02_baseline.ipynb` | Contexto | 0.5523 | 0.5588 | Alternativa clásica de comparación. |
| Logistic Regression enriquecido | `models/03_enriquecido.ipynb` | Contexto + título + abstract | 0.6277 | 0.6288 | Mejora frente al baseline al incorporar metadatos. |
| Linear SVC enriquecido | `models/03_enriquecido.ipynb` | Contexto + título + abstract | 0.6090 | 0.6125 | Mejora moderada frente al contexto solo. |
| Tuning Logistic Regression | `models/04_tuning.ipynb` | Texto enriquecido | 0.6145 | 0.6150 | Ajuste de hiperparámetros; no supera al default enriquecido. |
| SciBERT | `models/05_scibert.ipynb` | Texto enriquecido | 0.6836 | 0.6800 | Mejor desempeño individual frente a modelos clásicos. |
| SciBERT plus | `models/07_scibert_plus.ipynb` | Presupuestos estructurados + búsqueda LR + semillas | 0.6958 | 0.6950 | Mejor corrida individual con LR `1e-05`. |
| Ensamble SciBERT plus | `models/07_scibert_plus.ipynb` | SciBERT + modelo clásico | 0.6981 | 0.6975 | Mejor resultado de validación reportado hasta ahora. |

> Validar estos valores contra los notebooks finales antes de cerrar el reporte. Si `models/08_evaluacion_test.ipynb` contiene resultados de test, agregar una fila final con las métricas definitivas.

### 2.3 Configuración de experimentos destacados

| Experimento | Configuración principal | Resultado relevante |
| --- | --- | --- |
| Baseline clásico | TF-IDF `(1, 2)`, `min_df=3`, Logistic Regression, seed 42 | Macro F1 val 0.5696. |
| Enriquecido clásico | TF-IDF `(1, 2)`, contexto + título + abstract | Macro F1 val 0.6277. |
| Tuning clásico | Logistic Regression con búsqueda de hiperparámetros | No mejora el enriquecido base. |
| SciBERT base | `max_len=512`, 5 épocas, early stopping, LR `2e-05` | Macro F1 val 0.6836. |
| SciBERT plus LR | LR `1e-05`, seed 42, checkpoint 900 | Macro F1 val 0.6958. |
| Ensamble | `alpha_scibert=0.9` | Macro F1 val 0.6981. |

### 2.4 Evaluación por clase

Completar con el modelo seleccionado, idealmente sobre test.

| Clase | Precision | Recall | F1 | Comentario |
| --- | ---: | ---: | ---: | --- |
| `cs.LG` | [valor] | [valor] | [valor] | [Completar] |
| `cs.CV` | [valor] | [valor] | [valor] | [Completar] |
| `cs.CL` | [valor] | [valor] | [valor] | [Completar] |
| `cs.AI` | [valor] | [valor] | [valor] | [Completar] |
| `cs.NE` | [valor] | [valor] | [valor] | [Completar] |
| `cs.RO` | [valor] | [valor] | [valor] | [Completar] |
| `cs.IR` | [valor] | [valor] | [valor] | [Completar] |
| `cs.MA` | [valor] | [valor] | [valor] | [Completar] |

### 2.5 Evidencias visuales de evaluación

![Comparación de modelos](../models/artifacts/[comparacion_modelos].png)

**Interpretación:** [mejora desde contexto solo hasta SciBERT plus y justificación del modelo seleccionado.]

![Matriz de confusión del modelo final](../models/artifacts/[matriz_confusion_modelo_final].png)

**Interpretación:** [aciertos, clases difíciles y confusiones entre subáreas cercanas.]

---

## 3. Experimentos en MLflow

Los experimentos se registraron en MLflow para conservar trazabilidad de parámetros, métricas y artefactos. Adjuntar capturas con usuario e IP de EC2 visibles, más la IP en MLflow.

### 3.1 Configuración de MLflow

| Elemento | Valor |
| --- | --- |
| Tracking server | [URI o IP de MLflow] |
| Máquina | AWS EC2 |
| Usuario visible en EC2 | [usuario] |
| Rama Git | `dev` |
| Commit usado | [hash del commit] |
| Experimento principal | [nombre del experimento] |

### 3.2 Parámetros, métricas y artefactos registrados

| Tipo | Elementos registrados |
| --- | --- |
| Parámetros | modelo, estrategia de entrada, semilla, learning rate, batch size, épocas, max length, versión del dataset. |
| Métricas | Macro F1, accuracy, precision macro, recall macro, F1 por clase, tiempo de entrenamiento. |
| Artefactos | checkpoints, matrices de confusión, reportes de clasificación, CSV de resultados, configuración de entrenamiento. |

### 3.3 Evidencia de corridas

| Run | Modelo | Macro F1 | Accuracy | Artifact principal | Comentario |
| --- | --- | ---: | ---: | --- | --- |
| [run_name] | Baseline | [valor] | [valor] | [artifact] | [Completar] |
| [run_name] | Enriquecido | [valor] | [valor] | [artifact] | [Completar] |
| [run_name] | SciBERT | [valor] | [valor] | [artifact] | [Completar] |
| [run_name] | SciBERT plus | [valor] | [valor] | [artifact] | [Completar] |

![MLflow en EC2](../Reportes/images/[captura_mlflow_ec2].png)

**Descripción:** [La captura debe mostrar la terminal o entorno de EC2 con usuario e IP visibles.]

![Runs en MLflow](../Reportes/images/[captura_runs_mlflow].png)

**Descripción:** [La captura debe mostrar métricas, parámetros y artefactos de las corridas principales.]

---

## 4. Observaciones y conclusiones sobre los modelos

Los resultados muestran una mejora progresiva al incorporar más información semántica. El baseline con solo contexto alcanza un Macro F1 cercano a 0.57, mientras que el modelo enriquecido con título y abstract sube aproximadamente a 0.63. Esto sugiere que los metadatos del artículo citado sí aportan señales útiles para predecir la subárea del artículo citante.

Los modelos basados en SciBERT obtienen el mejor desempeño de validación, con Macro F1 cercano a 0.70 en la mejor variante. Este resultado es coherente con el dominio del problema, ya que SciBERT fue preentrenado sobre texto científico y puede capturar mejor relaciones semánticas entre contexto de cita, título, abstract y categoría temática.

**Aspectos a destacar:**

- [Indicar cuáles clases tuvieron mejor F1 y por qué puede ocurrir.]
- [Identificar confusiones relevantes, por ejemplo entre `cs.AI`, `cs.LG` y `cs.NE`, si aparecen.]
- [Explicar si el ensamble mejora lo suficiente para justificar su complejidad.]
- [Comparar desempeño y costo de inferencia entre modelos clásicos y SciBERT.]

**Conclusión del modelo seleccionado:**

[Completar con una conclusión directa: modelo elegido, métrica final, razón técnica de la selección y limitaciones antes de usarlo en un entorno real.]

---

## 5. API REST

La API funciona como intermediaria entre el tablero y el modelo de clasificación. Su objetivo es recibir los campos textuales de entrada, aplicar el preprocesamiento requerido, ejecutar el modelo empaquetado y devolver una respuesta estructurada con la subárea predicha y las probabilidades por clase.

### 5.1 Estructura general

| Componente | Descripción | Estado |
| --- | --- | --- |
| Aplicación API | [FastAPI / Flask / otro framework] | [Implementado / parcial / pendiente] |
| Endpoint de salud | Verifica que el servicio esté disponible. | [Completar] |
| Endpoint de predicción | Recibe contexto, título y abstract; retorna predicción. | [Completar] |
| Carga del modelo | Carga artefacto entrenado y clases objetivo. | [Completar] |
| Manejo de errores | Valida entradas vacías, errores de inferencia y respuestas inválidas. | [Completar] |

### 5.2 Endpoints principales

| Endpoint | Método | Entrada | Salida |
| --- | --- | --- | --- |
| `/health` | GET | Ninguna | Estado del servicio. |
| `/predict` | POST | `citation_context`, `cited_title`, `cited_abstract` | Clase predicha, confianza y probabilidades. |
| `/metrics` | GET | Ninguna | Métricas del modelo o resumen de evaluación. |

### 5.3 Ejemplo de respuesta

```json
{"predicted_category":"cs.LG","category_name":"Machine Learning","confidence":0.82,"class_probabilities":{"cs.LG":0.82,"cs.AI":0.08,"cs.NE":0.04},"model_version":"[version]"}
```

![Documentación Swagger o prueba de API](../Reportes/images/[captura_api].png)

**Descripción:** [Incluir evidencia del endpoint funcionando y una respuesta real o de prueba.]

---

## 6. Tablero desarrollado

El tablero permite a usuarios no técnicos ingresar un contexto de cita, obtener la subárea predicha y consultar métricas para interpretar el comportamiento del clasificador.

### 6.1 Funcionalidades principales

| Funcionalidad | Descripción | Estado | Evidencia |
| --- | --- | --- | --- |
| Formulario de entrada | Captura contexto de cita, título y abstract. | [Completar] | [captura] |
| Predicción del modelo | Consume la API y presenta la clase predicha. | [Completar] | [captura] |
| Probabilidades por clase | Muestra la distribución de confianza entre las ocho clases. | [Completar] | [captura] |
| Métricas de evaluación | Presenta Macro F1, accuracy y métricas por clase. | [Completar] | [captura] |
| Historial o monitoreo | Lista inferencias, latencia, versión del modelo y estado. | [Completar] | [captura] |

### 6.2 Vistas del tablero

![Vista de clasificación](../Reportes/images/[captura_tablero_clasificacion].png)

**Descripción:** [Explicar cómo el usuario ingresa los datos y recibe la predicción.]

![Vista de métricas](../Reportes/images/[captura_tablero_metricas].png)

**Descripción:** [Explicar qué métricas se muestran y cómo ayudan a evaluar el modelo.]

![Vista de historial o monitoreo](../Reportes/images/[captura_tablero_monitoreo].png)

**Descripción:** [Explicar cómo se monitorean inferencias, confianza y latencia.]

### 6.3 Valor para el usuario

El tablero conecta el modelo con la pregunta de negocio porque permite validar de forma interactiva si el contexto de cita y los metadatos del artículo citado son suficientes para asignar una subárea de Computer Science. Además, mostrar probabilidades por clase ayuda a diferenciar predicciones claras de casos ambiguos y evita interpretar la clase final como una certeza absoluta.

---

## 7. Repositorio, fuentes y soportes

El repositorio del proyecto es:

[https://github.com/germarodr/MAIA4401_MicroProyecto](https://github.com/germarodr/MAIA4401_MicroProyecto)

| Elemento | Ruta o evidencia |
| --- | --- |
| Código de construcción de dataset | `scripts/harvest_candidates.py`, `scripts/enrich_select.py` |
| Dataset y resumen | `Dataset/` |
| Notebooks de modelos | `models/02_baseline.ipynb` a `models/08_evaluacion_test.ipynb` |
| Artefactos de resultados | `models/artifacts/` |
| Reporte | `Reportes/` |
| Código de API | [ruta] |
| Código de tablero | [ruta] |
| Capturas de MLflow | `Reportes/images/` |
| Capturas del tablero | `Reportes/images/` |

**Soportes obligatorios para adjuntar o evidenciar:**

- Repositorio Git accesible con commits de todos los integrantes.
- Fuentes de los modelos desarrollados.
- Fuentes del tablero desarrollado.
- Capturas de MLflow en AWS EC2 con usuario e IP visibles.
- Capturas de parámetros, métricas y artefactos de los experimentos.
- Evidencia de que la máquina EC2 queda detenida y no terminada.

---

## 8. Reporte de trabajo en equipo

El trabajo se organizó por frentes para cubrir datos, modelado, MLflow, tablero, API y documentación. La siguiente tabla debe completarse con actividades verificables y evidencia individual, dado que la calificación es individual aunque el producto sea grupal.

| Integrante | Actividades realizadas | Evidencia |
| --- | --- | --- |
| Camilo Bejarano | [Completar] | [commits, PR, notebook, captura o archivo] |
| German Rodriguez | [Completar] | [commits, PR, notebook, captura o archivo] |
| Jose Arteaga | [Completar] | [commits, PR, notebook, captura o archivo] |
| Sebastian Toro | [Completar] | [commits, PR, notebook, captura o archivo] |

**Balance y coordinación:**

[Describir brevemente cómo se distribuyó el trabajo, cómo se revisaron los resultados y qué ajustes se hicieron para integrar los aportes del equipo. Mantener esta sección en máximo 1 página.]

---

## 9. Conclusiones finales

- [Conclusión sobre el avance desde la Entrega 1 hasta la Entrega 2.]
- [Conclusión sobre el modelo seleccionado y su desempeño final.]
- [Conclusión sobre el aporte de los metadatos del artículo citado.]
- [Conclusión sobre la utilidad del tablero para el usuario.]
- [Próximo paso principal hacia la entrega final: empaquetamiento, despliegue, mejora del tablero o evaluación adicional.]

---

## Checklist antes de entregar

- [ ] El reporte no supera 10 páginas.
- [ ] El resumen del problema no supera 1 página.
- [ ] Se incluyen contexto, pregunta de negocio, alcance y datos.
- [ ] Se explican cambios frente a la Entrega 1.
- [ ] Se describen modelos, entrenamiento y selección de características.
- [ ] Se reportan métricas apropiadas y comparables.
- [ ] Se incluyen observaciones y conclusiones sobre los modelos.
- [ ] Se evidencia MLflow con capturas desde EC2.
- [ ] Se muestra el tablero y sus funcionalidades.
- [ ] Se referencian fuentes de modelos y tablero.
- [ ] El repositorio evidencia aportes de todos los integrantes.
- [ ] Se incluye el reporte de trabajo en equipo de máximo 1 página.
