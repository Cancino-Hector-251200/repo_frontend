# Frontend — Consulta de clima con historial

Interfaz en HTML/CSS/JS puro. Consume dos microservicios independientes:

- `repo-backend-gateway` en `http://localhost:4000` (clima vía OpenWeatherMap)
- `repo-historial-service` en `http://localhost:5000` (historial de búsquedas)

## Cómo ejecutar

1. Levanta primero los otros dos servicios (ver sus propios README).
2. Abre `index.html` con Live Server, o sirve la carpeta con cualquier servidor estático:
   ```
   npx serve .
   ```
3. Abre el navegador en la URL que te indique (ej. `http://localhost:3000`).

## Notas de arquitectura

Este frontend nunca llama directamente a OpenWeatherMap: siempre pasa por su
propio backend (gateway), que es quien protege la API key. El historial es un
servicio 100% separado — si se cae, la búsqueda de clima sigue funcionando.
