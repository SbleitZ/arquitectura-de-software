# Servicio de Validación – TicketFlow

Componente funcional mínimo del proyecto **TicketFlow** (Proyecto Final de
Arquitectura de Software). Corresponde al **Servicio de Validación** descrito
en el Documento de Arquitectura de Software (DAS): recibe el código QR que se
escanea en la puerta de un evento, responde si el acceso es válido y marca la
entrada como usada para que no se pueda volver a usar (ASR-05).

## Estructura

```
src/
  entradaRepository.js   # Repositorio (en memoria, simula la tabla entrada_qr)
  validacionService.js   # Lógica de validación (Figura 6 del DAS)
  app.js                 # API Express: POST /validar, GET /salud
  index.js               # Punto de entrada
test/
  validacionService.test.js   # Pruebas unitarias
  app.test.js                 # Pruebas de la API (incluye peticiones simultáneas)
.github/workflows/ci.yml # Pipeline CI/CD (Figura 9 del DAS)
Dockerfile               # Imagen que se entrega en la etapa de CD
evidencia/               # Registros de ejecución
```

## Pipeline CI/CD (GitHub Actions)

Se ejecuta con cada push o Pull Request hacia `main` o `develop`:

| Job | Etapa | Comando |
|-----|-------|---------|
| CI | Instalar dependencias | `npm ci` |
| CI | Análisis estático | `npm run lint` (ESLint) |
| CI | Pruebas + cobertura (gate) | `npm test` (Jest, umbral 80 %) |
| CI | Reporte | artefacto `reporte-cobertura` |
| CD | Construir imagen | `docker build` |
| CD | Prueba de humo | contenedor + `curl /salud` y `/validar` |
| CD | Entrega | artefacto `imagen-docker` |

Si el lint, una prueba o el umbral de cobertura fallan, el job de CI falla,
el de CD no se ejecuta y el Pull Request queda marcado en rojo.

## Ejecutar localmente

```bash
npm ci
npm run ci      # lint + pruebas
npm start       # servicio en http://localhost:3000

curl -X POST http://localhost:3000/validar \
  -H "Content-Type: application/json" \
  -d '{"codigo": "QR-DEMO-001"}'
```

## Sobre la atomicidad (ASR-05)

`marcarUsada` comprueba y marca en un solo paso. En producción, con
PostgreSQL, se hace con una sola sentencia:

```sql
UPDATE entrada_qr SET usada = true, usada_en = now()
WHERE codigo = $1 AND usada = false
RETURNING *;
```

Las pruebas lanzan 20 validaciones simultáneas (y 10 peticiones HTTP
simultáneas) del mismo QR y exigen que solo una sea aceptada. En
`evidencia/gate_detecta_error.txt` queda registrado que, si se cambia la
implementación por una que lee y escribe en dos pasos, esas pruebas fallan y el
pipeline se detiene.

## Evidencias

- `evidencia/01_instalacion_y_lint.png`: instalación (npm ci) y ESLint sin errores.
- `evidencia/02_pruebas_jest_cobertura.png`: 14/14 pruebas aprobadas y cobertura de 97,9 %.
- `evidencia/03_prueba_de_humo.png`: el servicio responde /salud y rechaza la segunda validación (409).
- `evidencia/04_gate_detecta_error.png`: el gate detectando un error de concurrencia introducido a propósito.
- `evidencia/*.txt`: los mismos registros en texto.
- Ejecuciones en GitHub: pestaña **Actions** de este repositorio.
