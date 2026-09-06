/**
 * Servidor MCP del consultorio.
 *
 * QUÉ ES ESTO Y POR QUÉ NO ES EL COPILOTO
 * El copiloto (`routes/copiloto.js`) mete la inteligencia DENTRO del sitio: el
 * servidor llama a la API de Anthropic y cada conversación gasta créditos por
 * fichas. Esto es lo contrario. Aquí el sitio solo expone las herramientas, y
 * quien piensa es el Claude de la doctora, en su propia aplicación, contra su
 * propia suscripción. El consultorio no paga inferencia.
 *
 * Las dos cosas conviven sin estorbarse y comparten las MISMAS herramientas
 * (`ia/herramientas.js`), que es justo lo que hace barato tener las dos: si
 * mañana se añade una novena, aparece en los dos sitios sola.
 *
 * LA SEGURIDAD ES EL PUNTO DELICADO
 * Estas herramientas escriben en la base de un consultorio médico. Un servidor
 * MCP abierto en internet es una consola de administración abierta en
 * internet.
 *
 * DOS FORMAS DE ENTRAR, Y LA SEGUNDA ES LA BUENA
 *
 *   1. OAuth 2.1 (`mcp/proveedorOauth.js`). Es lo que usa claude.ai, y lo que
 *      permite saber QUIÉN llama, que caduque solo y que se pueda revocar sin
 *      tocar a nadie más. Cada llamada revalida que la cuenta sigue siendo
 *      administradora.
 *
 *   2. `MCP_TOKEN`, un token compartido. Se conserva solo para conectar Claude
 *      Desktop a mano sin montar el intercambio entero. No distingue quién
 *      llama y no caduca: si se filtra hay que rotarlo. Es un atajo de
 *      desarrollo, no la puerta principal.
 *
 * Si no hay NINGUNA de las dos configuradas, el servidor no se monta. Es
 * preferible que la funcionalidad no exista a que exista abierta.
 *
 * SIN SESIONES, A PROPÓSITO
 * El transporte se crea por petición y se descarta. Guardar sesiones obligaría
 * a mantener estado en un servidor que Railway puede reiniciar o duplicar
 * cuando quiera, y estas herramientas no lo necesitan: cada llamada es
 * independiente y va contra la base.
 */

const express = require("express");
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const {
  StreamableHTTPServerTransport,
} = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const {
  requireBearerAuth,
} = require("@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js");
const { DEFINICIONES, ejecutar, escribe } = require("../ia/herramientas");
const { provider } = require("./proveedorOauth");

const router = express.Router();

/**
 * Comprueba el token en tiempo constante.
 *
 * Comparar con `===` sale antes en el primer carácter distinto, y ese tiempo
 * se puede medir para ir adivinando el token carácter a carácter. Con una
 * consola de administración detrás, esa comparación barata no vale la pena.
 */
