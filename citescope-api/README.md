# CiteScope en Docker

## Artefactos del modelo

Antes de iniciar Compose, los pesos gestionados con DVC deben estar descargados
en `citescope-api/model_artifacts/model.safetensors`. Esa carpeta también debe
contener la configuración y el tokenizador versionados en Git:

- `config.json`
- `tokenizer.json`
- `tokenizer_config.json`
- `special_tokens_map.json`
- `vocab.txt`

La configuración del remoto, las credenciales y la publicación en DVC se gestionan
por separado. Compose utiliza los archivos locales ya descargados.

## Arranque

Desde la raíz del repositorio, después de recuperar los artefactos con DVC:

```powershell
docker compose -f citescope-api/docker-compose.yml up -d --build --wait
```

La API monta `model_artifacts/` en modo solo lectura y carga directamente
`model.safetensors`. Los pesos no se copian a la imagen Docker. Si faltan archivos
del modelo o no son válidos, la API no completa su arranque. El frontend espera
a que la comprobación de salud confirme que el modelo está cargado.

- Frontend: http://localhost:3000
- Documentación de la API: http://localhost:8000/docs

## Actualizar los pesos

Después de recuperar otra versión del modelo con DVC, reinicie la API para cargarla:

```powershell
docker compose -f citescope-api/docker-compose.yml restart api
```

No se necesita reconstruir la imagen cuando solo cambian los artefactos montados.
Si cambia la versión del modelo, actualice también `MODEL_VERSION` en
`citescope-api/.env` y ejecute `docker compose -f citescope-api/docker-compose.yml up -d --wait`
para recrear el servicio con esa configuración.

Para verificar el estado y consultar los registros:

```powershell
docker compose -f citescope-api/docker-compose.yml ps
docker compose -f citescope-api/docker-compose.yml logs --tail 50 api
```
