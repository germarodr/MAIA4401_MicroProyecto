# Contratos tabulares para el backend

Estos CSV definen las tablas mínimas del prototipo y aportan datos semilla para
desarrollar la futura API. Los archivos no son la base de datos de producción.

## Relaciones

- `categories.category_code` es referenciado por predicciones y métricas.
- `predictions.prediction_id` se relaciona uno-a-muchos con
  `prediction_probabilities.prediction_id`.
- `model_evaluations.evaluation_id` se relaciona con `class_metrics` y
  `confusion_matrix`.
- `daily_monitoring_metrics` contiene agregados diarios reproducibles a partir de
  `predictions`.

Los valores vacíos de `actual_category` representan inferencias que todavía no
han sido validadas. Los porcentajes y métricas son ilustrativos mientras se
integra el modelo real.