function tokenValido(recibido) {
  const esperado = process.env.MCP_TOKEN || "";
  if (!esperado || !recibido) return false;
  const crypto = require("crypto");
  const a = Buffer.from(esperado);
  const b = Buffer.from(recibido);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* Primero se intenta el token compartido, y si no cuadra se pasa la petición a
   la validación de OAuth. El orden importa: al revés, `requireBearerAuth`
   respondería 401 con su cabecera `WWW-Authenticate` antes de que el atajo
   tuviera ocasión, y Claude Desktop configurado con `MCP_TOKEN` dejaría de
   funcionar sin explicación aparente.

   `requireBearerAuth` es del SDK a propósito: en el 401 mete la cabecera
   `WWW-Authenticate` apuntando a los metadatos del recurso, que es como
   claude.ai descubre dónde autorizar. Escribir ese 401 a mano y olvidar la
   cabecera daría un conector que "no conecta" sin decir por qué. */
const urlApi = (
  process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`
).replace(/\/+$/, "");

const oauthMiddleware = requireBearerAuth({
  verifier: provider,
  /* Sin esto el 401 sale con `WWW-Authenticate` pero SIN decir donde estan los
     metadatos, y ese puntero es exactamente por donde claude.ai descubre a que
     servidor de autorizacion ir. El conector fallaria con un "no se pudo
     conectar" que no dice nada. Se comprobo que faltaba mirando la cabecera
     cruda de la respuesta. */
  resourceMetadataUrl: `${urlApi}/.well-known/oauth-protected-resource/mcp`,
});

router.use((req, res, next) => {
  const cabecera = req.headers.authorization || "";
  const token = cabecera.startsWith("Bearer ") ? cabecera.slice(7) : "";
  if (process.env.MCP_TOKEN && tokenValido(token)) return next();
  return oauthMiddleware(req, res, next);
});

/**
 * Traduce una herramienta del copiloto al formato de MCP.
 *
 * Los dos usan JSON Schema; lo único que cambia es el nombre del campo
 * (`input_schema` frente a `inputSchema`). Se traduce en vez de duplicar las
 * definiciones para que no puedan divergir: una herramienta que se comporte
 * distinto según por dónde entre sería un fallo muy difícil de ver.
 *
 * A las que escriben se les antepone un aviso en la descripción. El cliente de
 * MCP pide permiso antes de cada llamada, y ese permiso solo sirve de algo si
 * el texto que se lee dice lo que va a pasar.
 */
function aFormatoMcp(def) {
  const aviso = escribe(def.name)
    ? "MODIFICA DATOS DEL CONSULTORIO. "
    : "Solo lectura. ";
  return {
    name: def.name,
    description: aviso + def.description,
    inputSchema: def.input_schema,
  };
}

/**
 * Se usa la clase `Server` de bajo nivel y NO `McpServer`.
 *
 * `McpServer.registerTool` exige que el esquema sea Zod o una "forma cruda", y
 * al pasarle el JSON Schema que ya tienen estas herramientas falla con
 * `inputSchema must be a Zod schema or raw shape`. Se comprobó: el servidor
 * arrancaba, aceptaba la conexión y luego reventaba en silencio dentro de la
 * petición, dejando al cliente colgado sin error visible.
 *
 * `setRequestHandler` pasa el esquema tal cual, que es lo que hace falta
 * cuando las definiciones ya existen en JSON Schema y son compartidas con el
 * copiloto. Convertirlas a Zod significaría mantener dos versiones del mismo
 * esquema, que es justo lo que este diseño evita.
 */
function construirServidor() {
  const servidor = new Server(
    { name: "consultorio-vm", version: "1.0.0" },
    {
      capabilities: { tools: {} },
      instructions:
        "Herramientas del consultorio de la Dra. Vanessa Medina: procedimientos, " +
        "promociones, configuración del sitio y consulta de citas. " +
        "Las que modifican datos lo dicen al principio de su descripción. " +
        "Antes de cambiar un precio o una promoción, confirma con la doctora " +
        "el valor exacto: aquí no hay deshacer.",
    }
  );

  servidor.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: DEFINICIONES.map(aFormatoMcp),
  }));

  servidor.setRequestHandler(CallToolRequestSchema, async (peticion) => {
    const { name, arguments: args } = peticion.params;
    try {
      const resultado = await ejecutar(name, args || {});
      return {
        content: [{ type: "text", text: JSON.stringify(resultado, null, 2) }],
      };
    } catch (err) {
      /* El error se devuelve COMO RESULTADO y con `isError`, no lanzando.
         Lanzar rompe la conversación entera; devolverlo deja que Claude lo
         lea, se lo explique a la doctora y pruebe otra cosa. */
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  });

  return servidor;
}

router.post("/", async (req, res) => {
  const servidor = construirServidor();
  const transporte = new StreamableHTTPServerTransport({
    /* Sin identificador de sesión: cada petición se basta sola. Ver la nota de
       arriba sobre por qué no se guarda estado. */
    sessionIdGenerator: undefined,
    /* OBLIGATORIO aquí, aunque parezca un detalle de formato.

       Por defecto el transporte responde abriendo un canal de eventos y lo
       deja abierto esperando más mensajes de la sesión. Sin sesiones no llega
       ninguno, así que la respuesta nunca se cierra y el cliente se queda
       colgado en el saludo inicial: sin error, sin tiempo de espera, sin nada
       que depurar. Se comprobó exactamente así.

       Con esto responde un JSON normal y cierra, que es lo que corresponde
       cuando cada petición es independiente. */
    enableJsonResponse: true,
  });

  /* Cerrar los dos al terminar la respuesta. Sin esto cada petición deja un
     transporte vivo, y en un servidor de larga vida eso es una fuga de memoria
     que solo se nota semanas después. */
  res.on("close", () => {
    transporte.close().catch(() => {});
    servidor.close().catch(() => {});
  });

  try {
    await servidor.connect(transporte);
    await transporte.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("Error en el servidor MCP:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "error interno del servidor MCP" });
    }
  }
});

/* GET y DELETE existen en el protocolo para el canal de eventos y para cerrar
   sesión. Sin sesiones no hay nada que servir ni que cerrar, así que se
   responde con el error que el protocolo espera en vez de un 404, que un
   cliente interpretaría como "la dirección está mal". */
const noSoportado = (_req, res) =>
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Este servidor no mantiene sesiones." },
    id: null,
  });

router.get("/", noSoportado);
router.delete("/", noSoportado);

module.exports = router;
