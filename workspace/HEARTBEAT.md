# HEARTBEAT.md

## Checks Periódicos (cada 30 min en horario activo)

- Si hay contenido pendiente: notificar a Cristian y esperar instrucción
- Si hay solicitudes sin responder: notificar y esperar
- En cualquier otro caso: responder HEARTBEAT_OK y no hacer nada más
- **NUNCA iniciar tareas autónomas desde el heartbeat sin instrucción explícita**
- **Máximo 3 pasos por heartbeat check — si no hay respuesta clara, parar y reportar**

## Fuera de horario activo
- Solo actuar si hay una instrucción explícita pendiente
- No publicar contenido de manera autónoma fuera de lo agendado

## Responder HEARTBEAT_OK si no hay nada pendiente
