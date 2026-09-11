---
tags: [proyecto, decision]
fecha: 2026-09-05
estado: aceptada
---

# 010 — El conector MCP en vez de pagar inferencia

## Contexto

El copiloto del panel (ver `routes/copiloto.js`) mete la inteligencia DENTRO
del sitio: el servidor llama a la API de Anthropic y cada conversación consume
créditos por fichas. Al ir a encenderlo apareció el obstáculo real, y no era
técnico: el consultorio no quiere pagar créditos.

La petición textual fue *«quiero manejar la página como una extensión o
conexión, más que pagar créditos»*.

## Opciones

1. **Comprar créditos de API.** Para este uso costaría céntimos al mes, pero
   exige recargar una cuenta y vigilar un saldo.
2. **Conectar una suscripción de Claude a la API.** No existe. Son productos
   distintos y no hay puente; conviene tenerlo escrito porque es la primera
   idea que se le ocurre a cualquiera.
3. **Un servidor MCP.** El sitio expone las herramientas y quien piensa es el
   Claude de la doctora, contra su propia suscripción.

## Qué elegimos

La opción 3, **sin quitar la 1**. Las dos conviven y comparten las mismas ocho
herramientas.

Eso último es la decisión que más rendirá con el tiempo: una herramienta nueva
aparece en los dos sitios sola, y ninguna puede comportarse distinto según por
dónde entre. Duplicar las definiciones habría sido más rápido de escribir y
habría producido, tarde o temprano, dos versiones divergentes de la misma
operación sobre la base.

## La regla que sostiene la seguridad

**Solo un administrador puede autorizar un conector**, comprobado con los
mismos middlewares que protegen el panel. Un conector autorizado puede cambiar
precios y promociones: dar ese poder tiene que costar exactamente lo mismo que
entrar al panel.

Y **se revalida en cada llamada**, no solo al autorizar. Si a alguien se le
quita el rol, sus conectores mueren en el acto en vez de seguir vivos hasta que
caduque el token.

## Por qué el estado va en la base

Railway reinicia y duplica procesos cuando le conviene. Con el estado en
memoria, cada reinicio desconectaría a la doctora sin avisar; y con dos
procesos, el que atendiera la segunda mitad del intercambio no reconocería el
código emitido por el primero.

## Detalles que costaron y conviene no volver a descubrir

- **`mcpAuthRouter` va en la raíz del dominio**, no bajo `/mcp`. Los
  `.well-known` están definidos por RFC en la raíz, y el router se declara a sí
  mismo en `/authorize` y `/token`: montarlo más adentro emite metadatos que
  apuntan a rutas que no existen.
- **`resourceMetadataUrl` en el middleware.** Sin él, el 401 sale con
  `WWW-Authenticate` pero sin decir dónde están los metadatos, que es el
  puntero por el que claude.ai descubre a qué servidor ir.
- **`enableJsonResponse: true` en el transporte.** Sin sesiones, el transporte
  abre un canal de eventos que nunca se cierra y el cliente queda colgado en el
  saludo inicial, sin error ni tiempo de espera.
- **`registerTool` exige Zod.** Estas definiciones son JSON Schema, así que hay
  que usar la clase `Server` de bajo nivel con `setRequestHandler`. Convertirlas
  a Zod obligaría a mantener dos versiones del mismo esquema.

Los cuatro se manifestaban igual: el cliente colgado sin decir nada.

## A qué renunciamos

- La doctora necesita una suscripción de Claude. Es un coste fijo mensual en
  vez de créditos variables —que es lo que se pedía—, pero no es gratis.
- El conector no puede hacer nada que no esté en las ocho herramientas. Para
  ampliarlo hay que escribir la herramienta, no basta con pedirlo.
- Queda un `MCP_TOKEN` compartido como atajo para Claude Desktop. No distingue
  quién llama y no caduca: es de desarrollo, no la puerta principal.

## Cómo saldríamos de aquí

Quitar el conector es dejar de montar las rutas; las tablas quedan huérfanas y
se pueden borrar después. El copiloto sigue funcionando por su lado, así que no
hay un momento en el que el consultorio se quede sin ninguna forma de usar IA.

## Enlaces

- [[009 — La tarjeta de fidelidad informa, no aplica]]
- Bitácora [[14 — Bitácora 2026-09-05]]
